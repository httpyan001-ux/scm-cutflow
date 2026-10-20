"use client";

import { useEffect, useRef, useState } from "react";
import type { FactionDef } from "@/lib/factions";
import { EMOTIONS, LANGS, SAMPLE_MAX_SEC, SAMPLE_MIN_SEC, SCRIPT_MAX, VOICE_VAULT, type EmotionId } from "@/lib/voiceclone";
import { EmberCanvas, useTaskPoll } from "./forge-ui";
import { ExportBar } from "./export-bar";

const AC = "#C77DFF";
const BC = "#FF2E9A";

interface Voiceprint {
  id: string; label: string; durationSec: number; quality: number; snr: number;
  pitchHz: number; timbre: string; myTimbre: string; usableFor: string[];
  warnings: string[]; myWarnings: string[];
}

type Src = "mic" | "upload" | "vault";

const STAGES = [
  { at: 0, n: "VOICEPRINT LOAD", my: "အသံလက်ဗွေ ဖတ်နေသည်", i: "🎙" },
  { at: 20, n: "PHONEME MAP", my: "အသံထွက် ပုံဖော်နေသည်", i: "◉" },
  { at: 42, n: "PROSODY WEAVE", my: "သံစဉ် ရက်လုပ်နေသည်", i: "≋" },
  { at: 64, n: "EMOTION LAYER", my: "ခံစားချက် ထည့်နေသည်", i: "☺" },
  { at: 84, n: "MASTER CHAIN", my: "အသံချိန်ညှိနေသည်", i: "◆" },
  { at: 100, n: "SEALED", my: "ပြီးမြောက်ပြီ", i: "✓" },
];

/* ============ VOICEPRINT REACTOR ============ */
function VoiceReactor({ progress, done, voiceName, emotion, lines }: { progress: number; done: boolean; voiceName: string; emotion: string; lines: number }) {
  const p = done ? 100 : Math.max(0, Math.min(100, Math.round(progress)));
  let st = STAGES[0];
  for (const x of STAGES) if (p >= x.at) st = x;
  const C = 2 * Math.PI * 72;

  return (
    <div className="relative overflow-hidden rounded-[26px] border bg-[#140726]" style={{ borderColor: `${AC}66` }}>
      <EmberCanvas colorA={AC} colorB={BC} density={done ? 80 : 55} className="absolute inset-0 h-full w-full" />
      <div className="holo-lines absolute inset-0 opacity-50" />

      <div className="relative flex items-center gap-2 border-b border-white/10 bg-black/60 px-3 py-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[14px] text-black" style={{ background: AC }}>🎙</span>
        <span className="mono truncate text-[10px] font-bold tracking-[0.2em] text-white/70">{voiceName} · {emotion.toUpperCase()}</span>
        <span className={`mono ml-auto shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold ${done ? "bg-lime-300/20 text-lime-200" : "bg-white/10 text-white/70"}`}>
          <span className={done ? "" : "blink"}>●</span> {done ? "SEALED" : "SYNTH"}
        </span>
      </div>

      <div className="relative mx-auto grid place-items-center py-3" style={{ width: 200, height: 200 }}>
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="100" cy="100" r="72" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="8" />
          <circle cx="100" cy="100" r="72" fill="none" stroke="url(#vg)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - p / 100)}
            style={{ filter: `drop-shadow(0 0 10px ${AC})`, transition: "stroke-dashoffset .8s cubic-bezier(.2,.9,.25,1)" }} />
          <defs><linearGradient id="vg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={AC} /><stop offset="100%" stopColor={BC} /></linearGradient></defs>
        </svg>
        {!done && <span className="shock-ring absolute inset-7 rounded-full border-2" style={{ borderColor: AC }} />}
        <div className={`absolute grid h-[108px] w-[108px] place-items-center rounded-full border bg-black/85 text-center ${done ? "" : "core-pulse"}`}
          style={{ borderColor: `${AC}99`, boxShadow: `0 0 38px ${AC}55` }}>
          <div>
            <p className="display text-[30px] font-black leading-none tabular-nums" style={{ color: done ? "#bef264" : "#fff" }}>{done ? "✓" : p}<span className="text-[13px]">{done ? "" : "%"}</span></p>
            <p className="mono mt-0.5 text-[8px] tracking-[0.24em]" style={{ color: AC }}>{st.i} {st.n}</p>
            <p className="my text-[9.5px] text-white/55">{st.my}</p>
          </div>
        </div>
      </div>

      {/* live waveform */}
      <div className="relative mx-3 mb-3 rounded-2xl border border-white/10 bg-black/70 p-2.5">
        <div className="flex h-[40px] items-center gap-[2px]">
          {Array.from({ length: 44 }).map((_, i) => (
            <span key={i} className="w-full origin-center rounded-full" style={{
              height: `${8 + Math.abs(Math.sin(i * 0.7 + p / 14)) * 30}px`,
              background: `linear-gradient(180deg, ${AC}, ${BC})`,
              animation: done ? "none" : `barsRise ${0.5 + (i % 6) * 0.11}s ease-in-out infinite`,
              animationDelay: `${(i % 9) * 0.06}s`,
              opacity: (i / 44) * 100 <= p ? 1 : 0.25,
            }} />
          ))}
        </div>
        <div className="mono mt-1.5 flex flex-wrap gap-x-2 text-[9px] text-white/50">
          <span>48kHz · 24-bit</span><span>{lines} lines</span><span className="ml-auto">{p}/100</span>
        </div>
      </div>
    </div>
  );
}

/* ============ MAIN STUDIO ============ */
export function VoiceCloneStudio({ f, vault, gpuCost, onOpenCredits, onDone }: {
  f: FactionDef; vault: number; gpuCost: number; onOpenCredits: () => void; onDone?: () => void;
}) {
  const [src, setSrc] = useState<Src>("mic");
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array.from({ length: 30 }).map(() => 6));
  const [sampleUrl, setSampleUrl] = useState("");
  const [sampleName, setSampleName] = useState("");
  const [sampleDur, setSampleDur] = useState(0);
  const [noisy, setNoisy] = useState(false);
  const [gender, setGender] = useState("neutral");
  const [voiceprint, setVoiceprint] = useState<Voiceprint | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [vaultVoice, setVaultVoice] = useState(VOICE_VAULT[0].id);
  const [script, setScript] = useState("မင်္ဂလာပါ။ ဒီအသံက ကျွန်တော့်ရဲ့ ကိုယ်ပိုင်အသံ ဖြစ်ပါတယ်။");
  const [emotion, setEmotion] = useState<EmotionId>("neutral");
  const [language, setLanguage] = useState("my");
  const [pitch, setPitch] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [gpu, setGpu] = useState(false);

  const [taskId, setTaskId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const live = useTaskPoll(taskId);
  const done = live?.status === "completed";
  const result = (live?.result ?? {}) as Record<string, any>;

  const mediaRec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const analyser = useRef<{ ctx: AudioContext; raf: number } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const total = f.cost + (gpu ? gpuCost : 0);

  useEffect(() => { if (done) onDone?.(); }, [done, onDone]);
  useEffect(() => { if (taskId) setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 180); }, [taskId]);
  useEffect(() => () => stopRec(), []);

  const stopRec = () => {
    try { mediaRec.current?.stop(); } catch {}
    mediaRec.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (analyser.current) { cancelAnimationFrame(analyser.current.raf); analyser.current.ctx.close().catch(() => {}); analyser.current = null; }
    setRecording(false);
  };

  const startRec = async () => {
    setErr(null);
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      stream.current = st;
      chunks.current = [];
      const mr = new MediaRecorder(st);
      mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setSampleUrl(URL.createObjectURL(blob));
        setSampleName("mic-recording.webm");
      };
      mr.start();
      mediaRec.current = mr;
      setRecording(true);
      setRecSec(0);
      timer.current = setInterval(() => setRecSec((s) => {
        const n = s + 1;
        if (n >= SAMPLE_MAX_SEC) { finishRec(n); return SAMPLE_MAX_SEC; }
        return n;
      }), 1000);

      // level meter
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const an = ctx.createAnalyser();
      an.fftSize = 64;
      ctx.createMediaStreamSource(st).connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      let quiet = 0, loud = 0;
      const loop = () => {
        an.getByteFrequencyData(data);
        const vals = Array.from({ length: 30 }).map((_, i) => 5 + (data[Math.floor((i / 30) * data.length)] ?? 0) / 255 * 34);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        if (avg < 8) quiet++; else loud++;
        setNoisy(quiet > 0 && loud > 0 && quiet / Math.max(1, loud) > 1.8);
        setLevels(vals);
        analyser.current = { ctx, raf: requestAnimationFrame(loop) };
      };
      loop();
    } catch {
      setErr("🎙 Mic ခွင့်ပြုချက် မရပါ — browser setting စစ်ပါ သို့ ဖိုင်တင်ပါ။");
    }
  };

  const finishRec = (secs?: number) => {
    const d = secs ?? recSec;
    stopRec();
    setSampleDur(d);
    setTimeout(() => analyze(d, "mic-recording"), 400);
  };

  const pickFile = (fl: FileList | null) => {
    if (!fl?.[0]) return;
    const file = fl[0];
    const url = URL.createObjectURL(file);
    setSampleUrl(url); setSampleName(file.name); setSrc("upload");
    const a = new Audio(url);
    a.onloadedmetadata = () => {
      const d = Math.min(SAMPLE_MAX_SEC, Math.round(a.duration || 0));
      setSampleDur(d);
      analyze(d, file.name.replace(/\.[^.]+$/, ""));
    };
  };

  const analyze = async (dur: number, label: string) => {
    setAnalyzing(true); setErr(null);
    try {
      const r = await fetch("/api/v1/voice/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, durationSec: dur, noisy, gender }),
      });
      const j = await r.json();
      if (r.ok && j.voiceprint) setVoiceprint(j.voiceprint);
      else setErr(j.message || "စစ်ဆေးမရပါ");
    } catch { setErr("ကွန်ရက်မှား"); }
    setAnalyzing(false);
  };

  const dispatch = async () => {
    setErr(null);
    if (!script.trim()) { setErr("📝 ပြောစေချင်သော စာသား ထည့်ပါ။"); return; }
    if (src !== "vault" && !voiceprint) { setErr("🎙 အသံနမူနာ အရင်သွင်းပါ (သို့) Vault voice ရွေးပါ။"); return; }
    if (vault < total) { onOpenCredits(); return; }
    setBusy(true);
    try {
      const vv = VOICE_VAULT.find((v) => v.id === vaultVoice);
      const r = await fetch(f.route, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: script.trim(), emotion, language, pitch, speed, gpu, renderMode: gpu ? "gpu" : "cpu",
          ...(src === "vault"
            ? { voiceName: vv?.name, gender: vv?.gender }
            : { sampleDuration: sampleDur, voiceLabel: voiceprint?.label, noisy, gender, voiceName: voiceprint?.label }),
          fileName: sampleName || `${vaultVoice}-voice.wav`,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        if (j.error === "INSUFFICIENT_CREDITS") { setErr(`⚡ ${j.message}`); onOpenCredits(); }
        else setErr(j.message || "ထုတ်မရပါ");
        setBusy(false); return;
      }
      setTaskId(j.taskId || j.task_id);
    } catch { setErr("Uplink fault — retry"); }
    setBusy(false);
  };

  const qColor = (q: number) => (q >= 80 ? "#7CFC00" : q >= 60 ? "#fbbf24" : "#ff2e4c");
  const em = EMOTIONS.find((e) => e.id === emotion)!;

  return (
    <div className="space-y-3">
      {/* BANNER */}
      <div className="relative overflow-hidden rounded-[26px] border bg-gradient-to-br from-[#1a0a2e] to-black" style={{ borderColor: `${AC}55` }}>
        <EmberCanvas colorA={AC} colorB={BC} density={34} className="absolute inset-0 h-full w-full opacity-70" />
        <div className="relative flex items-center gap-3 p-4">
          <span className="core-pulse grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[26px] text-black" style={{ background: `linear-gradient(135deg, ${AC}, ${BC})` }}>🎙</span>
          <div className="min-w-0">
            <p className="mono text-[9px] tracking-[0.3em]" style={{ color: AC }}>◉ VOICEPRINT · EMOTION TTS</p>
            <h2 className="display text-[20px] font-black leading-tight">VOICE CLONE</h2>
            <p className="my text-[11.5px] text-white/60">ကိုယ်ပိုင်အသံ ပွားယူ၍ စာသားမှန်သမျှ ပြောစေမည်</p>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-1.5 px-4 pb-4">
          {[["10–60s", "နမူနာ"], ["6", "ခံစားချက်"], ["48kHz", "master"]].map(([a, b]) => (
            <div key={b} className="rounded-xl border border-white/12 bg-black/50 px-2 py-1.5 text-center">
              <p className="mono text-[10.5px] font-bold" style={{ color: AC }}>{a}</p>
              <p className="my text-[9.5px] text-white/50">{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 1 · SOURCE */}
      <section className="rounded-3xl border border-white/12 bg-black/55 p-3">
        <p className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.26em] text-white/50">
          <span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: AC }}>1</span> VOICE SOURCE
        </p>
        <div className="mb-2 grid grid-cols-3 gap-1.5">
          {([["mic", "◉ MIC"], ["upload", "⬆ FILE"], ["vault", "◆ VAULT"]] as [Src, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setSrc(k)} className={`mono rounded-xl border py-2.5 text-[11.5px] font-black active:scale-95 ${src === k ? "text-black" : "border-white/12 bg-white/5 text-white/55"}`}
              style={src === k ? { background: `linear-gradient(135deg, ${AC}, ${BC})`, borderColor: "transparent" } : undefined}>{l}</button>
          ))}
        </div>

        {src === "mic" && (
          <div className="rounded-2xl border border-white/12 bg-black/60 p-3 text-center">
            <span className="relative mx-auto grid h-[86px] w-[86px] place-items-center">
              {recording && <><span className="shock-ring absolute inset-0 rounded-full border-2" style={{ borderColor: AC }} /><span className="shock-ring absolute inset-0 rounded-full border" style={{ borderColor: BC, animationDelay: ".9s" }} /></>}
              <button onClick={() => (recording ? finishRec() : startRec())}
                className={`relative grid h-[64px] w-[64px] place-items-center rounded-full text-[24px] text-black active:scale-95 ${recording ? "" : "core-pulse"}`}
                style={{ background: recording ? "#fff" : `linear-gradient(135deg, ${AC}, ${BC})`, boxShadow: `0 0 34px ${AC}88` }}>
                {recording ? "■" : "◉"}
              </button>
            </span>
            <p className="display mt-2 text-[14px] font-black">{recording ? `● ${recSec}s / ${SAMPLE_MAX_SEC}s` : "နှိပ်၍ အသံသွင်းပါ"}</p>
            <p className="my text-[11px] text-white/55">{recording ? "ပုံမှန်အတိုင်း စကားပြောပါ…" : `အနည်းဆုံး ${SAMPLE_MIN_SEC} စက္ကန့် · အကောင်းဆုံး ၂၀–၄၅ စက္ကန့်`}</p>
            <div className="mt-2 flex h-[38px] items-center gap-[2px] rounded-xl border border-white/10 bg-black/60 px-2">
              {levels.map((h, i) => <span key={i} className="w-full rounded-full" style={{ height: `${recording ? h : 5}px`, background: `linear-gradient(180deg, ${AC}, ${BC})`, transition: "height .1s" }} />)}
            </div>
            {recording && (
              <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all" style={{ width: `${(recSec / SAMPLE_MAX_SEC) * 100}%`, background: recSec >= SAMPLE_MIN_SEC ? "#7CFC00" : "#fbbf24" }} />
              </div>
            )}
          </div>
        )}

        {src === "upload" && (
          <>
            <input ref={fileRef} type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => pickFile(e.target.files)} />
            {!sampleUrl ? (
              <button onClick={() => fileRef.current?.click()} className="cyber-frame relative flex w-full flex-col items-center gap-1 overflow-hidden rounded-2xl border border-white/12 bg-black/70 px-4 py-6" style={{ ["--ac" as string]: AC }}>
                <span className="cyber-corner cc-tl" /><span className="cyber-corner cc-tr" /><span className="cyber-corner cc-bl" /><span className="cyber-corner cc-br" />
                <div className="scan-beam" />
                <span className="relative grid h-[52px] w-[52px] place-items-center rounded-2xl text-[22px] text-black" style={{ background: `linear-gradient(135deg, ${AC}, ${BC})` }}>⬆</span>
                <span className="display mt-1 text-[14px] font-bold">အသံဖိုင် တင်ပါ</span>
                <span className="mono text-[10px] text-white/50">MP3 · WAV · M4A · MP4 — {SAMPLE_MIN_SEC}–{SAMPLE_MAX_SEC}s</span>
              </button>
            ) : (
              <div className="rounded-2xl border border-white/12 bg-black/60 p-2.5">
                <p className="mono mb-1 truncate text-[11px] text-white/70">◈ {sampleName} · {sampleDur}s</p>
                <audio src={sampleUrl} controls className="w-full" />
              </div>
            )}
          </>
        )}

        {src === "vault" && (
          <div className="grid grid-cols-2 gap-1.5">
            {VOICE_VAULT.map((v) => {
              const on = v.id === vaultVoice;
              return (
                <button key={v.id} onClick={() => setVaultVoice(v.id)} className={`rounded-xl border p-2 text-left active:scale-95 ${on ? "" : "border-white/12 bg-white/[0.03]"}`}
                  style={on ? { borderColor: AC, background: `${AC}18` } : undefined}>
                  <p className="text-[12px] font-black">{v.name} <span className="my text-[10px] font-medium text-white/55">{v.myName}</span></p>
                  <p className="my text-[9.5px] text-white/50">{v.myTone}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* sample player + voiceprint */}
        {src !== "vault" && sampleUrl && src === "mic" && (
          <div className="mt-2 rounded-xl border border-white/10 bg-black/50 p-2">
            <audio src={sampleUrl} controls className="w-full" />
          </div>
        )}

        {analyzing && <p className="mono mt-2 text-center text-[11px] text-white/55">◌ voiceprint ဖန်တီးနေသည်…</p>}

        {voiceprint && src !== "vault" && (
          <div className="rise mt-2 rounded-2xl border p-3" style={{ borderColor: `${qColor(voiceprint.quality)}66`, background: `${qColor(voiceprint.quality)}0f` }}>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[18px] text-black" style={{ background: qColor(voiceprint.quality) }}>◉</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-black">VOICEPRINT · {voiceprint.quality}%</span>
                <span className="my block text-[10px] text-white/55">{voiceprint.myTimbre} · {voiceprint.pitchHz}Hz · SNR {voiceprint.snr}dB</span>
              </span>
              <span className="mono shrink-0 text-[10px] text-white/45">{voiceprint.durationSec}s</span>
            </div>
            <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-all" style={{ width: `${voiceprint.quality}%`, background: `linear-gradient(90deg, ${qColor(voiceprint.quality)}, #fff)` }} />
            </div>
            {voiceprint.myWarnings.map((w, i) => (
              <p key={i} className="my mt-1 text-[10.5px] leading-[1.7] text-white/60">• {w}</p>
            ))}
          </div>
        )}
      </section>

      {/* 2 · SCRIPT */}
      <section className="rounded-3xl border border-white/12 bg-black/55 p-3">
        <p className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.26em] text-white/50">
          <span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: AC }}>2</span> SCRIPT · ပြောစေချင်သော စာသား
        </p>
        <textarea value={script} onChange={(e) => setScript(e.target.value.slice(0, SCRIPT_MAX))} rows={5}
          placeholder="မင်္ဂလာပါ…" className="search-glow my w-full rounded-2xl border border-white/15 bg-black/70 px-3 py-2.5 text-[13.5px] leading-[1.75]" style={{ ["--ac" as string]: AC }} />
        <div className="mono mt-1 flex items-center gap-2 text-[9.5px]">
          <span className={script.length > SCRIPT_MAX - 150 ? "text-amber-300" : "text-white/45"}>{script.length}/{SCRIPT_MAX}</span>
          <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full" style={{ width: `${(script.length / SCRIPT_MAX) * 100}%`, background: AC }} />
          </span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {LANGS.map((l) => (
            <button key={l.id} onClick={() => setLanguage(l.id)} className={`mono flex-1 rounded-xl border py-2 text-[10.5px] font-bold active:scale-95 ${language === l.id ? "text-black" : "border-white/12 bg-white/5 text-white/55"}`}
              style={language === l.id ? { background: AC, borderColor: "transparent" } : undefined}>{l.name}</button>
          ))}
        </div>
      </section>

      {/* 3 · EMOTION + TUNING */}
      <section className="rounded-3xl border border-white/12 bg-black/55 p-3">
        <p className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.26em] text-white/50">
          <span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: AC }}>3</span> EMOTION · ခံစားချက်
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {EMOTIONS.map((e) => {
            const on = e.id === emotion;
            return (
              <button key={e.id} onClick={() => setEmotion(e.id)} className={`rounded-xl border px-1 py-2 text-center active:scale-95 ${on ? "" : "border-white/12 bg-white/[0.03]"}`}
                style={on ? { borderColor: AC, background: `${AC}1c`, boxShadow: `0 0 16px ${AC}44` } : undefined}>
                <span className="block text-[15px]">{e.glyph}</span>
                <span className="mono block text-[9.5px] font-bold" style={{ color: on ? AC : "rgba(255,255,255,.6)" }}>{e.name}</span>
                <span className="my block text-[9px] text-white/45">{e.my}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 space-y-2">
          <label className="block">
            <span className="mono mb-1 flex items-center text-[9.5px] uppercase tracking-[0.18em] text-white/50">Pitch<span className="my ml-1 normal-case tracking-normal text-white/35">· အနိမ့်အမြင့်</span><span className="ml-auto font-bold" style={{ color: AC }}>{pitch > 0 ? "+" : ""}{pitch}</span></span>
            <input type="range" min={-12} max={12} step={1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="dur-slider w-full" style={{ ["--ac" as string]: AC }} />
          </label>
          <label className="block">
            <span className="mono mb-1 flex items-center text-[9.5px] uppercase tracking-[0.18em] text-white/50">Speed<span className="my ml-1 normal-case tracking-normal text-white/35">· အမြန်နှုန်း</span><span className="ml-auto font-bold" style={{ color: AC }}>{speed.toFixed(2)}×</span></span>
            <input type="range" min={0.5} max={1.6} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="dur-slider w-full" style={{ ["--ac" as string]: AC }} />
          </label>
        </div>
        <label className="mt-2 flex items-center gap-2.5 rounded-2xl border border-amber-300/30 bg-amber-400/[0.07] p-2.5">
          <button onClick={() => setGpu((g) => !g)} className="forge-switch" data-on={gpu} role="switch" aria-checked={gpu} style={{ ["--ac" as string]: "#fbbf24", ["--bc" as string]: "#fb923c" }} />
          <span className="min-w-0"><span className="block text-[12px] font-black text-amber-100">⚡ GPU TURBO</span><span className="my block text-[10px] text-white/50">+{gpuCost} CR · ၂.၄× မြန်</span></span>
        </label>
      </section>

      {err && <div className="rise rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-[12.5px] font-semibold text-red-100">{err}</div>}

      {/* INVOICE + RUN */}
      <section className="overflow-hidden rounded-[24px] border border-white/12 bg-black/70">
        <div className="mono flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-white/10 px-3 py-2 text-[10px] text-white/55">
          <span>{src === "vault" ? "◆ VAULT" : voiceprint ? `◉ ${voiceprint.quality}%` : "◉ no print"}</span>
          <span>{em.glyph} {em.my}</span><span>⏱ ~{Math.max(1, Math.round(script.length / 14))}s</span>
          <span className="ml-auto">VAULT ⚡ {vault} CR</span>
        </div>
        <div className="p-2">
          <button onClick={dispatch} disabled={busy}
            className="btn-bevel w-full rounded-2xl py-4 text-[14.5px] font-black text-black disabled:opacity-40"
            style={{ ["--ac" as string]: AC, background: `linear-gradient(135deg, ${AC}, #fff, ${BC})` }}>
            {busy ? "◌ ထုတ်နေသည်…" : vault < total ? "⚡ BUY CR" : `🎙 CLONE & SPEAK · ${total} CR`}
          </button>
          <p className="my mt-1.5 text-center text-[10px] text-white/45">Voiceprint → phoneme → prosody → emotion → 48kHz master</p>
        </div>
      </section>

      {/* REACTOR + RESULT */}
      {taskId && (
        <div ref={endRef} className="rise">
          <VoiceReactor progress={live?.progress ?? 0} done={!!done} voiceName={result.voiceName || voiceprint?.label || "Voice"} emotion={emotion} lines={(result.lines || []).length} />
          {done && (
            <div className="rise mt-2 space-y-2">
              <div className="rounded-[24px] border border-lime-300/35 bg-black/70 p-3.5">
                <p className="mono text-[9.5px] tracking-[0.3em] text-lime-300">◆ VOICE MASTER · SEALED</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[["⏱", `${result.totalSeconds || 0}s`], ["🎚", result.toneLock || "—"], ["📻", "48kHz"]].map(([a, b]) => (
                    <div key={a} className="mono rounded-xl bg-black/50 px-2 py-1.5 text-center text-[11px]"><span className="text-white/45">{a}</span> <b style={{ color: AC }}>{b}</b></div>
                  ))}
                </div>
                <div className="thin-scroll mt-2 max-h-[180px] space-y-1 overflow-y-auto">
                  {(result.lines || []).map((l: Record<string, any>) => (
                    <div key={l.idx} className="rounded-xl bg-black/50 px-2.5 py-1.5">
                      <p className="mono text-[9.5px] text-white/45">[{String(Math.floor(l.start / 60)).padStart(2, "0")}:{String(Math.floor(l.start % 60)).padStart(2, "0")}] {l.emotion}</p>
                      <p className="my text-[11.5px] leading-[1.7] text-white/80">{l.text}</p>
                    </div>
                  ))}
                </div>
                {Array.isArray(result.stems) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.stems.map((s: string) => <span key={s} className="mono rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: AC, color: AC }}>{s}</span>)}
                  </div>
                )}
              </div>

              <ExportBar factionName={f.name} slug={f.slug} result={result} accent={AC} accent2={BC} />

              <button onClick={() => setTaskId(null)} className="mono w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[12.5px] font-bold active:scale-95">＋ ထပ်မံထုတ်မည် · NEW RUN</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
