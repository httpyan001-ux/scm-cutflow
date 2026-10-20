"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FactionDef } from "@/lib/factions";
import type { DiscoveredTopic } from "@/lib/knowledge";
import { ASPECT_RATIOS, DEFAULT_ASPECT } from "@/lib/studio";
import { AspectPicker } from "./forge-controls";
import { EmberCanvas, useTaskPoll } from "./forge-ui";
import { ExportBar } from "./export-bar";

type Phase = "idle" | "scanning" | "select" | "producing" | "done";

const PRESETS = ["General knowledge", "Science facts", "Myanmar history", "Technology", "Health & body", "Space & ocean"];

const SCAN_STEPS = [
  "🌐 knowledge web ချိတ်ဆက်နေသည်…",
  "🔎 website များ စကင်ဖတ်နေသည်…",
  "📚 အချက်အလက် ထုတ်နုတ်နေသည်…",
  "⚖️ ယုံကြည်စိတ်ချရမှု စစ်ဆေးနေသည်…",
  "✨ ခေါင်းစဉ် ၁၀ ခု ပြင်ဆင်နေသည်…",
];

export function KnowledgeStudio({ f, vault, gpuCost, onOpenCredits, onDone }: {
  f: FactionDef; vault: number; gpuCost: number; onOpenCredits: () => void; onDone?: () => void;
}) {
  const [query, setQuery] = useState("General knowledge");
  const [phase, setPhase] = useState<Phase>("idle");
  const [scanStep, setScanStep] = useState(0);
  const [topics, setTopics] = useState<DiscoveredTopic[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [engine, setEngine] = useState<"cloud" | "offline">("offline");
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const [voice, setVoice] = useState("Thiri — warm female");
  const [gpu, setGpu] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const live = useTaskPoll(taskId);
  const endRef = useRef<HTMLDivElement>(null);

  const done = live?.status === "completed";
  const result = (live?.result ?? {}) as Record<string, any>;
  const totalCost = f.cost + (gpu ? gpuCost : 0);
  const selected = useMemo(() => topics.filter((t) => picked.includes(t.id)), [topics, picked]);

  useEffect(() => { if (done) { setPhase("done"); onDone?.(); } }, [done, onDone]);
  useEffect(() => { if (taskId) setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 180); }, [taskId]);

  useEffect(() => {
    if (phase !== "scanning") return;
    const id = setInterval(() => setScanStep((s) => (s + 1) % SCAN_STEPS.length), 900);
    return () => clearInterval(id);
  }, [phase]);

  const discover = async () => {
    setErr(null); setPhase("scanning"); setScanStep(0); setPicked([]); setTopics([]);
    const started = Date.now();
    try {
      const r = await fetch("/api/v1/knowledge/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
      const j = await r.json();
      if (!r.ok) { setErr(j.message || "ရှာဖွေမရပါ"); setPhase("idle"); return; }
      const wait = Math.max(0, 2600 - (Date.now() - started));
      setTimeout(() => { setTopics(j.topics || []); setEngine(j.engine); setPhase("select"); }, wait);
    } catch { setErr("ကွန်ရက်မှား — ထပ်စမ်းပါ"); setPhase("idle"); }
  };

  const toggle = (id: string) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 5 ? p : [...p, id]));
  };

  const confirm = async () => {
    if (picked.length !== 5 || busy) return;
    if (vault < totalCost) { onOpenCredits(); return; }
    setErr(null); setBusy(true); setPhase("producing");
    try {
      const r = await fetch("/api/v1/knowledge/produce", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: selected, query, aspect, voice, gpu }),
      });
      const j = await r.json();
      if (!r.ok) {
        if (j.error === "INSUFFICIENT_CREDITS") { setErr(`⚡ ${j.message}`); onOpenCredits(); }
        else setErr(j.message || "ထုတ်မရပါ");
        setPhase("select"); setBusy(false); return;
      }
      setTaskId(j.taskId || j.task_id);
    } catch { setErr("Uplink fault — retry"); setPhase("select"); }
    setBusy(false);
  };

  const reset = () => { setPhase("select"); setTaskId(null); };

  return (
    <div className="space-y-3">
      {/* ===== BANNER ===== */}
      <div className="relative overflow-hidden rounded-[26px] border border-lime-300/35 bg-gradient-to-br from-[#0b1a06] to-black">
        <EmberCanvas colorA={f.primary} colorB={f.secondary} density={34} className="absolute inset-0 h-full w-full opacity-70" />
        <div className="relative flex items-center gap-3 p-4">
          <span className="core-pulse grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[26px] text-black" style={{ background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})` }}>⟡</span>
          <div className="min-w-0">
            <p className="mono text-[9px] tracking-[0.3em]" style={{ color: f.primary }}>🌐 WEB DISCOVERY → SELECT 5 → VIDEO</p>
            <h2 className="display text-[20px] font-black leading-tight">KNOWLEDGE STUDIO</h2>
            <p className="my text-[11.5px] text-white/60">အင်တာနက်မှ ဗဟုသုတ ၁၀ ခု ရှာ → ၅ ခုရွေး → ၁ မိနစ်ကျော် ဗီဒီယို</p>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-1.5 px-4 pb-4">
          {[["🔎 10 ခု", "ရှာဖွေ"], ["✅ 5 ခု", "ရွေးချယ်"], ["🎬 60s+", "ဗီဒီယို"]].map(([a, b]) => (
            <div key={a} className="rounded-xl border border-white/12 bg-black/50 px-2 py-1.5 text-center">
              <p className="mono text-[10.5px] font-bold" style={{ color: f.primary }}>{a}</p>
              <p className="my text-[9.5px] text-white/50">{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== STEP 1 — TOPIC + SCAN ===== */}
      <section className="rounded-3xl border border-white/12 bg-black/55 p-3">
        <p className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.26em] text-white/50">
          <span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: f.primary }}>1</span> TOPIC · ဘာအကြောင်း ရှာမလဲ
        </p>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ဥပမာ — space, ဦးနှောက်, မြန်မာ့သမိုင်း…"
          className="search-glow my w-full rounded-2xl border border-white/15 bg-black/70 px-3 py-3 text-[13px]" style={{ ["--ac" as string]: f.primary }} />
        <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => setQuery(p)} className={`mono shrink-0 rounded-xl border px-2.5 py-1.5 text-[10.5px] font-bold active:scale-95 ${query === p ? "text-black" : "border-white/12 bg-white/5 text-white/60"}`}
              style={query === p ? { background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})`, borderColor: "transparent" } : undefined}>{p}</button>
          ))}
        </div>
        <button onClick={discover} disabled={phase === "scanning" || phase === "producing"}
          className="btn-bevel mt-2.5 w-full rounded-2xl py-3.5 text-[14px] font-black text-black disabled:opacity-50"
          style={{ ["--ac" as string]: f.primary, background: `linear-gradient(135deg, ${f.primary}, #fff, ${f.secondary})` }}>
          {phase === "scanning" ? "◌ ရှာဖွေနေသည်…" : topics.length ? "↻ ထပ်မံရှာဖွေမည်" : "🌐 START · အင်တာနက်မှ ရှာမည်"}
        </button>
      </section>

      {/* ===== SCANNING ===== */}
      {phase === "scanning" && (
        <section className="rise relative overflow-hidden rounded-3xl border border-white/12 bg-black/70 p-4">
          <div className="scan-beam" style={{ ["--ac" as string]: f.primary } as React.CSSProperties} />
          <EmberCanvas colorA={f.primary} colorB={f.secondary} density={40} className="absolute inset-0 h-full w-full opacity-60" />
          <div className="relative mx-auto grid h-[120px] w-[120px] place-items-center">
            <span className="tick-ring spin-med absolute inset-0 rounded-full opacity-60" />
            <span className="spin-slow absolute inset-3 rounded-full border border-dashed" style={{ borderColor: f.primary }} />
            <span className="core-pulse grid h-[64px] w-[64px] place-items-center rounded-full border bg-black/80 text-[26px]" style={{ borderColor: f.primary, color: f.primary }}>🌐</span>
          </div>
          <p className="my relative mt-2 text-center text-[13px] font-bold">{SCAN_STEPS[scanStep]}</p>
          <div className="relative mt-2 space-y-1">
            {SCAN_STEPS.map((s, i) => (
              <p key={s} className={`mono text-[10.5px] ${i <= scanStep ? "text-white/70" : "text-white/25"}`}>{i <= scanStep ? "✓" : "○"} {s}</p>
            ))}
          </div>
        </section>
      )}

      {err && <div className="rise rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-[12.5px] font-semibold text-red-100">{err}</div>}

      {/* ===== STEP 2 — SELECT 5 ===== */}
      {(phase === "select" || phase === "producing" || phase === "done") && topics.length > 0 && (
        <section className="rounded-3xl border border-white/12 bg-black/55 p-3">
          <p className="mono mb-2 flex flex-wrap items-center gap-2 text-[10px] tracking-[0.26em] text-white/50">
            <span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: f.primary }}>2</span> SELECT 5 · ၅ ခုရွေးပါ
            <span className={`mono ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${engine === "cloud" ? "bg-sky-300/15 text-sky-200" : "bg-lime-300/10 text-lime-200"}`}>{engine === "cloud" ? "☁ live web" : "⬢ knowledge-web"}</span>
          </p>

          {/* counter */}
          <div className="mb-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/50 px-3 py-2">
            <span className="mono text-[11px] font-black" style={{ color: f.primary }}>{picked.length}/5</span>
            <span className="h-[7px] flex-1 overflow-hidden rounded-full bg-white/12">
              <span className="block h-full rounded-full transition-all" style={{ width: `${(picked.length / 5) * 100}%`, background: `linear-gradient(90deg, ${f.primary}, ${f.secondary})` }} />
            </span>
            {picked.length > 0 && <button onClick={() => setPicked([])} className="mono shrink-0 rounded-lg border border-white/15 px-2 py-0.5 text-[10px] text-white/55">clear</button>}
          </div>

          <div className="space-y-2">
            {topics.map((t, i) => {
              const on = picked.includes(t.id);
              const full = picked.length >= 5 && !on;
              return (
                <button key={t.id} onClick={() => toggle(t.id)} disabled={full || phase !== "select"}
                  className={`flex w-full gap-2.5 overflow-hidden rounded-2xl border p-2 text-left transition active:scale-[0.99] ${on ? "" : "border-white/10 bg-white/[0.03]"} ${full ? "opacity-40" : ""}`}
                  style={on ? { borderColor: f.primary, background: `${f.primary}16`, boxShadow: `0 0 18px ${f.primary}33` } : undefined}>
                  <span className="relative h-[66px] w-[66px] shrink-0 overflow-hidden rounded-xl bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    <span className="mono absolute left-1 top-1 rounded bg-black/80 px-1 text-[8.5px] font-bold text-white">{String(i + 1).padStart(2, "0")}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="mono flex items-center gap-1.5 text-[8.5px] tracking-widest text-white/45">
                      <span style={{ color: f.primary }}>{t.category.toUpperCase()}</span>
                      <span>· {t.source}</span>
                      <span className="ml-auto">★ {t.interest}</span>
                    </span>
                    <span className="my mt-0.5 block text-[12.5px] font-bold leading-[1.6] text-white/90">{t.myTitle}</span>
                    <span className="my clamp2 mt-0.5 block text-[10.5px] leading-[1.65] text-white/50">{t.summary}</span>
                  </span>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center self-center rounded-lg text-[13px] font-black ${on ? "text-black" : "border border-white/20 text-white/35"}`}
                    style={on ? { background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})` } : undefined}>{on ? "✓" : "+"}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== STEP 3 — OUTPUT SETTINGS + CONFIRM ===== */}
      {phase === "select" && topics.length > 0 && (
        <>
          <section>
            <p className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.26em] text-white/50">
              <span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: f.primary }}>3</span> OUTPUT · ဗီဒီယိုပုံစံ
            </p>
            <AspectPicker value={aspect} onChange={setAspect} accent={f.primary} accent2={f.secondary} />
            <div className="mt-2 rounded-2xl border border-white/12 bg-black/55 p-3">
              <p className="mono mb-1.5 text-[10px] tracking-[0.22em] text-white/50">🎙 NARRATOR · အသံ</p>
              <div className="flex flex-wrap gap-1.5">
                {["Thiri — warm female", "Aung — cinematic male", "Daw Hla — documentary"].map((v) => (
                  <button key={v} onClick={() => setVoice(v)} className={`mono rounded-xl border px-2.5 py-2 text-[11px] font-bold active:scale-95 ${voice === v ? "text-black" : "border-white/12 bg-white/5 text-white/60"}`}
                    style={voice === v ? { background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})`, borderColor: "transparent" } : undefined}>{v.split(" —")[0]}</button>
                ))}
              </div>
              <label className="mt-2 flex items-center gap-2.5 rounded-2xl border border-amber-300/30 bg-amber-400/[0.07] p-2.5">
                <button onClick={() => setGpu((g) => !g)} className="forge-switch" data-on={gpu} role="switch" aria-checked={gpu} style={{ ["--ac" as string]: "#fbbf24", ["--bc" as string]: "#fb923c" }} />
                <span className="min-w-0"><span className="block text-[12px] font-black text-amber-100">⚡ GPU TURBO</span><span className="my block text-[10px] text-white/50">+{gpuCost} CR · ၂.၄× မြန်</span></span>
              </label>
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-white/12 bg-black/70">
            <div className="mono flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-white/10 px-3 py-2 text-[10px] text-white/55">
              <span>✅ {picked.length}/5</span><span>▭ {aspect}</span><span>🎙 {voice.split(" —")[0]}</span>
              <span className="ml-auto">VAULT ⚡ {vault} CR</span>
            </div>
            <div className="p-2">
              <button onClick={confirm} disabled={picked.length !== 5 || busy}
                className="btn-bevel w-full rounded-2xl py-4 text-[14.5px] font-black text-black disabled:opacity-40"
                style={{ ["--ac" as string]: f.primary, background: `linear-gradient(135deg, ${f.primary}, #fff, ${f.secondary})` }}>
                {busy ? "◌ ထုတ်နေသည်…" : picked.length !== 5 ? `✅ ${5 - picked.length} ခု ထပ်ရွေးပါ` : `✓ CONFIRM · ဗီဒီယိုထုတ်မည် (${totalCost} CR)`}
              </button>
              <p className="my mt-1.5 text-center text-[10px] text-white/45">Script → အသံသွင်း → ဓာတ်ပုံတွဲ → Caption #@ အပါ ဗီဒီယိုထွက်မည်</p>
            </div>
          </section>
        </>
      )}

      {/* ===== STEP 4 — PRODUCTION REACTOR ===== */}
      {taskId && (
        <div ref={endRef} className="rise">
          <ProduceReactor f={f} progress={live?.progress ?? 0} done={!!done} count={selected.length} aspect={aspect} gpu={gpu} />
          {done && (
            <div className="rise mt-2 space-y-2">
              <div className="rounded-[24px] border border-lime-300/35 bg-black/70 p-3.5">
                <p className="mono text-[9.5px] tracking-[0.3em] text-lime-300">◆ KNOWLEDGE VIDEO · SEALED</p>
                <p className="my mt-1 text-[14px] font-black">{result.myTitle || "ဗဟုသုတ ၅ ချက်"}</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[["⏱", `${Math.floor((result.totalSeconds || 0) / 60)}m ${(result.totalSeconds || 0) % 60}s`], ["▭", result.aspect || aspect], ["🖼", `${(result.images || []).length} ပုံ`]].map(([a, b]) => (
                    <div key={a} className="mono rounded-xl bg-black/50 px-2 py-1.5 text-center text-[11px]"><span className="text-white/45">{a}</span> <b style={{ color: f.primary }}>{b}</b></div>
                  ))}
                </div>
                {/* scene strip */}
                <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
                  {(result.images || []).slice(0, 6).map((src: string, i: number) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" className="h-[58px] w-[58px] shrink-0 rounded-lg object-cover" loading="lazy" />
                  ))}
                </div>
                {/* script preview */}
                <div className="thin-scroll mt-2 max-h-[180px] space-y-1 overflow-y-auto">
                  {(result.lines || []).map((l: Record<string, any>) => (
                    <div key={l.idx} className="rounded-xl bg-black/50 px-2.5 py-1.5">
                      <p className="mono text-[9.5px] text-white/45">[{String(Math.floor(l.start / 60)).padStart(2, "0")}:{String(l.start % 60).padStart(2, "0")}] {l.onScreen}</p>
                      <p className="my text-[11.5px] leading-[1.7] text-white/80">{l.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <ExportBar factionName={f.name} slug={f.slug} result={result} accent={f.primary} accent2={f.secondary} />

              <button onClick={reset} className="mono w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[12.5px] font-bold active:scale-95">＋ ထပ်မံထုတ်မည် · NEW RUN</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- knowledge production reactor ---- */
const P_STAGES = [
  { at: 0, n: "SCRIPT WRITE", my: "စာသားရေးနေသည်", i: "📝" },
  { at: 22, n: "VOICE RECORD", my: "အသံသွင်းနေသည်", i: "🎙" },
  { at: 46, n: "IMAGE MATCH", my: "ဓာတ်ပုံတွဲနေသည်", i: "🖼" },
  { at: 68, n: "CAPTION #@", my: "ခေါင်းစဉ်ရေးနေသည်", i: "💬" },
  { at: 86, n: "VIDEO MUX", my: "ဗီဒီယိုပေါင်းနေသည်", i: "🎬" },
  { at: 100, n: "SEALED", my: "ပြီးမြောက်ပြီ", i: "✓" },
];

function ProduceReactor({ f, progress, done, count, aspect, gpu }: { f: FactionDef; progress: number; done: boolean; count: number; aspect: string; gpu: boolean }) {
  const p = done ? 100 : Math.max(0, Math.min(100, Math.round(progress)));
  let st = P_STAGES[0];
  for (const x of P_STAGES) if (p >= x.at) st = x;
  const C = 2 * Math.PI * 70;

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-lime-300/40 bg-[#060f04]">
      <EmberCanvas colorA={f.primary} colorB={f.secondary} density={done ? 75 : 55} className="absolute inset-0 h-full w-full" />
      <div className="holo-lines absolute inset-0 opacity-50" />
      <div className="relative flex items-center gap-2 border-b border-white/10 bg-black/60 px-3 py-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[15px]" style={{ background: f.primary, color: "#000" }}>⟡</span>
        <span className="mono truncate text-[10px] font-bold tracking-[0.2em] text-white/70">KNOWLEDGE · {count} FACTS</span>
        <span className={`mono ml-auto shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold ${done ? "bg-lime-300/20 text-lime-200" : "bg-white/10 text-white/70"}`}>
          <span className={done ? "" : "blink"}>●</span> {done ? "SEALED" : "LIVE"}
        </span>
      </div>

      <div className="relative mx-auto grid place-items-center py-3" style={{ width: 200, height: 200 }}>
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="8" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="url(#kg)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - p / 100)} style={{ filter: `drop-shadow(0 0 10px ${f.primary})`, transition: "stroke-dashoffset .8s cubic-bezier(.2,.9,.25,1)" }} />
          <defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={f.primary} /><stop offset="100%" stopColor={f.secondary} /></linearGradient></defs>
        </svg>
        {!done && <span className="shock-ring absolute inset-6 rounded-full border-2" style={{ borderColor: f.primary }} />}
        <div className={`absolute grid h-[106px] w-[106px] place-items-center rounded-full border bg-black/85 text-center ${done ? "" : "core-pulse"}`} style={{ borderColor: `${f.primary}99`, boxShadow: `0 0 36px ${f.primary}55` }}>
          <div>
            <p className="display text-[30px] font-black leading-none tabular-nums" style={{ color: done ? "#bef264" : "#fff" }}>{done ? "✓" : p}<span className="text-[13px]">{done ? "" : "%"}</span></p>
            <p className="mono mt-0.5 text-[8px] tracking-[0.24em]" style={{ color: f.primary }}>{st.i} {st.n}</p>
            <p className="my text-[9.5px] text-white/55">{st.my}</p>
          </div>
        </div>
      </div>

      <div className="relative mx-3 flex gap-1 overflow-x-auto no-scrollbar pb-1">
        {P_STAGES.slice(0, 5).map((s) => {
          const on = p >= s.at;
          return (
            <div key={s.n} className={`shrink-0 rounded-xl border px-2 py-1.5 text-center ${on ? "" : "border-white/10 bg-white/[0.03] opacity-50"}`} style={on ? { borderColor: `${f.primary}77`, background: `${f.primary}16` } : undefined}>
              <p className="text-[12px] leading-none">{s.i}</p>
              <p className="mono mt-0.5 text-[7.5px] font-bold tracking-wider" style={{ color: on ? f.primary : "rgba(255,255,255,.5)" }}>{s.n}</p>
            </div>
          );
        })}
      </div>

      <div className="relative mx-3 mb-3 mt-2 rounded-2xl border border-white/10 bg-black/70 p-2.5">
        <div className="relative h-[8px] overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: `linear-gradient(90deg, ${f.primary}, #fff 55%, ${f.secondary})` }} />
          {!done && <div className="beam-x absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/70 to-transparent" />}
        </div>
        <div className="mono mt-1.5 flex flex-wrap gap-x-2 text-[9px] text-white/50">
          <span>▭ {aspect}</span><span>{gpu ? "⚡ GPU-TURBO" : "⬢ CPU"}</span><span className="ml-auto">{p}/100</span>
        </div>
      </div>
    </div>
  );
}
