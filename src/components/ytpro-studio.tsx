"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FactionDef } from "@/lib/factions";
import { DEFAULT_ASPECT, YT_TIERS, aspectSpec, durationSpec, fmtDuration, fmtDurationMy, ytTierFor } from "@/lib/studio";
import { AspectPicker, DurationSlider } from "./forge-controls";
import { EmberCanvas, useTaskPoll } from "./forge-ui";
import { ExportBar } from "./export-bar";
import { OverlayStudio } from "./overlay-studio";
import type { StudioPrefs } from "@/lib/studio-prefs-client";

/* ===================== YT PRO — PREMIUM CREDIT FLAGSHIP ===================== */

const YT_RED = "#FF3B30";
const YT_GOLD = "#FFD60A";

function ytIdOf(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

/* ---- premium processing: film reel + radar + stage rail ---- */
const YT_STAGES = [
  { at: 0, name: "LINK LOCK", my: "လင့်ခ်ချိတ်နေသည်", icon: "🔗" },
  { at: 14, name: "STREAM PULL", my: "ဗီဒီယိုဆွဲနေသည်", icon: "⬇" },
  { at: 32, name: "RETENTION SCAN", my: "ကြည့်ရှုမှုစစ်နေသည်", icon: "📈" },
  { at: 52, name: "HOOK MINING", my: "ဟိုက်လိုက်ရှာနေသည်", icon: "⛏" },
  { at: 70, name: "4K RELIGHT", my: "4K အလင်းပြင်နေသည်", icon: "✦" },
  { at: 86, name: "MASTER MUX", my: "ပေါင်းစပ်နေသည်", icon: "◆" },
  { at: 100, name: "SEALED", my: "ပြီးမြောက်ပြီ", icon: "✓" },
];
function ytStage(p: number) {
  let s = YT_STAGES[0];
  for (const x of YT_STAGES) if (p >= x.at) s = x;
  return s;
}

export function YtProReactor({ progress, done, tier, target, aspect, gpu, onClose }: {
  progress: number; done: boolean; tier: string; target: number; aspect: string; gpu: boolean; onClose?: () => void;
}) {
  const p = Math.max(0, Math.min(100, Math.round(progress)));
  const st = ytStage(done ? 100 : p);
  const bars = useMemo(() => Array.from({ length: 36 }).map((_, i) => 18 + Math.abs(Math.sin(i * 0.7)) * 30), []);
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-red-500/40 bg-[#0b0304]" style={{ ["--ac" as string]: YT_RED, ["--bc" as string]: YT_GOLD }}>
      <EmberCanvas colorA={YT_RED} colorB={YT_GOLD} density={done ? 80 : 55} className="absolute inset-0 h-full w-full" />
      <div className="plasma-drift absolute -left-16 -top-16 h-56 w-56 rounded-full opacity-35 blur-3xl" style={{ background: YT_RED }} />
      <div className="plasma-drift-2 absolute -bottom-20 -right-16 h-60 w-60 rounded-full opacity-25 blur-3xl" style={{ background: YT_GOLD }} />
      <div className="holo-lines absolute inset-0 opacity-50" />

      {/* film strip header */}
      <div className="relative flex items-center gap-2 border-b border-white/10 bg-black/60 px-3 py-2">
        <span className="grid h-7 w-10 shrink-0 place-items-center rounded-md bg-[#FF0033] text-[13px] font-black text-white">▶</span>
        <span className="mono truncate text-[10px] font-bold tracking-[0.2em] text-white/70">YT PRO · {tier}</span>
        <span className={`mono ml-auto shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold ${done ? "bg-lime-300/20 text-lime-200" : "bg-red-500/20 text-red-200"}`}>
          <span className={done ? "" : "blink"}>●</span> {done ? "SEALED" : "LIVE"}
        </span>
        {onClose && <button onClick={onClose} className="mono shrink-0 rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/60">—</button>}
      </div>
      <div className="film-strip h-[10px] w-full opacity-60" />

      {/* reel + radar core */}
      <div className="relative mx-auto grid place-items-center py-3" style={{ width: 230, height: 230 }}>
        {/* radar */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full opacity-70">
          <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <circle cx="100" cy="100" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {!done && (
            <g className="radar-sweep" style={{ transformOrigin: "100px 100px" }}>
              <path d="M100 100 L100 14 A86 86 0 0 1 160 40 Z" fill={`url(#ytsweep)`} opacity="0.5" />
            </g>
          )}
          <defs><linearGradient id="ytsweep" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={YT_RED} stopOpacity="0.9" /><stop offset="100%" stopColor={YT_GOLD} stopOpacity="0" /></linearGradient></defs>
        </svg>
        {/* film reel ring */}
        <div className={`absolute inset-[14px] rounded-full border-2 ${done ? "" : "reel-spin"}`} style={{ borderColor: `${YT_RED}88` }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <span key={i} className="absolute h-4 w-4 rounded-full border" style={{ left: `${50 + 38 * Math.cos(a)}%`, top: `${50 + 38 * Math.sin(a)}%`, transform: "translate(-50%,-50%)", borderColor: `${YT_GOLD}88`, background: "rgba(0,0,0,0.6)" }} />;
          })}
        </div>
        {/* progress ring */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="100" cy="100" r="74" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle cx="100" cy="100" r="74" fill="none" stroke="url(#ytgrad)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 74} strokeDashoffset={2 * Math.PI * 74 * (1 - p / 100)}
            style={{ filter: `drop-shadow(0 0 10px ${YT_RED})`, transition: "stroke-dashoffset .8s cubic-bezier(.2,.9,.25,1)" }} />
          <defs><linearGradient id="ytgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={YT_RED} /><stop offset="100%" stopColor={YT_GOLD} /></linearGradient></defs>
        </svg>
        {/* core */}
        <div className={`absolute grid h-[112px] w-[112px] place-items-center rounded-full border bg-black/85 text-center ${done ? "" : "core-pulse"}`} style={{ borderColor: `${YT_RED}99`, boxShadow: `0 0 40px ${YT_RED}66, inset 0 0 26px #000` }}>
          <div>
            <p className="display text-[32px] font-black leading-none tabular-nums" style={{ color: done ? "#bef264" : "#fff", textShadow: `0 0 22px ${done ? "#7CFC00" : YT_RED}` }}>{done ? "✓" : p}<span className="text-[14px]">{done ? "" : "%"}</span></p>
            <p className="mono mt-0.5 text-[8.5px] tracking-[0.26em]" style={{ color: YT_GOLD }}>{st.icon} {st.name}</p>
            <p className="my text-[10px] text-white/55">{st.my}</p>
          </div>
        </div>
      </div>

      {/* stage rail */}
      <div className="relative mx-3 flex gap-1 overflow-x-auto no-scrollbar pb-1">
        {YT_STAGES.slice(0, 6).map((s) => {
          const on = (done ? 100 : p) >= s.at;
          return (
            <div key={s.name} className={`shrink-0 rounded-xl border px-2 py-1.5 text-center ${on ? "" : "border-white/10 bg-white/[0.03] opacity-55"}`} style={on ? { borderColor: `${YT_GOLD}77`, background: `${YT_RED}1f` } : undefined}>
              <p className="text-[12px] leading-none">{s.icon}</p>
              <p className="mono mt-0.5 text-[8px] font-bold tracking-wider" style={{ color: on ? YT_GOLD : "rgba(255,255,255,0.5)" }}>{s.name}</p>
            </div>
          );
        })}
      </div>

      {/* equaliser + meta */}
      <div className="relative mx-3 mb-3 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/70 p-2.5">
        <div className="flex h-[36px] items-end gap-[2px]">
          {bars.map((h, i) => (
            <span key={i} className="w-full origin-bottom rounded-sm" style={{
              height: `${h}px`, background: `linear-gradient(180deg, ${YT_GOLD}, ${YT_RED})`,
              animation: done ? "none" : `barsRise ${0.5 + (i % 6) * 0.1}s ease-in-out infinite`, animationDelay: `${(i % 8) * 0.07}s`,
              opacity: (i / bars.length) * 100 <= p ? 1 : 0.25,
            }} />
          ))}
        </div>
        <div className="relative mt-2 h-[8px] overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: `linear-gradient(90deg, ${YT_RED}, #fff 55%, ${YT_GOLD})`, boxShadow: `0 0 18px ${YT_RED}88` }} />
          {!done && <div className="beam-x absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/70 to-transparent" />}
        </div>
        <div className="mono mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-white/50">
          <span>◷ {fmtDuration(target)}</span><span>▭ {aspect}</span>
          <span>{gpu ? "⚡ GPU-TURBO" : "⬢ CPU"}</span>
          <span className="ml-auto">{p}/100</span>
        </div>
      </div>
    </div>
  );
}

/* ---- premium studio shell ---- */
export function YtProStudio({ f, vault, gpuCost, onOpenCredits, onDone, isPro = false, onOpenPro }: {
  f: FactionDef; vault: number; gpuCost: number; onOpenCredits: () => void; onDone?: () => void; isPro?: boolean; onOpenPro?: () => void;
}) {
  const spec = durationSpec("yt-pro")!;
  const [src, setSrc] = useState<"link" | "upload">("link");
  const [url, setUrl] = useState("");
  const [upload, setUpload] = useState<{ url: string; name: string; size: number; type: string; dur?: string } | null>(null);
  const [upPct, setUpPct] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState(spec.def);
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const [task, setTask] = useState("Highlight pack");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"none" | "cpu" | "gpu">("none");
  const [err, setErr] = useState<string | null>(null);
  const [lastGpu, setLastGpu] = useState(false);
  const [overlay, setOverlay] = useState<{ prefs: StudioPrefs | null; logoUrl: string }>({ prefs: null, logoUrl: "" });
  const live = useTaskPoll(taskId);
  const sheetRef = useRef<HTMLDivElement>(null);

  const tier = ytTierFor(target);
  const baseCost = tier.cost;
  const total = (gpu: boolean) => baseCost + (gpu ? gpuCost : 0);
  const vid = ytIdOf(url);
  const done = live?.status === "completed";
  const progress = live?.progress ?? 0;

  useEffect(() => {
    if (taskId) setTimeout(() => sheetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
  }, [taskId]);
  useEffect(() => { if (done) onDone?.(); }, [done, onDone]);

  const pickFile = (files: FileList | null) => {
    if (!files?.[0]) return;
    const fl = files[0];
    setUpload({
      url: URL.createObjectURL(fl), name: fl.name, size: fl.size, type: fl.type,
      dur: `00:${String(1 + Math.floor(Math.random() * 40)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
    });
    setSrc("upload");
    setUpPct(0);
    let p = 0;
    const id = setInterval(() => { p += 9 + Math.random() * 20; if (p >= 100) { p = 100; clearInterval(id); } setUpPct(Math.round(p)); }, 110);
  };

  const dispatch = async (gpu: boolean) => {
    setErr(null);
    if (src === "link" && !url.trim()) { setErr("▶ YouTube link အရင်ထည့်ပါ (youtube.com / youtu.be)"); return; }
    if (src === "upload" && !upload) { setErr("▶ ဖုန်းထဲက ဗီဒီယိုဖိုင် အရင်ရွေးပါ"); return; }
    setBusy(gpu ? "gpu" : "cpu");
    setLastGpu(gpu);
    try {
      const r = await fetch(f.route, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: src,
          ...(src === "link"
            ? { ytUrl: url.trim() }
            : { fileName: upload?.name, fileSize: upload?.size, fileType: upload?.type, duration: upload?.dur, ytUrl: `upload://${upload?.name ?? "video.mp4"}` }),
          task, targetDuration: target, aspect, gpu, renderMode: gpu ? "gpu" : "cpu",
          overlayPrefs: overlay.prefs ?? undefined, hasLogo: Boolean(overlay.logoUrl),
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        if (j.error === "INSUFFICIENT_CREDITS") { setErr(`⚡ ${j.message}`); onOpenCredits(); }
        else setErr(j.message || "Dispatch fault — retry");
        setBusy("none");
        return;
      }
      setTaskId(j.taskId || j.task_id);
    } catch { setErr("Uplink fault — retry"); }
    setBusy("none");
  };

  const R = (live?.result ?? {}) as Record<string, unknown> & { chapters2?: string[]; retention?: Record<string, unknown>; polish?: string; tier?: string; download?: string };

  return (
    <div className="space-y-3">
      {/* PREMIUM BANNER */}
      <div className="relative overflow-hidden rounded-[26px] border border-red-500/40 bg-gradient-to-br from-[#1b0406] to-black">
        <EmberCanvas colorA={YT_RED} colorB={YT_GOLD} density={34} className="absolute inset-0 h-full w-full opacity-70" />
        <div className="film-strip absolute inset-x-0 top-0 h-[8px] opacity-50" />
        <div className="relative flex items-center gap-3 p-4 pt-5">
          <span className="tier-glow grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-[26px] font-black text-[#FF0033]">▶</span>
          <div className="min-w-0">
            <p className="mono text-[9px] tracking-[0.3em]" style={{ color: YT_GOLD }}>⚡ PREMIUM CREDIT FLAGSHIP</p>
            <h2 className="display text-[20px] font-black leading-tight">YT <span style={{ color: YT_RED }}>PRO</span> STUDIO</h2>
            <p className="my text-[11.5px] text-white/60">ယူကျု့အဆင့်မြှင့် — နာရီဝက်ထိ ဖြတ်ထုတ်</p>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-1.5 px-4 pb-4">
          {[["⏱ ≤30m", "ကြာချိန်"], ["▭ 5 ratio", "ဖရိမ်"], ["✦ 4K", "polish"]].map(([a, b]) => (
            <div key={a} className="rounded-xl border border-white/12 bg-black/50 px-2 py-1.5 text-center">
              <p className="mono text-[10.5px] font-bold" style={{ color: YT_GOLD }}>{a}</p>
              <p className="my text-[9.5px] text-white/50">{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 1 · SOURCE — LINK or UPLOAD */}
      <section className="rounded-3xl border border-white/12 bg-black/55 p-3">
        <p className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.26em] text-white/50"><span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-white" style={{ background: YT_RED }}>1</span> VIDEO SOURCE</p>

        {/* YouTube-style pill tabs */}
        <div className="mb-2 flex gap-1.5">
          {([["link", "▶ YOUTUBE LINK"], ["upload", "⬆ ဖုန်းမှ UPLOAD"]] as const).map(([k, l]) => {
            const on = src === k;
            return (
              <button key={k} onClick={() => setSrc(k)}
                className={`mono flex-1 rounded-full border py-2.5 text-[11px] font-black active:scale-95 ${on ? "text-white" : "border-white/12 bg-white/5 text-white/55"}`}
                style={on ? { background: "#FF0033", borderColor: "transparent", boxShadow: "0 0 20px rgba(255,0,51,.45)" } : undefined}>
                {l}
              </button>
            );
          })}
        </div>

        {src === "link" ? (
          <>
            <div className="flex gap-1.5">
              <input value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" placeholder="https://youtu.be/…" className="search-glow mono w-full rounded-2xl border border-white/15 bg-black/70 px-3 py-3 text-[12.5px]" style={{ ["--ac" as string]: YT_RED }} />
              {url && <button onClick={() => setUrl("")} className="mono shrink-0 rounded-2xl border border-white/15 px-3 text-[12px] text-white/60">✕</button>}
            </div>
            {vid ? (
              <div className="mt-2 overflow-hidden rounded-2xl border border-white/12 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} alt="YouTube thumbnail" className="aspect-video w-full object-cover" loading="lazy" />
                <p className="mono truncate border-t border-white/10 px-2.5 py-1.5 text-[10px] text-white/60">◉ id: {vid} · thumbnail locked</p>
              </div>
            ) : url.trim() ? (
              <p className="mono mt-1.5 text-[10.5px] text-amber-200">⚠ link format စစ်ပါ — youtube.com/watch?v=… သို့ youtu.be/…</p>
            ) : (
              <p className="my mt-1.5 text-[10.5px] text-white/45">public သို့ unlisted link သာ ရသည်။</p>
            )}
          </>
        ) : (
          <>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => pickFile(e.target.files)} />
            {!upload ? (
              /* YouTube "upload" studio box */
              <button type="button" onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files); }}
                className="relative flex w-full flex-col items-center gap-1.5 overflow-hidden rounded-2xl border border-dashed px-4 py-7 text-center active:scale-[0.99]"
                style={{ borderColor: "rgba(255,0,51,.55)", background: "radial-gradient(420px 160px at 50% 0%, rgba(255,0,51,.18), transparent 70%), #0b0304" }}>
                <span className="film-strip absolute inset-x-0 top-0 h-[8px] opacity-50" />
                {/* play-button upload mark */}
                <span className="relative grid h-[62px] w-[62px] place-items-center">
                  <span className="shock-ring absolute inset-0 rounded-full border-2" style={{ borderColor: YT_RED }} />
                  <span className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-white shadow-[0_0_26px_rgba(255,0,51,.6)]">
                    <span className="text-[22px] font-black" style={{ color: "#FF0033" }}>⬆</span>
                  </span>
                </span>
                <span className="display mt-1 text-[14px] font-black">ဖုန်းထဲက ဗီဒီယိုတင်ရန် နှိပ်ပါ</span>
                <span className="mono text-[10px] text-white/55">MP4 · MOV · WEBM · MKV — gallery / camera roll</span>
                <span className="mono rounded-full px-3 py-1 text-[10px] font-black text-white" style={{ background: "#FF0033" }}>SELECT VIDEO</span>
                <span className="my text-[10px] text-white/40">သို့မဟုတ် ဖိုင်ကို ဒီနေရာသို့ ဆွဲချပါ</span>
              </button>
            ) : (
              /* uploaded preview — YouTube Studio style */
              <div className="overflow-hidden rounded-2xl border border-white/12 bg-black">
                <div className="relative">
                  <video src={upload.url} controls playsInline preload="metadata" className="aspect-video w-full bg-black object-cover" />
                  <span className="mono pointer-events-none absolute left-2 top-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[9.5px] font-bold text-white">⬆ UPLOADED</span>
                  {upload.dur && <span className="mono pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/85 px-1.5 py-0.5 text-[10px] font-bold text-white">{upload.dur}</span>}
                </div>
                <div className="flex items-center gap-2 border-t border-white/10 px-2.5 py-2">
                  <span className="grid h-7 w-10 shrink-0 place-items-center rounded-md bg-[#FF0033] text-[12px] font-black text-white">▶</span>
                  <span className="min-w-0 flex-1">
                    <span className="mono block truncate text-[11px] text-white/80">{upload.name}</span>
                    <span className="mono block text-[9.5px] text-white/45">{(upload.size / 1024 / 1024).toFixed(1)} MB · {upPct < 100 ? `uploading ${upPct}%` : "ready ✓"}</span>
                  </span>
                  <button onClick={() => { setUpload(null); setUpPct(0); }} className="mono shrink-0 rounded-lg border border-red-400/50 px-2 py-1 text-[10px] text-red-200 active:scale-95">✕ REMOVE</button>
                </div>
                {upPct < 100 && <div className="h-[4px] w-full bg-white/10"><div className="h-full transition-all duration-150" style={{ width: `${upPct}%`, background: `linear-gradient(90deg, ${YT_RED}, #fff, ${YT_GOLD})` }} /></div>}
              </div>
            )}
            <p className="my mt-1.5 text-[10.5px] text-white/45">ဖုန်းထဲက ဗီဒီယိုကို တိုက်ရိုက်တင်ပြီး chapters · hooks · 4K polish လုပ်နိုင်သည်။</p>
          </>
        )}
      </section>

      {/* 2 · DURATION */}
      <section>
        <p className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.26em] text-white/50"><span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-white" style={{ background: YT_RED }}>2</span> OUTPUT LENGTH · SLIDER</p>
        <DurationSlider spec={spec} value={target} onChange={setTarget} accent={YT_RED} accent2={YT_GOLD}
          note={`ကြာချိန်တိုးရင် credit တက်သည် — ယခု ${fmtDurationMy(target)} = ${tier.name} (${baseCost} CR)`} />
        {/* tier rail */}
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {YT_TIERS.map((t) => {
            const on = t.id === tier.id;
            return (
              <button key={t.id} onClick={() => setTarget(Math.min(spec.max, t.upTo))} className={`rounded-xl border px-1 py-2 text-center active:scale-95 ${on ? "tier-glow" : "border-white/12 bg-white/[0.03]"}`} style={on ? { borderColor: YT_GOLD, background: `${YT_RED}22` } : undefined}>
                <p className="mono text-[9px] font-bold" style={{ color: on ? YT_GOLD : "rgba(255,255,255,0.55)" }}>{t.badge}</p>
                <p className="mono text-[11px] font-black" style={{ color: on ? "#fff" : "rgba(255,255,255,0.7)" }}>{t.cost} CR</p>
                <p className="my text-[8.5px] text-white/45">{t.my}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3 · ASPECT */}
      <section>
        <p className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.26em] text-white/50"><span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-white" style={{ background: YT_RED }}>3</span> ASPECT RATIO</p>
        <AspectPicker value={aspect} onChange={setAspect} accent={YT_RED} accent2={YT_GOLD} />
      </section>

      {/* 3.5 · PRO OVERLAY STUDIO */}
      <OverlayStudio isPro={isPro} accent={YT_RED} accent2={YT_GOLD} aspect={aspect}
        onOpenPro={() => onOpenPro?.()}
        onChange={(prefs, logoUrl) => setOverlay({ prefs, logoUrl })} />

      {/* 4 · TASK */}
      <section className="rounded-3xl border border-white/12 bg-black/55 p-3">
        <p className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.26em] text-white/50"><span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-white" style={{ background: YT_RED }}>4</span> EXTRACTION TASK</p>
        <div className="flex flex-wrap gap-1.5">
          {["Highlight pack", "Full chapters + summary", "Clean 4K upscale"].map((o) => {
            const on = task === o;
            return <button key={o} onClick={() => setTask(o)} className={`mono rounded-xl border px-3 py-2 text-[11.5px] font-bold active:scale-95 ${on ? "text-black" : "border-white/12 bg-white/5 text-white/65"}`} style={on ? { background: `linear-gradient(135deg, ${YT_GOLD}, ${YT_RED})`, borderColor: "transparent" } : undefined}>{o}</button>;
          })}
        </div>
      </section>

      {err && <div className="rise rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-[12.5px] font-semibold text-red-100">{err}</div>}

      {/* INVOICE + LAUNCH */}
      <section className="overflow-hidden rounded-[24px] border border-white/12 bg-black/70">
        <div className="mono flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-white/10 px-3 py-2 text-[10px] text-white/55">
          <span>{src === "link" ? "▶ LINK" : "⬆ UPLOAD"}</span><span>◷ {fmtDuration(target)}</span><span>▭ {aspect}</span>
          <span className="rounded-full px-2 py-0.5 font-bold text-black" style={{ background: YT_GOLD }}>{tier.name}</span>
          <span className="ml-auto">VAULT ⚡ {vault} CR</span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-2">
          <button onClick={() => (vault < total(false) ? onOpenCredits() : dispatch(false))} disabled={busy !== "none"}
            className="relative flex flex-col items-center gap-0.5 overflow-hidden rounded-2xl border border-white/20 bg-white/[0.04] py-3 active:scale-[0.99] disabled:opacity-50">
            <span className="display text-[13px] font-black">{busy === "cpu" ? "◌ QUEUE…" : vault < total(false) ? "⚡ BUY CR" : "⬢ GENERATE"}</span>
            <span className="mono text-[9.5px] text-white/60">{total(false)} CR · normal</span>
          </button>
          <button onClick={() => (vault < total(true) ? onOpenCredits() : dispatch(true))} disabled={busy !== "none"}
            className="gpu-turbo relative flex flex-col items-center gap-0.5 overflow-hidden rounded-2xl py-3 text-black active:scale-[0.99] disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${YT_GOLD}, #fb923c, ${YT_RED})` }}>
            <span className="display text-[13px] font-black">{busy === "gpu" ? "◌ TURBO…" : vault < total(true) ? "⚡ BUY CR" : "⚡ GPU TURBO"}</span>
            <span className="mono text-[9.5px] font-bold opacity-85">{total(true)} CR · 2.4×</span>
          </button>
        </div>
        <p className="my px-3 pb-2.5 text-center text-[10px] text-white/45">ကြာချိန် {fmtDurationMy(target)} · {tier.name} {baseCost} CR{` `}{`+ GPU ${gpuCost}`} — CR မရှိရင် slider ပွင့်မည်</p>
      </section>

      {/* LIVE REACTOR */}
      {taskId && (
        <div ref={sheetRef} className="rise">
          <YtProReactor progress={progress} done={!!done} tier={`${tier.name} · ${tier.badge}`} target={target} aspect={aspect} gpu={lastGpu} />
          {done && (
            <div className="rise mt-2 space-y-2 rounded-[24px] border border-lime-300/35 bg-black/70 p-3.5">
              <p className="mono text-[9.5px] tracking-[0.3em] text-lime-300">◆ PREMIUM DROP · SEALED</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[["length", fmtDuration(target)], ["aspect", aspect], ["tier", tier.name], ["lane", lastGpu ? "GPU-TURBO" : "CPU"]].map(([k, v]) => (
                  <div key={k} className="mono flex justify-between rounded-lg bg-black/50 px-2.5 py-1.5 text-[10.5px]"><span className="text-white/45">{k}</span><span className="font-bold" style={{ color: YT_GOLD }}>{v}</span></div>
                ))}
              </div>
              {Array.isArray(R.chapters2) && (
                <div className="space-y-1">
                  {R.chapters2.slice(0, 6).map((c, i) => <p key={i} className="mono truncate rounded-lg bg-black/50 px-2.5 py-1.5 text-[11px] text-white/75">{c}</p>)}
                </div>
              )}
              {R.polish && <p className="mono rounded-lg bg-black/50 px-2.5 py-1.5 text-[10.5px] text-white/65">{R.polish}</p>}
              <ExportBar factionName={f.name} slug={f.slug} accent={YT_RED} accent2={YT_GOLD}
                result={{ ...R, aspect, length: fmtDuration(target), myTitle: `YT PRO · ${fmtDuration(target)}`, download: (R.download as string) || `ytpro-${fmtDuration(target)}.mp4` }} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { const blob = new Blob([JSON.stringify({ source: src, url: src === "link" ? url : upload?.name, task, target, aspect, tier: tier.id, result: R }, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `ytpro-${fmtDuration(target)}.json`; a.click(); }}
                  className="btn-bevel rounded-xl py-3 text-[12.5px] font-black text-black" style={{ ["--ac" as string]: YT_RED, background: `linear-gradient(135deg, ${YT_GOLD}, ${YT_RED})` }}>⬇ EXPORT</button>
                <button onClick={() => { setTaskId(null); }} className="mono rounded-xl border border-white/15 bg-white/5 py-3 text-[12.5px] font-bold">＋ NEW RUN</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
