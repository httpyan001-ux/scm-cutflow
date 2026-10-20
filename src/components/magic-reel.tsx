"use client";

import { useEffect, useRef, useState } from "react";
import { EmberCanvas, useTaskPoll } from "./forge-ui";
import { ExportBar } from "./export-bar";

const GOLD = "#FFE600";
const PINK = "#FF2E9A";
const LIME = "#39FF88";
const CYAN = "#00D4FF";

type Cat = "funny" | "accident";

interface LibCat { id: Cat; name: string; my: string; emoji: string; sub: string; mySub: string; color: string; count: number; demo: boolean; totalSec: number }

const STAGES = [
  { at: 0, n: "SCANNING LIBRARY", my: "ဖိုင်များ ရှာဖွေနေသည်", i: "📁" },
  { at: 18, n: "SCENE DETECT", my: "အခန်းများ ခွဲခြမ်းနေသည်", i: "🤖" },
  { at: 38, n: "HOOK RANKING", my: "အကောင်းဆုံးအခန်း ရွေးနေသည်", i: "📈" },
  { at: 58, n: "AUDIO SYNC", my: "အသံချိန်ကိုက်နေသည်", i: "🎵" },
  { at: 78, n: "STITCH & RENDER", my: "ပေါင်းစပ်ထုတ်နေသည်", i: "⚡" },
  { at: 100, n: "VIRAL READY", my: "အဆင်သင့်ဖြစ်ပြီ", i: "✓" },
];

/* ============ DASHBOARD HERO CARD ============ */
export function MagicReelHero({ isPro, onOpenPro, vault, onOpenCredits }: {
  isPro: boolean; onOpenPro: () => void; vault: number; onOpenCredits: () => void;
}) {
  const [lib, setLib] = useState<LibCat[]>([]);
  const [cat, setCat] = useState<Cat>("accident");
  const [gpu, setGpu] = useState(false);
  const [len, setLen] = useState(60);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const live = useTaskPoll(taskId);
  const done = live?.status === "completed";
  const result = (live?.result ?? {}) as Record<string, any>;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/v1/magic/library", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (j?.categories) setLib(j.categories); })
      .catch(() => {});
  }, []);

  useEffect(() => { if (taskId) setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 200); }, [taskId]);

  const generate = async () => {
    setErr(null);
    if (!isPro) { onOpenPro(); return; }
    if (gpu && vault < 4) { onOpenCredits(); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/v1/magic/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, targetSeconds: len, aspect: "9:16", gpu }),
      });
      const j = await r.json();
      if (!r.ok) {
        if (j.error === "PRO_REQUIRED") { setErr("◆ PRO member များသာ သုံးနိုင်သည်"); onOpenPro(); }
        else if (j.error === "INSUFFICIENT_CREDITS") { setErr(`⚡ ${j.message}`); onOpenCredits(); }
        else setErr(j.message || "ထုတ်မရပါ");
        setBusy(false); return;
      }
      setTaskId(j.taskId || j.task_id);
      setOpen(true);
    } catch { setErr("ကွန်ရက်မှား — ထပ်စမ်းပါ"); }
    setBusy(false);
  };

  const progress = live?.progress ?? 0;
  const p = done ? 100 : progress;
  let st = STAGES[0];
  for (const x of STAGES) if (p >= x.at) st = x;
  const active = lib.find((c) => c.id === cat);

  return (
    <section className="magic-hero relative mt-4 overflow-hidden rounded-[26px]" aria-label="Magic Reel AI">
      {/* animated neon frame */}
      <span className="magic-frame" aria-hidden />
      <span className="cyber-corner cc-tl" style={{ ["--ac" as string]: GOLD }} />
      <span className="cyber-corner cc-tr" style={{ ["--ac" as string]: GOLD }} />
      <span className="cyber-corner cc-bl" style={{ ["--ac" as string]: GOLD }} />
      <span className="cyber-corner cc-br" style={{ ["--ac" as string]: GOLD }} />

      {/* backdrop */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(520px 260px at 18% 0%, rgba(147,51,234,.38), transparent 62%), radial-gradient(460px 240px at 95% 25%, rgba(255,46,154,.26), transparent 62%), linear-gradient(170deg,#1b0b2a,#0a0714 60%,#05030b)" }} />
      <EmberCanvas colorA={GOLD} colorB={PINK} density={46} className="absolute inset-0 h-full w-full" />
      <div className="magic-grid absolute inset-0 opacity-30" />
      <div className="holo-lines absolute inset-0 opacity-40" />

      {/* NEW FEATURE ribbon */}
      <div className="relative flex justify-end px-3 pt-3">
        <span className="magic-ribbon mono inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-black tracking-[0.18em] text-black">
          <span className="text-[12px]">★</span> NEW FEATURE
        </span>
      </div>

      {/* title row */}
      <div className="relative flex items-center gap-3 px-4 pt-2">
        <span className="relative grid h-[58px] w-[58px] shrink-0 place-items-center">
          <span className="spin-slower absolute inset-0 rounded-full border border-dashed" style={{ borderColor: `${GOLD}99` }} />
          <span className="magic-orb grid h-[46px] w-[46px] place-items-center rounded-full text-[24px]">🪄</span>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="display magic-title text-[clamp(19px,6.4vw,26px)] font-black leading-none tracking-tight">MAGIC REEL AI</h2>
          <p className="mono mt-1 text-[10px] tracking-[0.3em]" style={{ color: LIME }}>VIRAL SHORTS GENERATOR</p>
        </div>
        <span className="magic-pro mono shrink-0 rounded-full px-2.5 py-1.5 text-[10.5px] font-black text-white">♛ PRO</span>
      </div>

      {/* tagline */}
      <p className="my relative mt-2.5 px-4 text-[12.5px] leading-[1.75] text-white/85">
        <span style={{ color: GOLD }}>⚡</span> ဆာဗာထဲက clip များကို အလိုအလျောက်ရှာပြီး{" "}
        <b style={{ color: GOLD }}>၃၀ စက္ကန့်</b> အတွင်း viral short ထုတ်ပေးမည်
      </p>

      {/* category picker */}
      <div className="relative mt-3 grid grid-cols-2 gap-2 px-4">
        {(["funny", "accident"] as Cat[]).map((id) => {
          const meta = lib.find((c) => c.id === id);
          const on = cat === id;
          const col = id === "funny" ? GOLD : PINK;
          return (
            <button key={id} onClick={() => setCat(id)}
              className={`magic-cat relative overflow-hidden rounded-2xl border-2 px-2 py-3 text-center active:scale-[0.97] ${on ? "magic-cat-on" : ""}`}
              style={{ borderColor: on ? col : "rgba(255,255,255,.14)", background: on ? `${col}1c` : "rgba(0,0,0,.45)", ["--mc" as string]: col }}>
              <span className="block text-[26px] leading-none">{id === "funny" ? "😂" : "⚠️🚗"}</span>
              <span className="display mt-1 block text-[15px] font-black" style={{ color: on ? "#fff" : "rgba(255,255,255,.75)" }}>
                {id === "funny" ? "FUNNY" : "ACCIDENT"}
              </span>
              <span className="my block text-[10px] text-white/55">{id === "funny" ? "ဟာသအစုအဝေး" : "CCTV မှတ်တမ်း"}</span>
              <span className="mono mt-1 block text-[9px]" style={{ color: col }}>
                {meta ? `${meta.count} clips${meta.demo ? " · demo" : ""}` : "…"}
              </span>
            </button>
          );
        })}
      </div>

      {/* feature chips */}
      <div className="relative mt-2 grid grid-cols-3 gap-1.5 px-4">
        {[
          { i: "🤖", t: "Scene Detect", c: LIME },
          { i: "🎵", t: "Audio Sync", c: CYAN },
          { i: "📈", t: "Viral 98%", c: GOLD },
        ].map((x) => (
          <div key={x.t} className="rounded-xl border px-1 py-2 text-center" style={{ borderColor: `${x.c}44`, background: "rgba(0,0,0,.45)" }}>
            <span className="block text-[15px]">{x.i}</span>
            <span className="mono block text-[9px] font-bold" style={{ color: x.c }}>{x.t}</span>
          </div>
        ))}
      </div>

      {/* length + gpu */}
      <div className="relative mt-2 flex items-center gap-1.5 px-4">
        {[45, 60, 75].map((v) => (
          <button key={v} onClick={() => setLen(v)}
            className={`mono flex-1 rounded-xl border py-2 text-[11px] font-bold active:scale-95 ${len === v ? "text-black" : "border-white/14 bg-black/40 text-white/60"}`}
            style={len === v ? { background: GOLD, borderColor: "transparent" } : undefined}>{v}s</button>
        ))}
        <button onClick={() => setGpu((g) => !g)}
          className={`mono shrink-0 rounded-xl border px-2.5 py-2 text-[10.5px] font-black active:scale-95 ${gpu ? "text-black" : "border-amber-300/40 text-amber-200"}`}
          style={gpu ? { background: "linear-gradient(135deg,#fbbf24,#fb923c)", borderColor: "transparent" } : undefined}>
          ⚡ GPU {gpu ? "ON" : "OFF"}
        </button>
      </div>

      {err && <p className="relative mx-4 mt-2 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-[11.5px] font-semibold text-red-100">{err}</p>}

      {/* ONE-CLICK GENERATE */}
      <div className="relative mt-3 px-4">
        <button onClick={generate} disabled={busy}
          className="magic-cta relative w-full overflow-hidden rounded-full px-4 py-3.5 text-center active:scale-[0.98] disabled:opacity-60">
          <span className="magic-cta-sheen" aria-hidden />
          <span className="display relative block text-[clamp(15px,5vw,20px)] font-black tracking-tight" style={{ color: GOLD }}>
            {busy ? "◌ ထုတ်နေသည်…" : "⚡ ONE-CLICK GENERATE"}
          </span>
          <span className="mono relative block text-[10.5px] text-white/70">
            {busy ? "please wait" : isPro ? `Instant Viral Reels · ${len}s · 9:16${gpu ? " · ⚡GPU 4CR" : " · FREE"}` : "PRO member များသာ"}
          </span>
        </button>
        <p className="mono mt-1.5 flex items-center justify-center gap-1.5 text-[9.5px] text-white/40">
          <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-white/15 text-[8px]">i</span>
          content အမြန်လိုတဲ့အခါ နှိပ်လိုက်ပါ
        </p>
      </div>

      {/* library status footer */}
      <div className="relative mt-3 flex items-center gap-2 border-t border-white/10 bg-black/40 px-4 py-2">
        <span className="blink h-1.5 w-1.5 rounded-full" style={{ background: active?.demo ? "#fbbf24" : LIME }} />
        <span className="mono truncate text-[9.5px] text-white/55">
          {active ? `${active.emoji} ${active.count} clips · ${Math.round(active.totalSec)}s pool${active.demo ? " · demo mode" : " · server library"}` : "scanning library…"}
        </span>
        <a href="/faction/magic" className="mono ml-auto shrink-0 text-[9.5px] font-bold" style={{ color: GOLD }}>FULL STUDIO ›</a>
      </div>

      {/* ---- live reactor sheet ---- */}
      {taskId && open && (
        <div ref={endRef} className="relative border-t border-white/10 bg-black/60 p-3">
          <div className="flex items-center gap-2">
            <span className="mono text-[9.5px] tracking-[0.24em]" style={{ color: GOLD }}>{st.i} {st.n}</span>
            <span className="my text-[10px] text-white/50">{st.my}</span>
            <button onClick={() => setOpen(false)} className="mono ml-auto rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/55">—</button>
          </div>
          <div className="relative mt-2 h-[10px] overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: `linear-gradient(90deg, ${GOLD}, #fff 55%, ${PINK})`, boxShadow: `0 0 18px ${GOLD}88` }} />
            {!done && <div className="beam-x absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/70 to-transparent" />}
          </div>
          <div className="mono mt-1 flex justify-between text-[9px] text-white/45">
            <span>{live?.runner === "colab" ? "⚡ colab t4" : "⬢ vps"}</span><span>{p}/100</span>
          </div>

          {done && (
            <div className="rise mt-2 space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                {[["⏱", `${result.totalSeconds || 0}s`], ["🎞", `${result.clipCount || 0} clips`], ["📈", `${result.viralScore || 0}%`]].map(([a, b]) => (
                  <div key={a} className="mono rounded-xl bg-black/55 px-2 py-1.5 text-center text-[11px]"><span className="text-white/45">{a}</span> <b style={{ color: GOLD }}>{b}</b></div>
                ))}
              </div>
              <div className="thin-scroll max-h-[150px] space-y-1 overflow-y-auto">
                {(result.segments || []).map((s: Record<string, any>) => (
                  <div key={s.idx} className="flex items-center gap-2 rounded-lg bg-black/50 px-2 py-1.5">
                    <span className="mono shrink-0 text-[9.5px]" style={{ color: GOLD }}>{String(Math.floor(s.start / 60)).padStart(2, "0")}:{String(Math.floor(s.start % 60)).padStart(2, "0")}</span>
                    <span className="my min-w-0 flex-1 truncate text-[10.5px] text-white/75">{s.label}</span>
                    <span className="mono shrink-0 text-[9px] text-white/40">{s.transition}</span>
                  </div>
                ))}
              </div>
              <ExportBar factionName="MAGIC REEL AI" slug="magic" result={result} accent={GOLD} accent2={PINK} />
              <button onClick={() => { setTaskId(null); setOpen(false); }} className="mono w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-[11.5px] font-bold">＋ ထပ်ထုတ်မည်</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
