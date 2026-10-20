"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SHIELD_LEVELS, type ShieldLevel } from "@/lib/copyright";

const AC = "#00FFC2";
const BC = "#0066FF";

export interface ScanReportLite {
  overall: number;
  verdict: "SAFE" | "REVIEW" | "RISK";
  myVerdict: string;
  signals: { id: string; label: string; my: string; platform: string; severity: "pass" | "warn" | "fail"; score: number; advice: string; myAdvice: string }[];
  platforms: { name: string; score: number; status: string }[];
  monetizable: boolean;
  fixes: { title: string; my: string }[];
  fingerprint: string;
  shieldLevel: string;
  scannedAt: string;
}

const SCAN_STEPS = [
  "🛰 Content-ID database ချိတ်ဆက်နေသည်…",
  "🎞 ရုပ်ပုံ လက်ဗွေ (pHash) တွက်နေသည်…",
  "🎵 အသံ လက်ဗွေ နှိုင်းယှဉ်နေသည်…",
  "📐 မူရင်းအပိုင်း အချိုး တိုင်းတာနေသည်…",
  "🏷 မက်တာဒေတာ + watermark စစ်နေသည်…",
  "⚖️ Platform မူဝါဒ ၃ ခု နှိုင်းယှဉ်နေသည်…",
];

/* ============ RADAR SCANNER VISUAL ============ */
export function ScanRadar({ progress, done, verdict, score }: { progress: number; done: boolean; verdict?: string; score?: number }) {
  const p = done ? 100 : Math.max(0, Math.min(100, progress));
  const blips = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => ({ a: (i * 51 + 23) % 360, r: 22 + ((i * 13) % 56), d: i * 0.35 })),
    []
  );
  const color = done ? (verdict === "SAFE" ? "#7CFC00" : verdict === "REVIEW" ? "#fbbf24" : "#ff2e4c") : AC;

  return (
    <div className="relative mx-auto grid place-items-center" style={{ width: 220, height: 220 }}>
      {/* rings */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        {[88, 66, 44, 22].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="1" />
        ))}
        <line x1="100" y1="12" x2="100" y2="188" stroke="rgba(255,255,255,.07)" />
        <line x1="12" y1="100" x2="188" y2="100" stroke="rgba(255,255,255,.07)" />
        {/* sweep */}
        {!done && (
          <g className="radar-sweep" style={{ transformOrigin: "100px 100px" }}>
            <path d="M100 100 L100 12 A88 88 0 0 1 162 38 Z" fill="url(#rsweep)" opacity="0.55" />
          </g>
        )}
        {/* blips */}
        {blips.map((b, i) => {
          const rad = (b.a * Math.PI) / 180;
          const x = 100 + b.r * Math.cos(rad);
          const y = 100 + b.r * Math.sin(rad);
          const on = p > (i + 1) * 12;
          return <circle key={i} cx={x} cy={y} r={on ? 3.2 : 1.6} fill={on ? color : "rgba(255,255,255,.25)"} style={{ filter: on ? `drop-shadow(0 0 6px ${color})` : "none" }} />;
        })}
        <defs>
          <linearGradient id="rsweep" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={AC} stopOpacity="0.95" />
            <stop offset="100%" stopColor={AC} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* progress ring */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
        <circle cx="100" cy="100" r="94" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 94} strokeDashoffset={2 * Math.PI * 94 * (1 - p / 100)}
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke-dashoffset .7s cubic-bezier(.2,.9,.25,1)" }} />
      </svg>

      {!done && <span className="shock-ring absolute inset-8 rounded-full border" style={{ borderColor: AC }} />}

      {/* core */}
      <div className={`absolute grid h-[104px] w-[104px] place-items-center rounded-full border bg-black/85 text-center ${done ? "" : "core-pulse"}`}
        style={{ borderColor: `${color}99`, boxShadow: `0 0 34px ${color}55` }}>
        <div>
          <p className="display text-[28px] font-black leading-none tabular-nums" style={{ color }}>
            {done ? `${score ?? 0}` : p}<span className="text-[13px]">%</span>
          </p>
          <p className="mono mt-0.5 text-[8px] tracking-[0.26em]" style={{ color }}>{done ? verdict : "SCANNING"}</p>
          <p className="my text-[9.5px] text-white/55">{done ? "စစ်ဆေးပြီး" : "စစ်ဆေးနေသည်"}</p>
        </div>
      </div>
    </div>
  );
}

/* ============ SHIELD LEVEL PICKER (used inside RECAP) ============ */
export function ShieldPicker({ value, onChange, accent, accent2 }: { value: ShieldLevel; onChange: (v: ShieldLevel) => void; accent: string; accent2: string }) {
  const sel = SHIELD_LEVELS.find((l) => l.id === value) ?? SHIELD_LEVELS[1];
  return (
    <div className="rounded-2xl border border-white/12 bg-black/55 p-3">
      <div className="mono mb-2 flex flex-wrap items-center gap-x-2 text-[10px] uppercase tracking-[0.2em] text-white/55">
        <span>🛡 Copyright shield</span>
        <span className="my normal-case tracking-normal text-white/40">· မူပိုင်ခွင့်ကာကွယ်မှု</span>
        {sel.cost > 0 && <span className="mono ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9.5px] font-bold text-amber-200">+{sel.cost} CR</span>}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {SHIELD_LEVELS.map((l) => {
          const on = l.id === value;
          return (
            <button key={l.id} type="button" onClick={() => onChange(l.id)}
              className={`rounded-xl border px-1 py-2 text-center active:scale-95 ${on ? "" : "border-white/12 bg-white/[0.03]"}`}
              style={on ? { borderColor: accent, background: `${accent}1c`, boxShadow: `0 0 16px ${accent}44` } : undefined}>
              <p className="mono text-[9.5px] font-black" style={{ color: on ? accent : "rgba(255,255,255,.6)" }}>{l.name}</p>
              <p className="my text-[9px] text-white/50">{l.my}</p>
            </button>
          );
        })}
      </div>
      <p className="my mt-1.5 text-[10.5px] leading-[1.7] text-white/50">{sel.desc}</p>
      {value === "off" && (
        <p className="my mt-1 rounded-xl border border-red-400/40 bg-red-500/10 px-2.5 py-1.5 text-[10.5px] text-red-100">
          ⚠ ကာကွယ်မှုပိတ်ထားသည် — claim ခံရနိုင်ခြေ မြင့်သည်။
        </p>
      )}
    </div>
  );
}

/* ============ FULL SCANNER STUDIO (faction page) ============ */
export function CopyrightScanner({ vault, onOpenCredits, presetTitle }: { vault: number; onOpenCredits: () => void; presetTitle?: string }) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<ScanReportLite | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState(presetTitle || "My recap export");
  const [shieldLevel, setShieldLevel] = useState<ShieldLevel>("standard");
  const [hasMusic, setHasMusic] = useState(true);
  const [hasCommentary, setHasCommentary] = useState(true);
  const [hasAttribution, setHasAttribution] = useState(true);
  const [voiceReplaced, setVoiceReplaced] = useState(false);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [totalSec, setTotalSec] = useState(120);
  const [longestClipSec, setLongestClipSec] = useState(25);
  const [file, setFile] = useState<{ name: string; url: string; size: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "scanning") return;
    const si = setInterval(() => setStep((s) => Math.min(SCAN_STEPS.length - 1, s + 1)), 620);
    const pi = setInterval(() => setProgress((p) => Math.min(96, p + 6 + Math.random() * 7)), 240);
    return () => { clearInterval(si); clearInterval(pi); };
  }, [phase]);

  const pickFile = (fl: FileList | null) => {
    if (!fl?.[0]) return;
    const f = fl[0];
    setFile({ name: f.name, url: URL.createObjectURL(f), size: f.size });
    setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const runScan = async () => {
    setErr(null); setPhase("scanning"); setStep(0); setProgress(6); setReport(null);
    const started = Date.now();
    try {
      const r = await fetch("/api/v1/copyright/scan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, shieldLevel, hasMusic, hasCommentary, hasAttribution, voiceReplaced, logoRemoved, totalSec, longestClipSec }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.message || "စစ်ဆေးမရပါ"); setPhase("idle"); return; }
      const wait = Math.max(0, 3400 - (Date.now() - started));
      setTimeout(() => {
        setProgress(100); setReport(j.report); setPhase("done");
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
      }, wait);
    } catch { setErr("ကွန်ရက်မှား — ထပ်စမ်းပါ"); setPhase("idle"); }
  };

  const Toggle = ({ on, set, label, my }: { on: boolean; set: (v: boolean) => void; label: string; my: string }) => (
    <button type="button" onClick={() => set(!on)} className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left active:scale-95 ${on ? "" : "border-white/12 bg-white/[0.03]"}`}
      style={on ? { borderColor: AC, background: `${AC}14` } : undefined}>
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11px] font-black ${on ? "text-black" : "border border-white/25 text-white/40"}`}
        style={on ? { background: AC } : undefined}>{on ? "✓" : ""}</span>
      <span className="min-w-0"><span className="block text-[11.5px] font-bold">{label}</span><span className="my block text-[9.5px] text-white/50">{my}</span></span>
    </button>
  );

  const vcolor = report ? (report.verdict === "SAFE" ? "#7CFC00" : report.verdict === "REVIEW" ? "#fbbf24" : "#ff2e4c") : AC;

  return (
    <div className="space-y-3">
      {/* BANNER */}
      <div className="relative overflow-hidden rounded-[26px] border bg-gradient-to-br from-[#02231e] to-black" style={{ borderColor: `${AC}55` }}>
        <div className="dotgrid absolute inset-0 opacity-20" />
        <div className="relative flex items-center gap-3 p-4">
          <span className="core-pulse grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[26px] text-black" style={{ background: `linear-gradient(135deg, ${AC}, ${BC})` }}>🛡</span>
          <div className="min-w-0">
            <p className="mono text-[9px] tracking-[0.3em]" style={{ color: AC }}>⚖️ CLAIM RADAR · FREE SELF-CHECK</p>
            <h2 className="display text-[19px] font-black leading-tight">COPYRIGHT CHECKER</h2>
            <p className="my text-[11.5px] text-white/60">တင်မယ့်ဗီဒီယိုကို ကြိုတင်စစ်ဆေး — YouTube · Meta · TikTok</p>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-1.5 px-4 pb-4">
          {[["8", "signals"], ["3", "platforms"], ["FREE", "scan"]].map(([a, b]) => (
            <div key={b} className="rounded-xl border border-white/12 bg-black/50 px-2 py-1.5 text-center">
              <p className="mono text-[11px] font-black" style={{ color: AC }}>{a}</p>
              <p className="my text-[9.5px] text-white/50">{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* INPUT */}
      <section className="rounded-3xl border border-white/12 bg-black/55 p-3">
        <p className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.26em] text-white/50">
          <span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: AC }}>1</span> VIDEO · စစ်မယ့်ဗီဒီယို
        </p>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => pickFile(e.target.files)} />
        {!file ? (
          <button onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files); }}
            className="cyber-frame relative flex w-full flex-col items-center gap-1 overflow-hidden rounded-2xl border border-white/12 bg-black/70 px-4 py-6"
            style={{ ["--ac" as string]: AC }}>
            <span className="cyber-corner cc-tl" /><span className="cyber-corner cc-tr" /><span className="cyber-corner cc-bl" /><span className="cyber-corner cc-br" />
            <div className="scan-beam" />
            <span className="relative grid h-[54px] w-[54px] place-items-center rounded-2xl text-[24px] text-black" style={{ background: `linear-gradient(135deg, ${AC}, ${BC})` }}>🛡</span>
            <span className="display mt-1 text-[14px] font-bold">ဗီဒီယိုရွေးပါ (optional)</span>
            <span className="mono text-[10px] text-white/50">ဖိုင်မထည့်ဘဲ အောက်က အချက်များဖြင့်လည်း စစ်လို့ရသည်</span>
          </button>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/12 bg-black">
            <video src={file.url} controls playsInline preload="metadata" className="aspect-video w-full bg-black" />
            <div className="flex items-center gap-2 border-t border-white/10 px-2.5 py-2">
              <span className="mono min-w-0 flex-1 truncate text-[11px] text-white/70">◈ {file.name}</span>
              <button onClick={() => setFile(null)} className="mono shrink-0 rounded-lg border border-red-400/50 px-2 py-1 text-[10px] text-red-200">✕</button>
            </div>
          </div>
        )}
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title"
          className="search-glow my mt-2 w-full rounded-2xl border border-white/15 bg-black/70 px-3 py-2.5 text-[13px]" style={{ ["--ac" as string]: AC }} />
      </section>

      {/* ATTRIBUTES */}
      <section className="rounded-3xl border border-white/12 bg-black/55 p-3">
        <p className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.26em] text-white/50">
          <span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: AC }}>2</span> ATTRIBUTES · အချက်အလက်
        </p>
        <ShieldPicker value={shieldLevel} onChange={setShieldLevel} accent={AC} accent2={BC} />
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <Toggle on={hasMusic} set={setHasMusic} label="Background music" my="နောက်ခံသီချင်းပါ" />
          <Toggle on={hasCommentary} set={setHasCommentary} label="My commentary" my="ကိုယ်ပိုင်မှတ်ချက်" />
          <Toggle on={hasAttribution} set={setHasAttribution} label="Source credit" my="မူရင်းကိုးကား" />
          <Toggle on={voiceReplaced} set={setVoiceReplaced} label="Voice replaced" my="အသံပြန်သွင်း" />
          <Toggle on={logoRemoved} set={setLogoRemoved} label="Logo removed" my="လိုဂိုဖယ်ပြီး" />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="rounded-xl border border-white/12 bg-black/50 p-2">
            <span className="mono block text-[9.5px] text-white/50">TOTAL · စုစုပေါင်း (s)</span>
            <input type="number" min={10} max={3600} value={totalSec} onChange={(e) => setTotalSec(Number(e.target.value) || 60)}
              className="mono mt-1 w-full rounded-lg border border-white/12 bg-black/70 px-2 py-1.5 text-[13px]" />
          </label>
          <label className="rounded-xl border border-white/12 bg-black/50 p-2">
            <span className="mono block text-[9.5px] text-white/50">LONGEST CLIP (s)</span>
            <input type="number" min={1} max={600} value={longestClipSec} onChange={(e) => setLongestClipSec(Number(e.target.value) || 10)}
              className="mono mt-1 w-full rounded-lg border border-white/12 bg-black/70 px-2 py-1.5 text-[13px]" />
          </label>
        </div>
      </section>

      {err && <div className="rise rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-[12.5px] font-semibold text-red-100">{err}</div>}

      {/* RUN */}
      <button onClick={runScan} disabled={phase === "scanning"}
        className="btn-bevel w-full rounded-2xl py-4 text-[14.5px] font-black text-black disabled:opacity-50"
        style={{ ["--ac" as string]: AC, background: `linear-gradient(135deg, ${AC}, #fff, ${BC})` }}>
        {phase === "scanning" ? "◌ စကင်ဖတ်နေသည်…" : report ? "↻ ထပ်မံစစ်ဆေးမည်" : "🛡 SCAN · မူပိုင်ခွင့်စစ်မည် (FREE)"}
      </button>

      {/* SCANNING */}
      {phase === "scanning" && (
        <section className="rise relative overflow-hidden rounded-3xl border border-white/12 bg-black/70 p-4">
          <div className="holo-lines absolute inset-0 opacity-50" />
          <ScanRadar progress={progress} done={false} />
          <p className="my relative mt-2 text-center text-[13px] font-bold">{SCAN_STEPS[step]}</p>
          <div className="relative mt-2 space-y-1">
            {SCAN_STEPS.map((s, i) => (
              <p key={s} className={`mono text-[10.5px] ${i <= step ? "text-white/70" : "text-white/25"}`}>{i <= step ? "✓" : "○"} {s}</p>
            ))}
          </div>
        </section>
      )}

      {/* REPORT */}
      {phase === "done" && report && (
        <div ref={endRef} className="rise space-y-2">
          <section className="relative overflow-hidden rounded-[26px] border bg-black/70 p-4" style={{ borderColor: `${vcolor}66` }}>
            <ScanRadar progress={100} done verdict={report.verdict} score={report.overall} />
            <div className="mt-2 text-center">
              <p className="display text-[22px] font-black" style={{ color: vcolor }}>{report.verdict}</p>
              <p className="my text-[12.5px] text-white/65">{report.myVerdict} · {report.overall}% ဘေးကင်း</p>
              <p className="mono mt-1 text-[9.5px] text-white/40">{report.fingerprint} · shield {report.shieldLevel}</p>
            </div>
            <div className={`mono mt-2 rounded-xl px-3 py-2 text-center text-[11.5px] font-bold ${report.monetizable ? "bg-lime-300/15 text-lime-200" : "bg-amber-400/15 text-amber-200"}`}>
              {report.monetizable ? "💰 Monetization ရနိုင်ဖွယ် မြင့်သည်" : "⚠ Monetization အန္တရာယ်ရှိ — အောက်က ပြင်ဆင်ချက်များ လုပ်ပါ"}
            </div>
          </section>

          {/* platforms */}
          <section className="rounded-2xl border border-white/12 bg-black/55 p-3">
            <p className="mono mb-2 text-[10px] tracking-[0.24em] text-white/50">PLATFORM SCORES</p>
            <div className="space-y-1.5">
              {report.platforms.map((p) => {
                const c = p.score >= 82 ? "#7CFC00" : p.score >= 60 ? "#fbbf24" : "#ff2e4c";
                return (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="mono w-[76px] shrink-0 text-[11px] font-bold">{p.name}</span>
                    <span className="h-[8px] flex-1 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full transition-all" style={{ width: `${p.score}%`, background: `linear-gradient(90deg, ${c}, #fff)` }} />
                    </span>
                    <span className="mono w-[62px] shrink-0 text-right text-[10.5px] font-bold" style={{ color: c }}>{p.score}% {p.status}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* signals */}
          <section className="rounded-2xl border border-white/12 bg-black/55 p-3">
            <p className="mono mb-2 text-[10px] tracking-[0.24em] text-white/50">8 SIGNALS · အချက် ၈ ချက်</p>
            <div className="space-y-1.5">
              {report.signals.map((s) => {
                const c = s.severity === "pass" ? "#7CFC00" : s.severity === "warn" ? "#fbbf24" : "#ff2e4c";
                const icon = s.severity === "pass" ? "✓" : s.severity === "warn" ? "!" : "✕";
                return (
                  <div key={s.id} className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[12px] font-black text-black" style={{ background: c }}>{icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-bold">{s.label}</span>
                        <span className="my block truncate text-[10px] text-white/50">{s.my} · {s.platform}</span>
                      </span>
                      <span className="mono shrink-0 text-[11px] font-black" style={{ color: c }}>{s.score}</span>
                    </div>
                    <p className="my mt-1 text-[10.5px] leading-[1.7] text-white/55">{s.myAdvice}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* fixes */}
          {report.fixes.length > 0 && (
            <section className="rounded-2xl border border-amber-300/40 bg-amber-400/[0.07] p-3">
              <p className="mono mb-1.5 text-[10px] tracking-[0.24em] text-amber-200">🔧 ပြင်ဆင်သင့်သည် · {report.fixes.length}</p>
              <ul className="space-y-1">
                {report.fixes.map((f, i) => (
                  <li key={i} className="my flex gap-2 text-[11.5px] leading-[1.7] text-white/75"><span className="text-amber-300">▸</span><span>{f.my}</span></li>
                ))}
              </ul>
            </section>
          )}

          <button
            onClick={() => {
              const txt = [
                "═".repeat(46),
                "  CUTFLOW — COPYRIGHT SCAN REPORT",
                "═".repeat(46),
                `TITLE      : ${title}`,
                `VERDICT    : ${report.verdict} (${report.overall}% safe)`,
                `SHIELD     : ${report.shieldLevel}`,
                `FINGERPRINT: ${report.fingerprint}`,
                `MONETIZE   : ${report.monetizable ? "likely OK" : "at risk"}`,
                "",
                "PLATFORMS", ...report.platforms.map((p) => `  ${p.name.padEnd(10)} ${p.score}%  ${p.status}`),
                "",
                "SIGNALS", ...report.signals.map((s) => `  [${s.severity.toUpperCase().padEnd(4)}] ${s.label} — ${s.score}\n          ${s.advice}`),
                "",
                "FIXES", ...(report.fixes.length ? report.fixes.map((f) => `  • ${f.title}`) : ["  (none)"]),
                "", `scanned ${new Date(report.scannedAt).toLocaleString()}`,
              ].join("\n");
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain;charset=utf-8" }));
              a.download = `copyright-scan-${report.fingerprint}.txt`;
              a.click();
            }}
            className="mono w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[12.5px] font-bold active:scale-95">
            ⬇ SCAN REPORT .TXT
          </button>
        </div>
      )}
    </div>
  );
}
