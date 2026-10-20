"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FactionDef } from "@/lib/factions";
import { DEFAULT_ASPECT, durationSpec, fmtDuration, fmtDurationMy, offlineSummarize, toSRT } from "@/lib/studio";
import { EmberCanvas } from "./forge-ui";
import { AspectPicker, DurationSlider } from "./forge-controls";
import { ExportBar } from "./export-bar";
import { ShieldPicker, ScanRadar, type ScanReportLite } from "./copyright-scanner";
import { OverlayStudio } from "./overlay-studio";
import type { StudioPrefs } from "@/lib/studio-prefs-client";
import type { ShieldLevel } from "@/lib/copyright";

/* Web Speech types */
declare global {
  interface Window { webkitSpeechRecognition?: new () => SpeechRecognitionLike; SpeechRecognition?: new () => SpeechRecognitionLike; }
}
interface SpeechRecognitionLike {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } }; length: number } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}

type SrcTab = "upload" | "mic" | "text";

export function RecapStudio({ f, onOpenProfile, gpuCost = 6, vault = 0, isPro = false }: { f: FactionDef; onOpenProfile: (tab?: string) => void; gpuCost?: number; vault?: number; isPro?: boolean }) {
  const recapSpec = durationSpec("recap")!;
  const [forgeBusy, setForgeBusy] = useState(false);
  const [forgeGpu, setForgeGpu] = useState(false);
  const [forgeMsg, setForgeMsg] = useState<string | null>(null);
  const [target, setTarget] = useState(recapSpec.def);
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const [shieldLevel, setShieldLevel] = useState<ShieldLevel>("standard");
  const [scan, setScan] = useState<ScanReportLite | null>(null);
  const [scanning, setScanning] = useState(false);
  const [overlay, setOverlay] = useState<{ prefs: StudioPrefs | null; logoUrl: string }>({ prefs: null, logoUrl: "" });
  const [tab, setTab] = useState<SrcTab>("upload");
  const [file, setFile] = useState<{ url: string; name: string; type: string; size: number } | null>(null);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [capturePlayback, setCapturePlayback] = useState(true);
  const [liveInterim, setLiveInterim] = useState("");
  const [sttSupport, setSttSupport] = useState(true);
  const [summStyle, setSummStyle] = useState("Cinematic beats");
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState<"cloud" | "offline" | null>(null);
  const [keySource, setKeySource] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [result, setResult] = useState<{ bullets: string[]; chapters: { t: string; title: string; score: number }[]; keywords: string[]; reading: string } | null>(null);
  const [aiStatus, setAiStatus] = useState<{ serverHasKey: boolean; userHasKey: boolean; provider: string } | null>(null);
  const [recSecs, setRecSecs] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array.from({ length: 28 }).map(() => 8));

  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLVideoElement | null>(null);
  const analyserRef = useRef<{ ctx: AudioContext; analyser: AnalyserNode; raf: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSttSupport(Boolean(typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)));
    fetch("/api/ai/summarize").then((r) => r.json()).then(setAiStatus).catch(() => {});
    return () => { stopAll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAll = () => {
    try { recogRef.current?.stop(); } catch {}
    recogRef.current = null;
    try { mediaRef.current?.stop(); } catch {}
    mediaRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (analyserRef.current) { cancelAnimationFrame(analyserRef.current.raf); analyserRef.current.ctx.close().catch(() => {}); analyserRef.current = null; }
    setListening(false);
  };

  /* live level meter from mic or element */
  const attachLevels = useCallback(async (stream?: MediaStream, el?: HTMLMediaElement | null) => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      if (stream) {
        const src = ctx.createMediaStreamSource(stream);
        src.connect(analyser);
      } else if (el) {
        const src = ctx.createMediaElementSource(el);
        src.connect(analyser);
        analyser.connect(ctx.destination);
      } else return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(data);
        const vals = Array.from({ length: 28 }).map((_, i) => 6 + (data[Math.floor((i / 28) * data.length)] ?? 0) / 255 * 40);
        setLevels(vals);
        analyserRef.current = { ctx, analyser, raf: requestAnimationFrame(loop) };
      };
      loop();
    } catch { /* meter optional */ }
  }, []);

  const startListening = useCallback(async (opts?: { fromMic?: boolean }) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSttSupport(false); return; }
    stopAll();
    try {
      if (opts?.fromMic !== false) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        streamRef.current = stream;
        attachLevels(stream);
        const mr = new MediaRecorder(stream);
        mediaRef.current = mr;
        mr.start();
      }
      const rec = new SR();
      rec.lang = "my-MM";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let finalTxt = "";
        let interim = "";
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i][0]?.transcript || "";
          // heuristic: last result interim, rest final — SpeechRecognition marks isFinal but our type is loose
          if (i === e.results.length - 1 && (e.results as unknown as { isFinal?: boolean[] }) && false) { /* noop */ }
          if (i < e.results.length - 1) finalTxt += r + " ";
          else interim = r;
        }
        if (finalTxt.trim()) {
          setTranscript((prev) => (prev ? prev.replace(/\s+$/, " ") + " " + finalTxt.trim() : finalTxt.trim()));
          setLiveInterim(interim);
        } else setLiveInterim(interim);
      };
      rec.onerror = (ev) => {
        if (ev.error === "not-allowed" || ev.error === "service-not-allowed") { stopAll(); }
        // network errors auto-fallback: keep transcript, stay in offline mode
      };
      rec.onend = () => {
        // auto-restart while user still wants to listen (fallback resilience)
        if (recogRef.current) { try { rec.start(); } catch {} }
      };
      recogRef.current = rec;
      rec.start();
      setListening(true);
      setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs((s) => s + 1), 1000);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setSttSupport(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachLevels]);

  const stopListening = () => {
    if (liveInterim.trim()) setTranscript((p) => (p ? p + " " + liveInterim.trim() : liveInterim.trim()));
    setLiveInterim("");
    stopAll();
  };

  const onFile = (files: FileList | null) => {
    if (!files?.[0]) return;
    const fl = files[0];
    const url = URL.createObjectURL(fl);
    setFile({ url, name: fl.name, type: fl.type, size: fl.size });
    setTab("upload");
  };

  /* when media plays and capturePlayback on → also listen via mic loopback (fallback STT for files, zero key) */
  const onMediaPlay = () => {
    if (capturePlayback && !listening && sttSupport) startListening({ fromMic: true });
  };
  const onMediaPause = () => {
    if (capturePlayback && listening && file) { /* keep listening 2s grace */ }
  };

  const summarize = async () => {
    const txt = (transcript + (liveInterim ? " " + liveInterim : "")).trim();
    if (txt.length < 4) return;
    setBusy(true); setEngine(null); setNote("");
    // instant offline preview (feels instant, then cloud upgrades if key)
    const fast = offlineSummarize(txt, 5);
    setResult(fast);
    try {
      const r = await fetch("/api/ai/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript: txt, style: summStyle, maxBullets: 5 }) });
      const j = await r.json();
      if (r.ok && j.bullets) {
        setResult({ bullets: j.bullets, chapters: j.chapters || fast.chapters, keywords: j.keywords || fast.keywords, reading: j.reading || fast.reading });
        setEngine(j.engine);
        setKeySource(j.keySource || "");
        setNote(j.note || "");
        fetch("/api/ai/summarize").then((x) => x.json()).then(setAiStatus).catch(() => {});
      }
    } catch {
      setEngine("offline");
      setNote("ကွန်ရက်မှား — offline fallback သုံးထားသည်။");
    }
    setBusy(false);
  };

  const forgeJob = async (gpu: boolean) => {
    const txt = transcript.trim();
    if (!txt || !result) return;
    setForgeMsg(null);
    if (gpu) setForgeGpu(true); else setForgeBusy(true);
    try {
      const r = await fetch(f.route, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: summStyle, prompt: txt.slice(0, 600), transcript: txt.slice(0, 2000), fileName: file?.name || "recap-studio-live.txt", engine: engine || "offline", gpu, renderMode: gpu ? "gpu" : "cpu", targetDuration: target, aspect, shieldLevel, overlayPrefs: overlay.prefs ?? undefined, hasLogo: Boolean(overlay.logoUrl) }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (j.error === "PRO_REQUIRED") setForgeMsg("◆ PRO GATE — Profile → PRO payment card မှ ဖွင့်ပါ။");
        else if (j.error === "INSUFFICIENT_CREDITS") { setForgeMsg(`⚡ GPU TURBO အတွက် ${j.cost} CR လို — vault မှာ ${j.balance ?? vault} CR ပဲရှိ။ Credit ဝယ်ပါ။`); onOpenProfile("credits"); }
        else setForgeMsg(j.message || "Forge မရပါ — retry");
      } else {
        setForgeMsg(gpu ? `⚡ GPU-TURBO queue ✓ · ${j.cost} CR · ~2.4× မြန် · Ledger မှာစောင့်` : `⬢ CPU queue ✓ · Ledger / History မှာစောင့်ကြည့်ပါ`);
      }
    } catch { setForgeMsg("Uplink fault — retry"); }
    if (gpu) setForgeGpu(false); else setForgeBusy(false);
  };

  const fmtT = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-3">
      {/* ENGINE BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-black/60 p-3">
        <EmberCanvas colorA={f.primary} colorB={f.secondary} density={26} className="absolute inset-0 h-full w-full opacity-50" />
        <div className="relative flex flex-wrap items-center gap-2">
          <span className={`mono rounded-full px-2.5 py-1 text-[10px] font-bold ${engine === "cloud" ? "bg-sky-300/15 text-sky-200 border border-sky-300/40" : "bg-lime-300/10 text-lime-200 border border-lime-300/30"}`}>
            {engine === "cloud" ? "☁ CLOUD AI" : engine === "offline" ? "⬢ OFFLINE FORGE" : "◈ HYBRID READY"}
          </span>
          <span className="mono text-[10px] text-white/55">
            {aiStatus ? (aiStatus.userHasKey || aiStatus.serverHasKey ? `key: ${aiStatus.userHasKey ? "BYOK ✓" : "server ✓"} · ${aiStatus.provider}` : "no key — mic + offline auto") : "checking engine…"}
            {keySource ? ` · ${keySource}` : ""}
          </span>
          <button onClick={() => onOpenProfile("keys")} className="mono ml-auto rounded-lg border border-white/15 bg-black/60 px-2.5 py-1.5 text-[10.5px] font-bold" style={{ color: f.primary }}>⧉ API KEY / SETTINGS</button>
        </div>
        <p className="my relative mt-1.5 text-[11.5px] leading-[1.7] text-white/60">
          Key မရှိလဲ ရသည် — <b>Mic ဖွင့် → အသံနားထောင် → speak-to-text auto</b> → offline အနှစ်ချုပ်။ Key ဖြည့်တာနဲ့ cloud summary ကို auto အဆင့်မြှင့်မည်။ Error တက်လဲ fallback ပြန်ကျမည် — ဘယ်တော့မှ မပျက်။
        </p>
      </div>

      {/* SOURCE TABS */}
      <div className="grid grid-cols-3 gap-1.5">
        {([["upload", "⬢ FILE"], ["mic", "◉ MIC LIVE"], ["text", "☰ TEXT"]] as [SrcTab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`mono rounded-2xl border py-3 text-[12px] font-bold active:scale-95 ${tab === k ? "text-black" : "border-white/12 bg-white/5 text-white/60"}`} style={tab === k ? { background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})`, borderColor: "transparent", boxShadow: `0 0 22px ${f.glow}` } : undefined}>{l}</button>
        ))}
      </div>

      {/* FILE */}
      {tab === "upload" && (
        <div>
          <input ref={fileInput} type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
          {!file ? (
            <button onClick={() => fileInput.current?.click()} className="cyber-frame relative flex w-full flex-col items-center gap-1 overflow-hidden rounded-3xl border border-white/12 bg-black/70 px-4 py-7" style={{ ["--ac" as string]: f.primary }}>
              <span className="cyber-corner cc-tl" /><span className="cyber-corner cc-tr" /><span className="cyber-corner cc-bl" /><span className="cyber-corner cc-br" />
              <span className="relative grid place-items-center"><span className="spin-slower absolute h-[92px] w-[92px] rounded-full border border-dashed opacity-70" style={{ borderColor: f.primary }} /><span className="iris-pulse grid h-[56px] w-[56px] place-items-center rounded-2xl text-[24px] text-black" style={{ background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})`, boxShadow: `0 0 34px ${f.glow}` }}>◈</span></span>
              <span className="mono mt-1 text-[10px] tracking-[0.3em]" style={{ color: f.primary }}>RECAP INGEST · VIDEO / AUDIO</span>
              <span className="display text-[15px] font-bold">Tap — ဖိုင်ရွေးပါ</span>
              <span className="mono text-[10px] text-white/50">MP4 · MOV · WEBM · MP3 · WAV — ဖွင့်တာနဲ့ mic auto-capture</span>
            </button>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/12 bg-black/70">
              {file.type.startsWith("video") ? (
                <video ref={audioRef as unknown as React.RefObject<HTMLVideoElement>} src={file.url} controls playsInline preload="metadata" className="aspect-video w-full bg-black" onPlay={onMediaPlay} onPause={onMediaPause} />
              ) : (
                <div className="p-4">
                  <p className="truncate mono text-[11px] text-white/60">◈ {file.name}</p>
                  <audio ref={audioRef as unknown as React.RefObject<HTMLAudioElement>} src={file.url} controls className="mt-2 w-full" onPlay={onMediaPlay} onPause={onMediaPause} />
                </div>
              )}
              {/* level meter */}
              <div className="flex h-[44px] items-center gap-[3px] border-t border-white/10 bg-black/60 px-3">
                {levels.map((h, i) => <span key={i} className="w-full rounded-full" style={{ height: `${h}px`, background: `linear-gradient(180deg, ${f.primary}, ${f.secondary})` }} />)}
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
                <label className="mono flex flex-1 items-center gap-2 text-[10.5px] text-white/60">
                  <button onClick={() => setCapturePlayback((s) => !s)} className={`mono rounded-lg border px-2 py-1 text-[10px] font-bold ${capturePlayback ? "text-black" : "border-white/15 text-white/60"}`} style={capturePlayback ? { background: f.primary, borderColor: "transparent" } : undefined}>{capturePlayback ? "◉" : "○"}</button>
                  ဖွင့်သမျှ အသံ auto-capture (no key)
                </label>
                <button onClick={() => setFile(null)} className="mono rounded-lg border border-red-400/40 px-2 py-1 text-[10px] text-red-200">✕ PURGE</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MIC */}
      {tab === "mic" && (
        <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-black/70 p-4 text-center">
          <div className="plasma-drift absolute -left-12 -top-12 h-44 w-44 rounded-full opacity-30 blur-3xl" style={{ background: f.primary }} />
          <span className="relative mx-auto grid h-[92px] w-[92px] place-items-center">
            {listening && <><span className="shock-ring absolute inset-0 rounded-full border-2" style={{ borderColor: f.primary }} /><span className="shock-ring absolute inset-0 rounded-full border" style={{ borderColor: f.secondary, animationDelay: "0.9s" }} /></>}
            <button onClick={() => (listening ? stopListening() : startListening({ fromMic: true }))} className={`relative grid h-[68px] w-[68px] place-items-center rounded-full text-[26px] text-black active:scale-95 ${listening ? "" : "core-pulse"}`} style={{ background: listening ? "#fff" : `linear-gradient(135deg, ${f.primary}, ${f.secondary})`, boxShadow: `0 0 36px ${f.glow}` }}>
              {listening ? "■" : "◉"}
            </button>
          </span>
          <p className="display relative mt-2 text-[15px] font-black">{listening ? `● LISTENING ${fmtT(recSecs)}` : "TAP — နားထောင်ရန်"}</p>
          <p className="my relative text-[11.5px] text-white/55">{listening ? "စကားပြောပါ — မြန်မာ/English auto (Web Speech + offline)" : "mic → speak-to-text → transcript — API key လုံးဝမလို"}</p>
          <div className="relative mt-2 flex h-[40px] items-center gap-[3px] rounded-2xl border border-white/10 bg-black/60 px-3">
            {levels.map((h, i) => <span key={i} className="w-full rounded-full" style={{ height: `${listening ? h : 6}px`, background: `linear-gradient(180deg, ${f.primary}, ${f.secondary})`, transition: "height .12s" }} />)}
          </div>
          {!sttSupport && <p className="mono relative mt-2 rounded-xl border border-amber-300/40 bg-amber-400/10 p-2 text-[10.5px] text-amber-100">ဒီ browser mic-STT မရ — Chrome/Edge သုံးပါ။ Text tab မှ စာရိုက်ထည့်လို့ရသည်။</p>}
        </div>
      )}

      {/* TRANSCRIPT */}
      <div className="rounded-3xl border border-white/10 bg-black/50 p-3">
        <div className="mono mb-1.5 flex items-center justify-between text-[10px] tracking-[0.24em] text-white/50">
          <span>TRANSCRIPT · {words} လုံး {listening ? `· ● ${fmtT(recSecs)}` : ""}</span>
          <span className="flex gap-1.5">
            <button onClick={() => setTranscript("မင်္ဂလာပါ။ ဒီနေ့ ကျွန်တော်တို့ night forge အကြောင်း ပြောပါမယ်။ ပထမအချက် အသံကို အလိုအလျောက်ဖယ်မယ်။ ဒုတိယအချက် စာတန်းထိုးမယ်။ တတိယအချက် ဟိုက်လိုက်ဖြတ်မယ်။ နောက်ဆုံးမှာ export လုပ်ပြီး ပြန်တင်လို့ရတယ်။")} className="rounded-lg border border-white/15 px-2 py-1">SAMPLE</button>
            <button onClick={() => { setTranscript(""); setLiveInterim(""); setResult(null); }} className="rounded-lg border border-white/15 px-2 py-1">CLEAR</button>
          </span>
        </div>
        <textarea value={transcript + (liveInterim ? (transcript ? " " : "") + "⟨" + liveInterim + "…⟩" : "")} onChange={(e) => setTranscript(e.target.value.replace(/⟨.*$/, ""))} rows={5} placeholder="ဒီမှာ စာသားပေါ်မည်… mic ဖွင့်၍ ပြောပါ၊ သို့မဟုတ် ဖိုင်ဖွင့်၍ auto-capture လုပ်ပါ၊ သို့မဟုတ် ကိုယ်တိုင်ရိုက်ထည့်ပါ။" className="my w-full rounded-2xl border border-white/12 bg-black/70 px-3 py-2.5 text-[13.5px] leading-[1.75]" />
        {(tab === "text") && <p className="mono mt-1 text-[10px] text-white/40">စာရိုက်ထည့်ပြီးရင် အောက်က SUMMARY IGNITE နှိပ်ပါ — offline လည်း ရသည်။</p>}
      </div>

      {/* DURATION + ASPECT */}
      <div className="space-y-2">
        <DurationSlider spec={recapSpec} value={target} onChange={setTarget} accent={f.primary} accent2={f.secondary}
          note={`PRO ∞ အခမဲ့ — အများဆုံး ${fmtDuration(recapSpec.max)} ထိ။ ယခုရွေးထား: ${fmtDurationMy(target)}`} />
        <AspectPicker value={aspect} onChange={setAspect} accent={f.primary} accent2={f.secondary} />
        <ShieldPicker value={shieldLevel} onChange={setShieldLevel} accent={f.primary} accent2={f.secondary} />
        <OverlayStudio isPro={isPro} accent={f.primary} accent2={f.secondary} aspect={aspect}
          onOpenPro={() => onOpenProfile("pro")}
          onChange={(prefs, logoUrl) => setOverlay({ prefs, logoUrl })} />
      </div>

      {/* STYLE + IGNITE */}
      <div className="rounded-3xl border border-white/10 bg-black/50 p-3">
        <p className="mono mb-1.5 text-[10px] tracking-[0.24em] text-white/50">RECAP STYLE</p>
        <div className="flex flex-wrap gap-1.5">
          {["Cinematic beats", "Meeting minutes", "Lecture chapters", "Viral highlights"].map((s) => (
            <button key={s} onClick={() => setSummStyle(s)} className={`mono rounded-xl border px-3 py-2 text-[11px] font-bold active:scale-95 ${summStyle === s ? "text-black" : "border-white/12 bg-white/5 text-white/60"}`} style={summStyle === s ? { background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})`, borderColor: "transparent" } : undefined}>{s}</button>
          ))}
        </div>
        <button onClick={summarize} disabled={busy || transcript.trim().length < 4} className="btn-bevel mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[14px] font-black text-black disabled:opacity-40" style={{ ["--ac" as string]: f.primary, background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})` }}>
          {busy ? "◌ WEAVING…" : "◈ SUMMARY IGNITE — KEY ရှိရှိ မရှိရှိ ရမည်"}
        </button>
        {note ? <p className="mono mt-1.5 rounded-xl bg-white/5 px-2.5 py-1.5 text-[10.5px] text-white/60">{engine === "cloud" ? "☁ " : "⬢ "}{note}</p> : null}
      </div>

      {/* RESULT */}
      {result && (
        <div className="flow-border rise overflow-hidden rounded-3xl bg-black/70 p-4" style={{ ["--ac" as string]: f.primary, ["--bc" as string]: f.secondary }}>
          <div className="flex items-center gap-2">
            <span className={`mono rounded-full px-2 py-0.5 text-[10px] font-bold ${engine === "cloud" ? "bg-sky-300/15 text-sky-200 border border-sky-300/40" : "bg-lime-300/10 text-lime-200 border border-lime-300/30"}`}>{engine === "cloud" ? "☁ CLOUD" : "⬢ OFFLINE"}</span>
            <p className="mono text-[10px] text-white/50">{result.reading}</p>
            <span className="mono ml-auto text-[10px]" style={{ color: f.primary }}>✓ SEALED</span>
          </div>
          <p className="mono mt-2 text-[10px] tracking-[0.26em]" style={{ color: f.primary }}>KEY BEATS · အဓိကအချက်</p>
          <ul className="mt-1 space-y-1.5">
            {result.bullets.map((b, i) => (
              <li key={i} className="my flex gap-2 rounded-xl bg-white/5 px-2.5 py-2 text-[13px] leading-[1.7]"><span className="mono shrink-0 font-bold" style={{ color: f.primary }}>{i + 1}</span><span>{b}</span></li>
            ))}
          </ul>
          <p className="mono mt-2.5 text-[10px] tracking-[0.26em]" style={{ color: f.primary }}>CHAPTERS</p>
          <div className="mt-1 space-y-1">
            {result.chapters.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1.5 text-[12px]"><span className="mono font-bold" style={{ color: f.primary }}>{c.t}</span><span className="truncate">{c.title}</span><span className="mono ml-auto text-[10px] text-white/45">{c.score}</span></div>
            ))}
          </div>
          {result.keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.keywords.map((k) => <span key={k} className="mono rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: f.primary, color: f.primary }}>{k}</span>)}
            </div>
          )}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <button onClick={() => { const blob = new Blob([toSRT(transcript)], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "recap.srt"; a.click(); }} className="mono rounded-xl border border-white/15 bg-white/5 py-2.5 text-[11px] font-bold active:scale-95">SRT ⬇</button>
            <button onClick={() => { const blob = new Blob([transcript], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "transcript.txt"; a.click(); }} className="mono rounded-xl border border-white/15 bg-white/5 py-2.5 text-[11px] font-bold active:scale-95">TXT ⬇</button>
            <button onClick={() => { const blob = new Blob([JSON.stringify({ style: summStyle, engine, transcript, result }, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "recap.json"; a.click(); }} className="mono rounded-xl border border-white/15 bg-white/5 py-2.5 text-[11px] font-bold active:scale-95">JSON ⬇</button>
          </div>
          {/* UNIVERSAL EXPORT */}
          <div className="mt-2">
            <ExportBar factionName={f.name} slug={f.slug} accent={f.primary} accent2={f.secondary}
              result={{
                aspect, length: fmtDuration(target), download: `recap-${fmtDuration(target)}-${aspect.replace(":", "x")}.mp4`,
                summary: result.bullets, chapters: result.chapters, entities: result.keywords,
                scriptText: transcript, prompt: summStyle, myTitle: `RECAP · ${fmtDuration(target)}`,
              }} />
          </div>

          {/* COPYRIGHT QUICK CHECK */}
          <div className="mt-2 rounded-2xl border p-3" style={{ borderColor: "#00FFC244", background: "rgba(0,0,0,.55)" }}>
            <div className="mono mb-2 flex flex-wrap items-center gap-x-2 text-[10px] tracking-[0.22em] text-white/55">
              <span style={{ color: "#00FFC2" }}>🛡 COPYRIGHT CHECK</span>
              <span className="my normal-case tracking-normal text-white/40">· မူပိုင်ခွင့် စမ်းစစ်</span>
              <span className="mono ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px]">FREE</span>
            </div>
            {scanning ? (
              <div className="py-1"><ScanRadar progress={70} done={false} /><p className="my mt-1 text-center text-[11.5px] text-white/60">စကင်ဖတ်နေသည်…</p></div>
            ) : scan ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="display text-[22px] font-black" style={{ color: scan.verdict === "SAFE" ? "#7CFC00" : scan.verdict === "REVIEW" ? "#fbbf24" : "#ff2e4c" }}>{scan.verdict}</span>
                  <span className="my text-[12px] text-white/60">{scan.overall}% ဘေးကင်း · {scan.myVerdict}</span>
                  <a href="/faction/copyright" className="mono ml-auto rounded-lg border border-white/15 px-2 py-1 text-[10px]" style={{ color: "#00FFC2" }}>အသေးစိတ် ›</a>
                </div>
                <div className="flex gap-1.5">
                  {scan.platforms.map((pf) => {
                    const c = pf.score >= 82 ? "#7CFC00" : pf.score >= 60 ? "#fbbf24" : "#ff2e4c";
                    return <span key={pf.name} className="mono flex-1 rounded-lg bg-black/50 px-1.5 py-1 text-center text-[9.5px]" style={{ color: c }}>{pf.name} {pf.score}%</span>;
                  })}
                </div>
              </div>
            ) : (
              <button onClick={async () => {
                setScanning(true);
                try {
                  const r = await fetch("/api/v1/copyright/scan", { method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: file?.name || "recap export", shieldLevel, hasMusic: true, hasCommentary: true, hasAttribution: true, totalSec: target, longestClipSec: Math.min(28, Math.round(target * 0.2)) }) });
                  const j = await r.json();
                  if (r.ok) setScan(j.report);
                } catch {}
                setScanning(false);
              }} className="btn-bevel w-full rounded-xl py-3 text-[12.5px] font-black text-black"
                style={{ ["--ac" as string]: "#00FFC2", background: "linear-gradient(135deg,#00FFC2,#fff,#0066FF)" }}>
                🛡 ဒီ Recap ကို စမ်းစစ်မည် (FREE)
              </button>
            )}
          </div>

          {/* RENDER LANE — normal vs GPU */}
          <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-2">
            <div className="mono mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-[9.5px] tracking-[0.22em] text-white/45"><span>◈ RENDER LANE</span><span>◷ {fmtDuration(target)}</span><span>▭ {aspect}</span><span className="ml-auto">VAULT ⚡ {vault} CR</span></div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => forgeJob(false)} disabled={forgeBusy || forgeGpu} className="rounded-2xl border border-white/15 bg-white/5 py-3 text-center active:scale-[0.99] disabled:opacity-50">
                <span className="display block text-[12.5px] font-black">{forgeBusy ? "◌ QUEUE…" : "⬢ FORGE"}</span>
                <span className="mono block text-[9.5px] text-white/50">PRO ∞ · normal</span>
              </button>
              <button onClick={() => (vault < gpuCost ? onOpenProfile("credits") : forgeJob(true))} disabled={forgeBusy || forgeGpu} className="gpu-turbo rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-red-400 py-3 text-center text-black active:scale-[0.99] disabled:opacity-50">
                <span className="display block text-[12.5px] font-black">{forgeGpu ? "◌ TURBO…" : vault < gpuCost ? "⚡ BUY CR" : "⚡ GPU TURBO"}</span>
                <span className="mono block text-[9.5px] font-bold opacity-80">+{gpuCost} CR · 2.4×</span>
              </button>
            </div>
            {forgeMsg ? <p className="mono mt-1.5 rounded-xl bg-white/5 px-2.5 py-1.5 text-[10.5px] text-white/65">{forgeMsg}</p> : <p className="mono mt-1 text-center text-[9.5px] text-white/35">GPU = vault CR ဖြတ် · မရှိရင် credit slider ပွင့်</p>}
          </div>
        </div>
      )}
    </div>
  );
}
