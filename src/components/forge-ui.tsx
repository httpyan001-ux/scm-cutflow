"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FactionDef } from "@/lib/factions";
import { ExportBar } from "./export-bar";

/* ================= user ================= */
export interface ForgeUser {
  id: string;
  email: string;
  displayName: string;
  isPro: boolean;
  proExpiresAt: string | null;
  credits: number;
  avatar?: string;
  background?: string;
  themePrimary?: string;
  themeSecondary?: string;
}

export function useForgeUser() {
  const [user, setUser] = useState<ForgeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/me", { cache: "no-store" });
      const j = await r.json();
      setUser(j.user);
    } catch { /* offline */ }
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { user, loading, refresh, setUser };
}

/* ================= ember canvas ================= */
export function EmberCanvas({ colorA, colorB, density = 60, className = "" }: { colorA: string; colorB: string; density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0, h = 0;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const r = cv.getBoundingClientRect();
      w = Math.max(80, r.width); h = Math.max(80, r.height);
      cv.width = w * DPR; cv.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    type P = { x: number; y: number; vy: number; vx: number; s: number; a: number; c: string; tw: number };
    const parts: P[] = Array.from({ length: density }).map(() => ({
      x: Math.random() * 400, y: Math.random() * 300,
      vy: 0.25 + Math.random() * 1.1, vx: (Math.random() - 0.5) * 0.4,
      s: 0.6 + Math.random() * 2.2, a: 0.25 + Math.random() * 0.7,
      c: Math.random() > 0.5 ? colorA : colorB, tw: Math.random() * Math.PI * 2,
    }));
    let visible = true;
    const io = new IntersectionObserver((e) => { visible = e[0]?.isIntersecting ?? true; });
    io.observe(cv);
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      const r = cv.getBoundingClientRect();
      if (Math.abs(r.width - w) > 4 || Math.abs(r.height - h) > 4) resize();
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.tw += 0.05;
        p.y -= p.vy; p.x += p.vx + Math.sin(p.tw) * 0.25;
        if (p.y < -8) { p.y = h + 8; p.x = Math.random() * w; }
        if (p.x < -8) p.x = w + 8; if (p.x > w + 8) p.x = -8;
        const alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw * 1.4));
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.c;
        ctx.shadowColor = p.c; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc((p.x / 400) * w, (p.y / 300) * h, p.s, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    };
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); io.disconnect(); };
  }, [colorA, colorB, density]);
  return <canvas ref={ref} className={className} aria-hidden />;
}

/* ================= UI upgrade pack: progress + aurora + pipeline ================= */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        const p = max > 0 ? h.scrollTop / max : 0;
        if (ref.current) ref.current.style.transform = `scaleX(${p})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return <div id="scroll-progress" ref={ref} style={{ transform: "scaleX(0)" }} aria-hidden />;
}

export function AuroraBg({ a, b }: { a: string; b: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="aurora-a absolute -left-20 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: a, opacity: 0.28 }} />
      <div className="aurora-b absolute -bottom-24 -right-20 h-72 w-72 rounded-full blur-3xl" style={{ background: b, opacity: 0.24 }} />
      <div className="dotgrid absolute inset-0 opacity-15" />
      <div className="holo-lines absolute inset-0 opacity-40" />
    </div>
  );
}

export function PipelineMini({ accent }: { accent: string }) {
  const steps = [
    { k: "INGEST", i: "⬢", d: "ဖိုင်/link ထည့်" },
    { k: "WEAVE", i: "◈", d: "AI ရက်လုပ်" },
    { k: "RENDER", i: "⚡", d: "CPU/GPU ထုတ်" },
    { k: "SEAL", i: "◆", d: "Export + Ledger" },
  ];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/50 p-3">
      <div className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.28em] text-white/50">
        <span>◈ အလုပ်လုပ်စနစ် · ၄ ဆင့်</span>
        <a href="/guide#guide-pipeline" className="ml-auto font-bold" style={{ color: accent }}>အသေးစိတ် ›</a>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {steps.map((s, i) => (
          <div key={s.k} className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-center">
            <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl border bg-black text-[15px]" style={{ borderColor: `${accent}66`, color: accent }}>{s.i}</span>
            <p className="mono mt-1 text-[9px] font-bold tracking-widest">{s.k}</p>
            <p className="my text-[10px] text-white/55">{s.d}</p>
            {i < steps.length - 1 && <span className="absolute -right-[7px] top-1/2 -translate-y-1/2 text-white/30">›</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= shell ================= */
export interface ShellProfile { avatar?: string; displayName?: string; themePrimary?: string; photoUrl?: string }

export function ForgeShell({ user, onNav, active, onProfile, profile }: { user: ForgeUser | null; onNav?: (k: string) => void; active?: string; onProfile?: () => void; profile?: ShellProfile | null }) {
  const avatar = profile?.avatar || "⬢";
  const ac = profile?.themePrimary || "#00e5ff";
  const photo = profile?.photoUrl || "";
  return (
    <>
      <header className="sticky top-0 z-40 w-full overflow-x-clip border-b border-white/10 bg-[#04050c]/90 backdrop-blur-xl safe-t">
        <div
          className="mx-auto flex w-full max-w-5xl items-center gap-2 py-2"
          style={{ paddingLeft: "calc(0.75rem + var(--safe-l))", paddingRight: "calc(0.75rem + var(--safe-r))" }}
        >
          {/* brand — never shrinks below readable, never overflows */}
          <a href="/" className="flex min-w-0 shrink items-center gap-2">
            <span className="relative grid h-9 w-9 shrink-0 place-items-center">
              <span className="spin-slow absolute inset-0 rounded-xl border border-dashed border-cyan-300/50" />
              <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 via-cyan-300 to-lime-300 text-[11px] font-black text-black shadow-[0_0_18px_rgba(0,229,255,0.5)]">SC</span>
            </span>
            <span className="min-w-0 leading-none">
              <span className="display block truncate text-[13px] font-bold tracking-[0.1em] sm:text-[15px] sm:tracking-[0.14em]">CUTFLOW</span>
              <span className="mono block truncate text-[8px] tracking-[0.2em] text-cyan-300/75 sm:text-[9px] sm:tracking-[0.3em]">AETHER-FORGE · v3</span>
            </span>
          </a>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            <a href="/guide" aria-label="User Guide" title="အသုံးပြုသူလမ်းညွှန်" className="faction-lift mono hidden h-9 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 text-[11px] font-bold text-white/75 sm:inline-flex">📖<span className="hidden lg:inline">GUIDE</span></a>
            {user ? (
              <>
                <span className={`mono hidden h-8 items-center rounded-full border px-2.5 text-[10.5px] font-bold lg:inline-flex ${user.isPro ? "border-lime-300/40 bg-lime-300/10 text-lime-200" : "border-white/15 bg-white/5 text-white/60"}`}>
                  {user.isPro ? "◆ PRO ∞" : "○ FREE"}
                </span>
                <button onClick={onProfile} aria-label="Credits" className="mono flex h-8 shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-2.5 text-[11px] font-black text-black active:scale-95">
                  <span>⚡</span><span className="tabular-nums">{user.credits}</span>
                </button>
                <button onClick={onProfile} aria-label="Open profile" className="faction-lift grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl border-2 bg-black/70 text-[17px] active:scale-90" style={{ borderColor: ac, boxShadow: `0 0 14px ${ac}55` }}>
                  {photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt="" className="h-full w-full object-cover" /> : avatar}
                </button>
              </>
            ) : (
              <span className="mono h-8 rounded-full border border-white/15 px-2.5 text-[11px] leading-8 text-white/60">linking…</span>
            )}
          </div>
        </div>
        <div className="w-full overflow-hidden border-t border-white/5 bg-black/50">
          <div className="ticker-track mono flex w-max gap-8 whitespace-nowrap px-3 py-1 text-[9px] tracking-[0.18em] text-white/40 sm:text-[9.5px] sm:tracking-[0.2em]">
            <span>◆ PRO ZONE UNLIMITED — RECAP · REEL · MM VOICE · SUBS · UPSCALE &nbsp;&nbsp; ⚡ CREDIT FORGE — NEWS 15 · URL 10 · YT 12 · DOC 8 · KNOW 5 &nbsp;&nbsp; ◈ CELERY LANE LIVE &nbsp;&nbsp;</span>
            <span>◆ PRO ZONE UNLIMITED — RECAP · REEL · MM VOICE · SUBS · UPSCALE &nbsp;&nbsp; ⚡ CREDIT FORGE — NEWS 15 · URL 10 · YT 12 · DOC 8 · KNOW 5 &nbsp;&nbsp; ◈ CELERY LANE LIVE &nbsp;&nbsp;</span>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#05070f]/94 backdrop-blur-xl md:hidden safe-b">
        <div className="grid grid-cols-5 gap-0.5 px-2 pt-2" style={{ paddingLeft: "calc(0.5rem + var(--safe-l))", paddingRight: "calc(0.5rem + var(--safe-r))" }}>
          {[
            { k: "forge", label: "Forge", href: "/", icon: "⬢" },
            { k: "pro", label: "Pro ∞", href: "/#pro", icon: "◆" },
            { k: "guide", label: "Guide", href: "/guide", icon: "📖" },
            { k: "history", label: "Ledger", href: "/history", icon: "▤" },
            { k: "credits", label: "Vault", href: "/#credits", icon: "⚡" },
          ].map((n) => (
            <a key={n.k} href={n.href} onClick={onNav && n.k !== "guide" && n.k !== "history" ? (e) => { e.preventDefault(); onNav(n.k); } : undefined}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10.5px] font-bold active:scale-95 ${active === n.k ? "bg-cyan-300/15 text-cyan-100" : "text-white/50"}`}>
              <span className="text-[17px] leading-none">{n.icon}</span>{n.label}
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}

/* ================= EXOTIC FACTION CARDS — 10 bespoke layouts ================= */
function CostChip({ f }: { f: FactionDef }) {
  if (f.group === "pro") return <span className="mono inline-flex items-center gap-1 rounded-full border border-lime-300/50 bg-lime-300/15 px-2 py-0.5 text-[10px] font-bold text-lime-200">◆ PRO ∞</span>;
  return <span className="mono clip-tag inline-flex items-center gap-1 bg-gradient-to-r from-amber-300 to-orange-500 px-2.5 py-0.5 text-[10px] font-bold text-black">⚡ {f.cost} CR</span>;
}

export function FactionCard({ f, index }: { f: FactionDef; index: number }) {
  const S = { ["--ac" as string]: f.primary, ["--bc" as string]: f.secondary };
  const wrap = "rise group relative block overflow-hidden active:scale-[0.985] transition-transform duration-150";
  const d = `${(index % 7) * 70}ms`;
  switch (f.slug) {
    /* 01 RECAP — diagonal shard, staggered timeline blades */
    case "recap": return (
      <a href={`/faction/${f.slug}`} className={`${wrap} clip-shard border border-red-500/30 bg-[#160609]`} style={{ ...S, animationDelay: d }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(115deg, ${f.tertiary} 30%, #1c0a10 60%, #0a0508)` }} />
        <div className="absolute -right-6 -top-8 select-none text-[120px] font-black leading-none opacity-[0.13]" style={{ color: f.primary }}>◈</div>
        <div className="absolute inset-y-0 left-0 w-[5px]" style={{ background: `linear-gradient(180deg, ${f.primary}, ${f.secondary})`, boxShadow: `0 0 24px ${f.glow}` }} />
        <div className="relative p-4 pl-5">
          <div className="mono flex items-center gap-2 text-[10px] tracking-[0.3em]" style={{ color: f.primary }}><span>01 // {f.microHudLabel}</span><span className="ml-auto"><CostChip f={f} /></span></div>
          <h3 className="display mt-1 text-[24px] font-black tracking-wide chromatic">{f.name}</h3>
          <p className="my text-[12.5px] text-white/65">{f.myName} · {f.tagline}</p>
          <div className="mt-3 space-y-1.5">
            {[["00:00 IGNITION", "92%"], ["02:14 TENSION", "64%"], ["06:40 TURN", "78%"], ["11:02 PAYOFF", "45%"]].map(([t, w], i) => (
              <div key={t} className="flex items-center gap-2" style={{ marginLeft: i * 10 }}>
                <span className="mono w-28 shrink-0 text-[9.5px] text-white/50">{t}</span>
                <div className="h-[8px] flex-1 -skew-x-12 overflow-hidden rounded-sm bg-white/10"><div className="h-full" style={{ width: w, background: `linear-gradient(90deg, ${f.primary}, ${f.secondary})` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2"><span className="mono text-[10px] text-white/40">POST · /recap</span><span className="ml-auto inline-flex items-center gap-1 text-[12px] font-black" style={{ color: f.primary }}>SHARD RIG ››</span></div>
        </div>
      </a>
    );
    /* 02 REEL — volt phone alley, triple verticals */
    case "reel": return (
      <a href={`/faction/${f.slug}`} className={`${wrap} rounded-3xl border border-yellow-200/25 bg-[#151500]`} style={{ ...S, animationDelay: d }}>
        <div className="absolute inset-0 dotgrid opacity-20" />
        <div className="absolute inset-x-0 top-0 h-10 overflow-hidden"><div className="ticker-fast mono flex w-max gap-6 whitespace-nowrap pt-2 text-[10px] font-bold" style={{ color: f.primary }}><span>⚡ VIRAL 94 ⚡ HOOK-LOCK ⚡ 9:16 ⚡ WORD-POP ⚡ VIRAL 94 ⚡ HOOK-LOCK ⚡ 9:16 ⚡ </span><span>⚡ VIRAL 94 ⚡ HOOK-LOCK ⚡ 9:16 ⚡ WORD-POP ⚡ VIRAL 94 ⚡ HOOK-LOCK ⚡ 9:16 ⚡ </span></div></div>
        <div className="relative flex gap-3 p-4 pt-12">
          <div className="flex gap-1.5">
            {[44, 62, 50].map((hh, i) => (
              <div key={i} className={`w-[38px] rounded-[10px] border p-1 ${i === 1 ? "bg-black/70" : "bg-white/5"}`} style={{ height: hh + 22, borderColor: i === 1 ? f.primary : "rgba(255,255,255,0.15)", boxShadow: i === 1 ? `0 0 20px ${f.glow}` : "none" }}>
                <div className="h-[6px] w-6 mx-auto rounded-full bg-white/20" /><div className="mx-auto mt-1 grid h-[26px] w-[22px] place-items-center rounded bg-gradient-to-b from-fuchsia-500/60 to-black text-[10px]">▶</div>
                <div className="mono mt-1 text-center text-[7.5px] text-white/60">R{i + 1}</div>
              </div>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <CostChip f={f} />
            <h3 className="display mt-1 text-[24px] font-black" style={{ color: f.primary, textShadow: `0 0 24px ${f.glow}` }}>{f.name}</h3>
            <p className="my text-[12.5px] text-white/65">{f.myName}</p>
            <p className="mono mt-1 text-[10px] text-white/45">vertical extractor · 3 cuts</p>
            <p className="mt-2 text-[12px] font-black">OPEN REEL ALLEY ›</p>
          </div>
        </div>
      </a>
    );
    /* 03 MM VOICE — emerald orb + live EQ field */
    case "mm-voice": return (
      <a href={`/faction/${f.slug}`} className={`${wrap} rounded-[28px] border border-emerald-300/25 bg-[#03130d] p-[1px]`} style={{ ...S, animationDelay: d }}>
        <div className="relative overflow-hidden rounded-[27px] bg-gradient-to-b from-[#04231a] to-black p-4">
          <EmberCanvas colorA={f.primary} colorB={f.secondary} density={36} className="absolute inset-0 h-full w-full opacity-60" />
          <div className="relative flex items-center gap-3">
            <span className="relative grid h-16 w-16 shrink-0 place-items-center">
              <span className="shock-ring absolute inset-0 rounded-full border" style={{ borderColor: f.primary }} />
              <span className="spin-slow absolute inset-1 rounded-full border border-dashed" style={{ borderColor: f.secondary }} />
              <span className="core-pulse grid h-11 w-11 place-items-center rounded-full text-[20px] text-black" style={{ background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})`, boxShadow: `0 0 30px ${f.glow}` }}>≋</span>
            </span>
            <div className="min-w-0"><CostChip f={f} /><h3 className="display text-[22px] font-black tracking-wide">{f.name}</h3><p className="my truncate text-[12.5px] text-white/65">{f.myName} · ဒပ်ဗင်း</p></div>
          </div>
          <div className="relative mt-3 flex h-[46px] items-center gap-[3px] rounded-2xl border border-white/10 bg-black/60 px-3">
            {Array.from({ length: 34 }).map((_, i) => <span key={i} className="w-full origin-center rounded-full" style={{ height: `${8 + Math.abs(Math.sin(i * 0.8)) * 30}px`, background: `linear-gradient(180deg, ${f.primary}, ${f.secondary})`, animation: `eqBar ${0.5 + (i % 5) * 0.13}s ease-in-out infinite`, animationDelay: `${(i % 7) * 0.09}s` }} />)}
          </div>
          <div className="mono relative mt-2 flex justify-between text-[10px] text-white/50"><span>◉ VOCAL FORGE · 48kHz</span><span style={{ color: f.primary }}>TONE-LOCK 99.2% ›</span></div>
        </div>
      </a>
    );
    /* 04 SUBS — stacked caption cinema */
    case "subs": return (
      <a href={`/faction/${f.slug}`} className={`${wrap} rounded-2xl border border-cyan-300/25 bg-[#04121a]`} style={{ ...S, animationDelay: d }}>
        <div className="flex">
          <div className="flex w-[54px] shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-black/50 py-3"><span className="mono text-[9px] text-white/40">CC</span>{["MM", "EN", "双"].map((l) => <span key={l} className="mono grid h-8 w-8 place-items-center rounded-lg border text-[10px] font-bold" style={{ borderColor: f.primary, color: f.primary }}>{l}</span>)}</div>
          <div className="min-w-0 flex-1 p-3.5">
            <div className="flex items-center gap-2"><CostChip f={f} /><span className="mono ml-auto text-[10px] text-white/40">04 // GLYPH</span></div>
            <h3 className="display mt-1 text-[22px] font-black">{f.name} <span className="text-[13px] font-medium text-white/50">字幕</span></h3>
            <p className="my mt-1 rounded-xl border border-white/10 bg-black/60 px-2.5 py-1.5 text-center text-[13.5px] leading-[1.7]">မင်္ဂလာပါ၊ <span style={{ color: f.primary }}>ကြိုဆိုပါတယ်</span> ✨</p>
            <p className="mono mt-1 rounded-lg bg-white/5 px-2 py-1 text-center text-[10px] text-white/55">Hello, welcome — synced 99.1%</p>
            <p className="mono mt-2 text-[10px]" style={{ color: f.primary }}>RENDER CAPTIONS ›››</p>
          </div>
        </div>
      </a>
    );
    /* 05 UPSCALE — magnifier + pixel mosaic */
    case "upscale": return (
      <a href={`/faction/${f.slug}`} className={`${wrap} flow-border rounded-2xl bg-[#100d24] p-4`} style={{ ...S, animationDelay: d }}>
        <div className="absolute inset-0 grid grid-cols-12 gap-[3px] p-3 opacity-25">{Array.from({ length: 48 }).map((_, i) => <span key={i} className="aspect-square rounded-[3px]" style={{ background: i % 6 === 0 ? f.primary : i % 5 === 0 ? f.secondary : "rgba(255,255,255,0.1)" }} />)}</div>
        <div className="relative flex items-center gap-3">
          <span className="relative grid h-[74px] w-[74px] shrink-0 place-items-center rounded-full border-2 bg-black/70" style={{ borderColor: f.primary, boxShadow: `0 0 30px ${f.glow}` }}>
            <span className="text-center leading-none"><span className="display block text-[19px] font-black" style={{ color: f.primary }}>4X</span><span className="mono text-[8px] text-white/60">720p→4K</span></span>
            <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full text-[12px] text-black" style={{ background: f.secondary }}>⌕</span>
          </span>
          <div className="min-w-0"><CostChip f={f} /><h3 className="display text-[21px] font-black">{f.name}</h3><p className="my text-[12px] text-white/65">{f.myName}</p>
            <div className="mono mt-1.5 flex gap-1.5 text-[9px]"><span className="rounded bg-white/10 px-1.5 py-0.5">DENOISE</span><span className="rounded bg-white/10 px-1.5 py-0.5">DEBLUR</span><span className="rounded px-1.5 py-0.5 text-black" style={{ background: f.primary }}>RELIGHT</span></div>
          </div>
        </div>
      </a>
    );
    /* 06 NEWS — breaking ribbon + alert */
    case "news": return (
      <a href={`/faction/${f.slug}`} className={`${wrap} rounded-2xl border border-orange-400/30 bg-[#1d0d03]`} style={{ ...S, animationDelay: d }}>
        <div className="hazard px-3 py-1"><p className="mono text-center text-[10px] font-bold tracking-[0.3em] text-black">● BREAKING ● BREAKING ● BREAKING ●</p></div>
        <div className="relative p-4">
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5"><span className="blink h-1.5 w-1.5 rounded-full bg-white" /><span className="mono text-[9px] font-bold text-white">LIVE</span></div>
          <CostChip f={f} />
          <h3 className="display mt-1 text-[23px] font-black">{f.name} <span className="rounded bg-red-600 px-1.5 py-0.5 align-middle text-[11px] text-white">24/7</span></h3>
          <p className="my text-[12.5px] text-white/65">{f.myName} · သတင်းဗီဒီယို</p>
          <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-black py-1.5"><div className="ticker-track mono flex w-max gap-8 whitespace-nowrap text-[10.5px]" style={{ color: f.primary }}><span>◉ ANCHOR READY ◉ B-ROLL ARMED ◉ TICKER CRAWL ◉ LOWER-THIRDS ◉ </span><span>◉ ANCHOR READY ◉ B-ROLL ARMED ◉ TICKER CRAWL ◉ LOWER-THIRDS ◉ </span></div></div>
          <p className="mt-2 text-[12px] font-black" style={{ color: f.primary }}>ENTER BROADCAST DECK ›</p>
        </div>
      </a>
    );
    /* 07 URL RECAP — portal */
    case "url-recap": return (
      <a href={`/faction/${f.slug}`} className={`${wrap} rounded-[26px] border border-teal-300/25 bg-[#03211f] p-4`} style={{ ...S, animationDelay: d }}>
        <div className="flex items-center gap-3">
          <span className="relative grid h-[76px] w-[76px] shrink-0 place-items-center">
            <span className="spin-med absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 0deg, ${f.primary}, transparent 40%, ${f.secondary}, transparent 70%, ${f.primary})`, filter: "blur(1px)" }} />
            <span className="absolute inset-[5px] rounded-full bg-[#03211f]" />
            <span className="absolute inset-[5px] rounded-full border border-white/15" />
            <span className="relative text-[22px]" style={{ color: f.primary }}>⬣</span>
          </span>
          <div className="min-w-0 flex-1"><CostChip f={f} /><h3 className="display text-[19px] font-black leading-tight">URL<br />RECAP</h3><p className="my text-[12px] text-white/60">လင့်ခ်အနှစ်ချုပ်</p></div>
          <div className="w-[86px] shrink-0 space-y-1">
            <p className="mono truncate rounded-lg border border-white/15 bg-black/60 px-1.5 py-1 text-[8.5px] text-white/60">https://…</p>
            <p className="mono rounded-lg px-1.5 py-1 text-center text-[9px] font-bold text-black" style={{ background: f.primary }}>62s ›</p>
            <div className="h-[5px] rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full" style={{ background: f.primary }} /></div>
          </div>
        </div>
      </a>
    );
    /* 08 YT PRO — tube console */
    case "yt-pro": return (
      <a href={`/faction/${f.slug}`} className={`${wrap} clip-slant bg-[#200a0a] pb-5`} style={{ ...S, animationDelay: d }}>
        <div className="flex items-stretch">
          <div className="grid w-[86px] shrink-0 place-items-center bg-gradient-to-b from-[#FF0033] to-[#7a0018]"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[20px] font-black text-[#FF0033] shadow-[0_0_24px_rgba(255,255,255,0.5)]">▶</span></div>
          <div className="min-w-0 flex-1 border-y border-r border-red-500/30 bg-[#160808] p-3.5">
            <div className="flex items-center gap-2"><CostChip f={f} /><span className="mono ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-white/60">4K POLISH</span></div>
            <h3 className="display mt-1 text-[22px] font-black">YT <span className="text-[#FF3B30]">PRO</span></h3>
            <p className="my text-[12px] text-white/60">ယူကျု့အဆင့်မြှင့်</p>
            <div className="mt-2 h-[8px] overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-amber-300" /></div>
            <p className="mono mt-1 text-[9.5px] text-white/50">chapters · hooks · upscale rail ›</p>
          </div>
        </div>
      </a>
    );
    /* 09 DOC TRANSLATE — floating pages */
    case "doc-translate": return (
      <a href={`/faction/${f.slug}`} className={`${wrap} rounded-2xl border border-fuchsia-400/30 bg-[#160a26] p-4`} style={{ ...S, animationDelay: d }}>
        <div className="flex gap-3">
          <div className="relative h-[86px] w-[70px] shrink-0">
            <span className="absolute left-3 top-2 h-[70px] w-[52px] rotate-6 rounded-lg border border-white/15 bg-white/10" />
            <span className="absolute left-1 top-1 h-[70px] w-[52px] -rotate-3 rounded-lg border border-white/15 bg-white/10" />
            <span className="absolute left-0 top-0 h-[70px] w-[52px] rounded-lg border p-1.5" style={{ borderColor: f.primary, background: "linear-gradient(180deg, #241040, #120821)", boxShadow: `0 0 22px ${f.glow}` }}>
              <span className="block h-[6px] w-3/4 rounded-full" style={{ background: f.primary }} />
              <span className="my mt-1 block text-[8px] leading-tight text-white/70">EN→MM<br />ဘာသာပြန်</span>
              <span className="mt-1 block h-[4px] w-full rounded-full bg-white/15" /><span className="mt-1 block h-[4px] w-2/3 rounded-full bg-white/15" />
            </span>
            <span className="float-y absolute -right-1 -top-2 text-[16px]" style={{ color: f.secondary }}>✦</span>
          </div>
          <div className="min-w-0 flex-1"><CostChip f={f} /><h3 className="display text-[17px] font-black leading-tight">DOC<br />TRANSLATE</h3><p className="my text-[12px] text-white/60">စာရွက်ဘာသာပြန်</p><p className="mono mt-1 text-[9.5px] text-white/45">18p → 9 slides + VO ›</p></div>
        </div>
      </a>
    );
    /* 10 KNOWLEDGE — neural constellation */
    default: return (
      <a href={`/faction/${f.slug}`} className={`${wrap} rounded-2xl border border-lime-300/25 bg-[#0b1a0b] p-4`} style={{ ...S, animationDelay: d }}>
        <div className="relative">
          <svg viewBox="0 0 200 54" className="absolute inset-0 h-[54px] w-full opacity-70"><g stroke={f.primary} strokeWidth="1" opacity="0.55"><line x1="20" y1="30" x2="70" y2="12" /><line x1="70" y1="12" x2="120" y2="30" /><line x1="120" y1="30" x2="165" y2="10" /><line x1="70" y1="12" x2="90" y2="44" /><line x1="120" y1="30" x2="90" y2="44" /></g><g fill={f.primary}><circle cx="20" cy="30" r="3.5" /><circle cx="70" cy="12" r="4.5" /><circle cx="120" cy="30" r="3.5" /><circle cx="165" cy="10" r="3" /><circle cx="90" cy="44" r="3" /></g><g fill={f.secondary}><circle cx="70" cy="12" r="1.8" /><circle cx="120" cy="30" r="1.5" /></g></svg>
          <div className="relative flex items-end justify-between pt-12">
            <div><CostChip f={f} /><h3 className="display mt-1 text-[20px] font-black" style={{ textShadow: `0 0 22px ${f.glow}` }}>{f.name}</h3><p className="my text-[12px] text-white/60">အသိပညာထုတ်နုတ်</p></div>
            <div className="flex gap-1.5">{[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-3 w-3 rotate-45 border" style={{ borderColor: f.primary, background: i < 3 ? f.primary : "transparent", boxShadow: i < 3 ? `0 0 10px ${f.primary}` : "none" }} />)}</div>
          </div>
          <div className="mono mt-2 flex gap-1.5 overflow-hidden text-[9px]"><span className="rounded-full border px-2 py-0.5" style={{ borderColor: f.primary, color: f.primary }}>entities</span><span className="rounded-full border border-white/15 px-2 py-0.5 text-white/55">Q&A</span><span className="rounded-full border border-white/15 px-2 py-0.5 text-white/55">timeline ›</span></div>
        </div>
      </a>
    );
  }
}

/* ================= ingestion chamber — hexagonal aperture ================= */
export interface IngestedFile { file: File | null; url: string; name: string; size: number; type: string; duration?: string; res?: string; }

export function IngestionChamber({ f, value, onPick, onClear }: { f: FactionDef; value: IngestedFile | null; onPick: (fl: IngestedFile) => void; onClear: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [pct, setPct] = useState(0);
  const acceptFor = (k: FactionDef["inputKind"]) => {
    if (k === "video" || k === "video-plus-lang") return "video/*";
    if (k === "audio-or-video") return "audio/*,video/*";
    if (k === "video-or-image") return "video/*,image/*";
    if (k === "document" || k === "document-knowledge") return ".pdf,.doc,.docx,.pptx,.txt,.md";
    return undefined;
  };
  const needsFile = !["prompt-plus-topic", "url", "yt-link"].includes(f.inputKind);
  const fakeUpload = useCallback(() => {
    setPct(0); let p = 0;
    const id = setInterval(() => { p += 9 + Math.random() * 20; if (p >= 100) { p = 100; clearInterval(id); } setPct(Math.round(p)); }, 110);
  }, []);
  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    const isVid = file.type.startsWith("video");
    const isImg = file.type.startsWith("image");
    onPick({
      file, url, name: file.name, size: file.size, type: file.type,
      duration: isVid ? `00:${String(1 + Math.floor(Math.random() * 40)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}` : undefined,
      res: isVid ? "1920×1080 · 30fps" : isImg ? "2048×2048 · sRGB" : `${(file.size / 1024).toFixed(0)} KB`,
    });
    fakeUpload();
  };
  if (!needsFile) return null;
  return (
    <div className="cyber-frame overflow-hidden rounded-3xl border border-white/12 bg-black/70" style={{ ["--ac" as string]: f.primary }}>
      <span className="cyber-corner cc-tl" /><span className="cyber-corner cc-tr" /><span className="cyber-corner cc-bl" /><span className="cyber-corner cc-br" />
      <input ref={inputRef} type="file" className="hidden" accept={acceptFor(f.inputKind)} onChange={(e) => handleFiles(e.target.files)} />
      {!value ? (
        <button type="button" onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
          className="relative flex w-full flex-col items-center justify-center gap-1.5 overflow-hidden px-4 py-6 text-center" style={{ minHeight: 196 }}>
          <div className="plasma-drift absolute -left-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl" style={{ background: f.primary }} />
          <div className="plasma-drift-2 absolute -bottom-16 -right-16 h-48 w-48 rounded-full opacity-30 blur-3xl" style={{ background: f.secondary }} />
          <div className="dotgrid absolute inset-0 opacity-15" />
          <div className="scan-beam" />
          {/* hex aperture */}
          <span className="relative grid place-items-center py-1">
            <span className="spin-slower absolute h-[104px] w-[104px] rounded-full border border-dashed opacity-70" style={{ borderColor: f.primary }} />
            <span className="spin-med absolute h-[84px] w-[84px] rounded-full border-2 border-t-transparent opacity-90" style={{ borderColor: `${f.secondary} transparent transparent transparent` }} />
            <span className="tick-ring spin-slow absolute h-[96px] w-[96px] rounded-full opacity-60" />
            <span className="clip-hex grid h-[64px] w-[72px] place-items-center" style={{ background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})`, boxShadow: `0 0 44px ${f.glow}` }}>
              <span className={`iris-pulse grid h-[44px] w-[48px] place-items-center clip-hex bg-black/85 text-[22px]`} style={{ color: f.primary }}>{drag ? "◉" : f.glyph}</span>
            </span>
          </span>
          <span className="mono mt-1 text-[10px] tracking-[0.34em]" style={{ color: f.primary }}>{drag ? "◉ RELEASE TO INGEST" : "⬢ HEX-INGESTION APERTURE"}</span>
          <span className="display text-[15px] font-bold">Tap to feed {f.inputKind.includes("image") ? "video / image" : f.inputKind.includes("audio") ? "audio / video" : f.inputKind.includes("document") ? "document" : "video"}</span>
          <span className="mono text-[10px] text-white/50">{f.accepts}</span>
          <span className="hazard-faint mono mt-1 rounded-full border border-white/15 px-3 py-1 text-[10px] text-white/65">single-tap picker · drag-drop armed · {pct > 0 && pct < 100 ? `${pct}%` : "standby"}</span>
        </button>
      ) : (
        <div className="relative overflow-hidden">
          <div className="scan-beam" />
          <div className="plasma-drift absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl" style={{ background: f.primary }} />
          {value.type.startsWith("video") ? (
            <video src={value.url} className="aspect-video w-full bg-black object-cover" controls playsInline preload="metadata" />
          ) : value.type.startsWith("image") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt={value.name} className="aspect-video w-full bg-black object-cover" />
          ) : value.type.startsWith("audio") ? (
            <div className="flex aspect-[16/8] w-full flex-col justify-center gap-2 bg-gradient-to-br from-black to-[#0b0f1c] px-5">
              <div className="flex h-12 items-center gap-[3px]">{Array.from({ length: 40 }).map((_, i) => <span key={i} className="w-full rounded-full" style={{ height: `${10 + Math.abs(Math.sin(i * 0.8)) * 36}px`, background: `linear-gradient(180deg, ${f.primary}, ${f.secondary})` }} />)}</div>
              <audio src={value.url} controls className="h-8 w-full" />
            </div>
          ) : (
            <div className="flex aspect-[16/8] w-full items-center gap-3 bg-gradient-to-br from-black to-[#0b0f1c] px-5">
              <span className="clip-hex grid h-14 w-16 shrink-0 place-items-center text-[22px] text-black" style={{ background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})` }}>✦</span>
              <div className="min-w-0"><p className="truncate text-[14px] font-bold">{value.name}</p><p className="mono text-[11px] text-white/55">{(value.size / 1024 / 1024).toFixed(2)} MB · parsed & staged</p></div>
            </div>
          )}
          <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1.5">
            <span className="mono rounded-md bg-black/80 px-1.5 py-0.5 text-[9.5px] text-white/90">⬢ 16:9 VIEWPORT</span>
            {value.duration && <span className="mono rounded-md px-1.5 py-0.5 text-[9.5px] font-bold text-black" style={{ background: f.primary }}>◷ {value.duration}</span>}
            {value.res && <span className="mono rounded-md bg-black/80 px-1.5 py-0.5 text-[9.5px] text-white/90">{value.res}</span>}
          </div>
          <button onClick={onClear} className="mono absolute right-2 top-2 rounded-md border border-red-400/50 bg-black/80 px-2 py-1 text-[10px] font-bold text-red-200 active:scale-95">✕ PURGE</button>
          <div className="relative flex items-center gap-2 border-t border-white/10 bg-[#080b16]/95 px-3 py-2">
            <span className="blink h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: f.primary }} />
            <span className="truncate mono text-[11px] text-white/70">◈ {value.name}</span>
            <span className="mono ml-auto shrink-0 text-[11px] font-bold" style={{ color: f.primary }}>{pct < 100 ? `INGEST ${pct}%` : "LOCKED ✓"}</span>
          </div>
          <div className="h-[4px] w-full bg-white/10"><div className="h-full transition-all duration-150" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${f.primary}, #fff, ${f.secondary})`, boxShadow: `0 0 16px ${f.glow}` }} /></div>
        </div>
      )}
    </div>
  );
}

/* ================= micro HUD ================= */
export function MicroHUD({ f, progress, active }: { f: FactionDef; progress: number; active: boolean }) {
  const p = Math.max(0, Math.min(100, progress));
  const wrap = "rounded-2xl border border-white/10 bg-black/60 p-3 overflow-hidden relative";
  const label = <div className="mono mb-2 flex items-center gap-2 text-[10px] tracking-[0.28em]" style={{ color: f.primary }}><span className={`h-1.5 w-1.5 rounded-full ${active ? "blink" : ""}`} style={{ background: f.primary, boxShadow: `0 0 10px ${f.primary}` }} />{f.microHudLabel} · LIVE</div>;
  if (f.hudKind === "waveform") return <div className={wrap}>{label}
    <div className="flex h-[54px] items-center gap-[3px]">{Array.from({ length: 36 }).map((_, i) => <span key={i} className="w-full origin-bottom rounded-full" style={{ height: `${12 + Math.abs(Math.sin(i * 0.9 + p / 12)) * 38}px`, background: `linear-gradient(180deg, ${f.primary}, ${f.secondary})`, animation: active ? `eqBar ${0.5 + (i % 5) * 0.12}s ease-in-out infinite` : "none", animationDelay: `${(i % 7) * 0.08}s` }} />)}</div>
    <div className="mono mt-2 flex justify-between text-[10px] text-white/55"><span>dB −{Math.max(3, 24 - Math.round(p / 5))} · 48kHz</span><span>tone-lock 99.2%</span></div></div>;
  if (f.hudKind === "timeline") return <div className={wrap}>{label}
    <div className="flex gap-1.5">{[0, 1, 2, 3].map((i) => <div key={i} className="h-[48px] flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/5 p-1"><div className="h-[6px] overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(8, p - i * 18))}%`, background: `linear-gradient(90deg, ${f.primary}, ${f.secondary})` }} /></div><p className="mono mt-1 text-[8px] text-white/50">CH{i + 1} · {88 + i * 3}%</p></div>)}</div>
    <div className="mono mt-2 text-[10px] text-white/55">trimming silence · {p}% of 42m scanned</div></div>;
  if (f.hudKind === "vertical") return <div className={wrap}>{label}
    <div className="flex items-center gap-2"><div className="grid h-[74px] w-[42px] shrink-0 place-items-center rounded-lg border text-[9px]" style={{ borderColor: f.primary, boxShadow: `0 0 18px ${f.glow}` }}><span className="mono text-center leading-tight">9:16<br />R1</span></div>
      <div className="flex-1"><div className="mono mb-1 flex justify-between text-[10px]"><span>VIRALITY</span><span style={{ color: f.primary }}>{Math.min(99, 60 + Math.round(p / 3))}/100</span></div>
        <div className="h-[8px] overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: `linear-gradient(90deg, ${f.secondary}, ${f.primary})` }} /></div>
        <p className="mono mt-1 text-[10px] text-white/55">hook-lock · face-track · word-pop</p></div></div></div>;
  if (f.hudKind === "captions") return <div className={wrap}>{label}
    <p className="my rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-[13px] leading-[1.7]">မင်္ဂလာပါ။ <span style={{ color: f.primary }}>စာတန်းထိုး</span> စတင်နေပါပြီ…</p>
    <div className="mono mt-2 flex justify-between text-[10px] text-white/55"><span>cues {Math.round(p * 3.1)}/312</span><span>lh 1.7 · no-clip ✓</span></div></div>;
  if (f.hudKind === "pixels") return <div className={wrap}>{label}
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(16,1fr)" }}>{Array.from({ length: 48 }).map((_, i) => <span key={i} className="aspect-square rounded-[2px] transition-colors" style={{ background: (i / 48) * 100 < p ? f.primary : "rgba(255,255,255,0.1)", boxShadow: (i / 48) * 100 < p ? `0 0 6px ${f.primary}` : "none" }} />)}</div>
    <div className="mono mt-2 flex justify-between text-[10px] text-white/55"><span>720p → {p > 60 ? "4K" : "1440p"}</span><span>PSNR +{(p / 18).toFixed(1)} dB</span></div></div>;
  if (f.hudKind === "ticker") return <div className={wrap}>{label}<div className="overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a] py-1.5"><div className="ticker-track mono flex w-max gap-8 whitespace-nowrap text-[11px]" style={{ color: f.primary }}><span>● ANCHOR LOCKED ● B-ROLL {p}% ● TICKER CRAWL ● LOWER-THIRDS ● </span><span>● ANCHOR LOCKED ● B-ROLL {p}% ● TICKER CRAWL ● LOWER-THIRDS ● </span></div></div></div>;
  if (f.hudKind === "digest") return <div className={wrap}>{label}<div className="mono space-y-1 text-[11px]"><div className="flex justify-between rounded-lg bg-white/5 px-2 py-1"><span>claims</span><span style={{ color: f.primary }}>{Math.round(p / 12)}/8</span></div><div className="flex justify-between rounded-lg bg-white/5 px-2 py-1"><span>quotes</span><span>{Math.round(p / 20)}/5</span></div><div className="h-[7px] overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: f.primary }} /></div></div></div>;
  if (f.hudKind === "extractor") return <div className={wrap}>{label}<div className="flex items-center gap-2"><span className="grid h-9 w-12 shrink-0 place-items-center rounded-md bg-[#FF0033] font-black">▶</span><div className="flex-1"><div className="h-[8px] overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-300 transition-all" style={{ width: `${p}%` }} /></div><p className="mono mt-1 text-[10px] text-white/55">chapters · hooks · 4K polish</p></div></div></div>;
  if (f.hudKind === "slides") return <div className={wrap}>{label}<div className="flex gap-1.5">{[1, 2, 3].map((n) => <div key={n} className="flex-1 rounded-lg border border-white/10 bg-white/5 p-1.5 text-center"><p className="mono text-[9px]" style={{ color: f.primary }}>SL{n}</p><p className="my text-[10px] text-white/60">{p > n * 28 ? "✓ ပြီးပြီ" : "…"}</p></div>)}</div></div>;
  return <div className={wrap}>{label}<div className="flex items-center justify-between"><div className="flex gap-2">{[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-2.5 w-2.5 rotate-45 border transition-all" style={{ borderColor: (i / 5) * 100 < p ? f.primary : "rgba(255,255,255,0.2)", background: (i / 5) * 100 < p ? f.primary : "transparent", boxShadow: (i / 5) * 100 < p ? `0 0 10px ${f.primary}` : "none" }} />)}</div><span className="mono text-[10px] text-white/55">{p}% woven</span></div></div>;
}

/* ================= BADASS PROCESSING REACTOR ================= */
export function stageFor(p: number): { name: string; my: string; icon: string } {
  if (p < 14) return { name: "INGESTION", my: "သွင်းယူနေသည်", icon: "◉" };
  if (p < 32) return { name: "DECODE MATRIX", my: "ကုဒ်ဖြေနေသည်", icon: "⬢" };
  if (p < 58) return { name: "NEURAL WEAVE", my: "AI ရက်လုပ်နေသည်", icon: "⟡" };
  if (p < 84) return { name: "PLASMA RENDER", my: "ပုံဖော်နေသည်", icon: "⚡" };
  if (p < 100) return { name: "FINALIZE", my: "အပြီးသတ်နေသည်", icon: "◆" };
  return { name: "FORGED", my: "ပြီးမြောက်ပြီ", icon: "✓" };
}

const LOG_TEMPLATES: Record<string, string[]> = {
  recap: ["shard_01 locked · hook found @00:00", "silence −38s · filler purged", "beat_02 scored 96 · demo turn", "highlight rail 58s muxed · -14 LUFS"],
  reel: ["face-track lock · 9:16 reframe", "hook R1 scored 94 · beat-sync", "word-pop captions burned MM+EN", "3 cuts packed · loudness matched"],
  "mm-voice": ["voiceprint match 99.2% · tone-lock", "phoneme lattice built · MM prosody", "room match · de-ess chain", "48kHz master bounced · 3 stems"],
  subs: ["VAD sweep · 312 cues detected", "MM shaping · Pyidaungsu-safe lh1.7", "timing warp · ±12ms align", "SRT + burn-in muxed"],
  upscale: ["frame split · denoise −82%", "diffusion pass · faces 14/14", "relight · skin-true LUT", "4K mux · PSNR +6.4dB"],
  news: ["anchor rigged · lower-thirds", "b-roll 00:06–00:18 laid", "ticker crawl injected", "broadcast master · CTA outro"],
  "url-recap": ["scrape 12-min read · 8 claims", "quotes pinned · counterpoint kept", "narrator laid · 62s", "chapter cards + links packed"],
  "yt-pro": ["tube pull · chapters mapped", "retention risk patched −14s", "viral spike isolated", "4K relight · chapters art"],
  "doc-translate": ["layout parse · 18 pages", "glossary EN→MM mapped", "slides rebuilt · Noto Myanmar", "VO synced · CTA slide"],
  knowledge: ["entities 4 · graph woven", "Q&A memory pinned", "timeline 6-row built", "flashcards 14 packed"],
};

export function ForgeReactor({ f, progress, taskId, done, onClose, runner, workerStage, workerLog, workerId }: { f: FactionDef; progress: number; taskId: string; done: boolean; onClose?: () => void; runner?: string; workerStage?: string; workerLog?: string[]; workerId?: string | null }) {
  const onColab = runner === "colab";
  const p = Math.max(0, Math.min(100, Math.round(progress)));
  const stage = stageFor(p);
  const R = 84;
  const C = 2 * Math.PI * R;
  const logs = useMemo(() => {
    const tpl = LOG_TEMPLATES[f.slug] || LOG_TEMPLATES.recap;
    const count = p < 14 ? 1 : p < 32 ? 2 : p < 58 ? 3 : 4;
    const base: { t: string; m: string; on: boolean }[] = [
      { t: "00:00", m: `lane open · ${f.route} · task ${taskId.slice(0, 8)}`, on: true },
      ...tpl.slice(0, count).map((m, i) => ({ t: `00:${String(3 + i * 4).padStart(2, "0")}`, m, on: true })),
    ];
    for (const wl of (workerLog ?? []).slice(-4)) base.push({ t: "T4", m: wl, on: true });
    if (done) base.push({ t: "DONE", m: `master sealed · ${f.name} forged ✓`, on: true });
    else base.push({ t: "…", m: `${stage.name.toLowerCase()}… ${p}% · UI never freezes`, on: false });
    return base;
  }, [f, p, done, taskId, stage.name, workerLog]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[26px] border border-white/12 bg-[#04050c]" style={{ ["--ac" as string]: f.primary, ["--bc" as string]: f.secondary }}>
      {/* plasma bg */}
      <div className="plasma-drift absolute -left-20 -top-20 h-72 w-72 rounded-full opacity-35 blur-3xl" style={{ background: f.primary }} />
      <div className="plasma-drift-2 absolute -bottom-24 -right-20 h-80 w-80 rounded-full opacity-30 blur-3xl" style={{ background: f.secondary }} />
      <div className="dotgrid absolute inset-0 opacity-15" />
      <div className="holo-lines absolute inset-0 opacity-60" />
      <EmberCanvas colorA={f.primary} colorB={f.secondary} density={done ? 90 : 60} className="absolute inset-0 h-full w-full" />
      <div className="noise-veil absolute inset-0" />

      {/* top bar */}
      <div className="relative flex items-center gap-2 px-4 pt-4">
        <span className={`mono rounded-full border px-2.5 py-1 text-[10px] font-bold ${done ? "border-lime-300/60 bg-lime-300/15 text-lime-200" : "border-white/20 bg-black/60 text-white/70"}`}>
          <span className={done ? "" : "blink"}>●</span> {done ? "FORGED ✓" : "FORGING"}
        </span>
        {onColab && (
          <span className="mono tier-glow shrink-0 rounded-full border border-amber-300/60 bg-amber-400/15 px-2 py-1 text-[9.5px] font-black text-amber-200">
            ⚡ COLAB T4{workerId ? ` · ${workerId.slice(6, 12)}` : ""}
          </span>
        )}
        <span className="mono truncate text-[10px] text-white/45">TASK {taskId.slice(0, 13)}…</span>
        {onClose && <button onClick={onClose} className="mono ml-auto rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-[11px] text-white/60 active:scale-95">— MINIMIZE</button>}
      </div>

      {/* reactor core */}
      <div className="relative mx-auto mt-1 grid place-items-center" style={{ width: 248, height: 248 }}>
        {/* shockwaves */}
        {!done && <><span className="shock-ring absolute inset-4 rounded-full border-2" style={{ borderColor: f.primary }} /><span className="shock-ring absolute inset-4 rounded-full border" style={{ borderColor: f.secondary, animationDelay: "0.9s" }} /></>}
        {/* tick ring */}
        <div className={`tick-ring absolute inset-0 rounded-full opacity-70 ${done ? "" : "spin-med"}`} />
        {/* conic energy */}
        <div className={`absolute inset-5 rounded-full ${done ? "" : "spin-slow"}`} style={{ background: `conic-gradient(from 0deg, transparent 0%, ${f.primary}55 12%, transparent 26%, transparent 55%, ${f.secondary}66 68%, transparent 82%)`, filter: "blur(6px)" }} />
        {/* progress ring */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="9" />
          <circle cx="100" cy="100" r={R} fill="none" stroke={`url(#rg-${f.slug})`} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C - (C * p) / 100} style={{ filter: `drop-shadow(0 0 10px ${f.primary})`, transition: "stroke-dashoffset 0.8s cubic-bezier(0.2,0.9,0.25,1)" }} />
          <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="9" strokeDasharray="2 14" className={done ? "" : "spin-fast"} style={{ animation: "dashSpin 2.4s linear infinite" }} opacity="0.5" />
          <defs><linearGradient id={`rg-${f.slug}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={f.primary} /><stop offset="100%" stopColor={f.secondary} /></linearGradient></defs>
        </svg>
        {/* core */}
        <div className={`absolute grid h-[128px] w-[128px] place-items-center rounded-full border bg-black/80 text-center ${done ? "" : "core-pulse"}`} style={{ borderColor: `${f.primary}88`, boxShadow: `0 0 44px ${f.glow}, inset 0 0 30px rgba(0,0,0,0.9)` }}>
          <div>
            <div className="display text-[40px] font-black leading-none tabular-nums" style={{ color: done ? "#bef264" : "#fff", textShadow: `0 0 26px ${done ? "#7CFC00" : f.primary}` }}>{done ? "✓" : p}<span className="text-[16px]">{done ? "" : "%"}</span></div>
            <div className="mono mt-1 text-[9px] tracking-[0.3em]" style={{ color: f.primary }}>{stage.icon} {stage.name}</div>
            <div className="my text-[10.5px] text-white/55">{stage.my}</div>
          </div>
        </div>
        {/* orbiting glyph */}
        {!done && <span className="orbit-ring absolute inset-2"><span className="absolute -top-1 left-1/2 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full border bg-black text-[13px]" style={{ borderColor: f.primary, color: f.primary, boxShadow: `0 0 16px ${f.glow}` }}>{f.glyph}</span></span>}
      </div>

      {/* glitch stage banner */}
      <div className="relative mx-4 -mt-1 overflow-hidden rounded-2xl border border-white/10 bg-black/70 px-3 py-2.5 text-center">
        <div className="scan-beam" style={{ animationDuration: "1.6s" }} />
        <p className={`display text-[17px] font-black tracking-[0.12em] ${done ? "" : "glitch-burst chromatic"}`} style={{ color: done ? "#bef264" : "#fff" }}>{done ? `${f.name} · FORGED` : onColab && workerStage ? `⚡ ${workerStage}` : `${stage.icon} ${stage.name}`}</p>
        <p className="my text-[11px] text-white/55">{f.myName} — {done ? "ဖန်တီးမှု ပြီးပါပြီ" : `${p}% · ${stage.my}…`}</p>
        {/* liquid bar */}
        <div className="relative mt-2 h-[10px] overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: `linear-gradient(90deg, ${f.primary}, #fff 55%, ${f.secondary})`, boxShadow: `0 0 20px ${f.glow}` }} />
          {!done && <div className="charge-sweep absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />}
        </div>
        <div className="mono mt-1 flex justify-between text-[9px] text-white/40"><span>{onColab ? "google colab · tesla t4 · nvenc" : "vps forge lane · 1.3s poll"}</span><span>{p}/100</span></div>
      </div>

      {/* streaming logs */}
      <div className="thin-scroll relative mx-4 mb-4 mt-2 max-h-[148px] min-h-[118px] flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/70 p-2.5 font-mono text-[10.5px] leading-relaxed">
        {logs.map((l, i) => (
          <p key={i} className={`log-in flex gap-2 ${l.on ? "text-white/80" : "text-white/40"}`}>
            <span style={{ color: f.primary }}>[{l.t}]</span><span className="flex-1">{l.m}</span>{l.on && i === logs.length - (done ? 1 : 2) && !done ? <span className="blink">▊</span> : null}
          </p>
        ))}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      {/* floor grid */}
      <div className="pointer-events-none relative h-[54px] overflow-hidden opacity-70"><div className="floor-grid absolute inset-[-40px]" style={{ filter: `drop-shadow(0 0 12px ${f.primary})` }} /></div>
    </div>
  );
}

/* ================= polling ================= */
export function useTaskPoll(taskId: string | null) {
  const [task, setTask] = useState<{ status: string; progress: number; result?: Record<string, unknown>; lane?: string; runner?: string; stage?: string; workerId?: string | null; workerLog?: string[] } | null>(null);
  useEffect(() => {
    if (!taskId) return;
    let stop = false;
    let tries = 0;
    const tick = async () => {
      try {
        const r = await fetch(`/api/v1/tasks/${taskId}`, { cache: "no-store" });
        const j = await r.json();
        if (!stop) setTask(j);
        if (j.status === "completed" || j.status === "failed") return;
      } catch { /* retry */ }
      tries++;
      if (!stop && tries < 100) setTimeout(tick, 1300);
    };
    tick();
    return () => { stop = true; };
  }, [taskId]);
  return task;
}

export function TaskConsole({ f, taskId }: { f: FactionDef; taskId: string }) {
  const t = useTaskPoll(taskId);
  const p = t?.progress ?? 4;
  const done = t?.status === "completed";
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10" style={{ ["--ac" as string]: f.primary, ["--bc" as string]: f.secondary }}>
      <ForgeReactor f={f} progress={p} taskId={taskId} done={!!done} runner={t?.runner} workerStage={t?.stage} workerLog={t?.workerLog} workerId={t?.workerId} />
    </div>
  );
}

/* ================= result sheet — holo rarity ================= */
export function ResultSheet({ f, taskId, onClose, onCredits }: { f: FactionDef; taskId: string; onClose: () => void; onCredits?: () => void }) {
  const t = useTaskPoll(taskId);
  const done = t?.status === "completed";
  const result = (t?.result ?? {}) as Record<string, unknown>;
  const [copied, setCopied] = useState(false);

  const download = () => {
    const blob = new Blob([JSON.stringify({ faction: f.slug, taskId, result }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = ((result.download as string) || `cutflow-${f.slug}.json`).replace(/\.(mp4|zip|wav|srt)$/, ".json");
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-up thin-scroll relative max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-[24px] border border-white/12 bg-[#070a15] sm:rounded-[24px]" style={{ ["--ac" as string]: f.primary, ["--bc" as string]: f.secondary }}>
        {!done ? (
          <div className="p-3 pb-[calc(0.75rem+var(--safe-b))]">
            <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-white/25 sm:hidden" />
            <div className="overflow-hidden rounded-[20px]"><ForgeReactor f={f} progress={t?.progress ?? 4} taskId={taskId} done={false} onClose={onClose} runner={t?.runner} workerStage={t?.stage} workerLog={t?.workerLog} workerId={t?.workerId} /></div>
          </div>
        ) : (
          <div className="rise relative overflow-hidden p-5 pb-[calc(1.25rem+var(--safe-b))]">
            <div className="plasma-drift absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl" style={{ background: f.primary }} />
            <EmberCanvas colorA={f.primary} colorB={f.secondary} density={50} className="absolute inset-0 h-full w-full opacity-50" />
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/25 sm:hidden" />
            <div className="relative flex items-center gap-3">
              <span className="core-pulse grid h-12 w-12 place-items-center rounded-2xl text-[22px] text-black" style={{ background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})`, boxShadow: `0 0 30px ${f.glow}` }}>{f.glyph}</span>
              <div><p className="mono text-[9.5px] tracking-[0.32em] text-lime-300">◆ LEGENDARY DROP · FORGED</p><h3 className="display text-[17px] font-black">{f.name} · OUTPUT</h3></div>
              <button onClick={onClose} className="mono ml-auto rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-[12px] text-white/70 active:scale-95">✕</button>
            </div>
            <div className="flow-border relative mt-4 rounded-2xl bg-black/60 p-3.5 text-[13px]" style={{ ["--ac" as string]: f.primary, ["--bc" as string]: f.secondary }}>
              <ResultBody f={f} result={result} />
            </div>
            <div className="relative mt-3">
              <ExportBar factionName={f.name} slug={f.slug} result={result} accent={f.primary} accent2={f.secondary} />
            </div>
            <div className="relative mt-2 grid grid-cols-2 gap-2">
              <button onClick={download} className="mono rounded-xl border border-white/15 bg-white/5 py-2.5 text-[11.5px] font-bold active:scale-95">⬇ RAW JSON</button>
              <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(result, null, 2)).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1400); }} className="mono rounded-xl border border-white/15 bg-white/5 py-2.5 text-[11.5px] font-bold active:scale-95">{copied ? "✓ COPIED" : "⧉ COPY JSON"}</button>
            </div>
            <button onClick={() => { onClose(); onCredits?.(); }} className="mono relative mt-2 w-full rounded-xl border border-white/10 bg-black/40 py-2.5 text-[11px] text-white/55">＋ NEW FORGE · BACK TO RIG</button>
          </div>
        )}
      </div>
    </div>
  );
}

function KV({ k, v, ac }: { k: string; v: string; ac: string }) {
  return <div className="flex items-center justify-between gap-2 rounded-lg bg-black/50 px-2.5 py-1.5"><span className="mono text-[10px] uppercase tracking-widest text-white/50">{k}</span><span className="mono text-[11px] font-bold" style={{ color: ac }}>{v}</span></div>;
}

function ResultBody({ f, result }: { f: FactionDef; result: Record<string, unknown> }) {
  const R = result as Record<string, any>;
  const isGpu = R.gpu === true || R.renderLane === "GPU-TURBO";
  return (
    <div className="space-y-2">
      {isGpu && <div className="mono rounded-xl border border-amber-300/50 bg-amber-400/10 px-2.5 py-1.5 text-center text-[11px] font-bold text-amber-200">⚡ GPU-TURBO{R.runner === "colab" ? ` · ${R.accelerator || "Tesla T4"} (Colab)` : ""}{R.renderSeconds ? ` · ${R.renderSeconds}s` : ""}</div>}
      <div className="grid grid-cols-2 gap-1.5">
        <KV k="status" v="FORGED ✓" ac={f.primary} />
        <KV k="master" v={String(R.download || "master.mp4").slice(0, 18)} ac={f.secondary} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <KV k="lane" v={isGpu ? (R.runner === "colab" ? "COLAB T4" : "GPU-TURBO") : "VPS CPU"} ac={isGpu ? "#fbbf24" : f.primary} />
        <KV k="prompt" v={String(R.prompt || R.fileName || "—").slice(0, 18)} ac={f.secondary} />
      </div>
      {Array.isArray(R.chapters) && <div className="space-y-1">{R.chapters.map((c: any, i: number) => <div key={i} className="flex items-center gap-2 rounded-lg bg-black/50 px-2.5 py-1.5 text-[12px]"><span className="mono text-[11px]" style={{ color: f.primary }}>{c.t}</span><span className="truncate">{c.title}</span><span className="mono ml-auto text-[10px] text-white/50">{c.score}</span></div>)}</div>}
      {Array.isArray(R.summary) && <ul className="list-disc space-y-1 pl-5 text-[12.5px] text-white/80">{R.summary.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>}
      {Array.isArray(R.cuts) && <div className="space-y-1">{R.cuts.map((c: any) => <div key={c.id} className="rounded-lg bg-black/50 p-2"><div className="flex justify-between text-[12px] font-bold"><span>{c.id} · {c.dur}</span><span style={{ color: f.primary }}>VIRAL {c.viral}</span></div><p className="text-[12px] text-white/70">“{c.hook}” · {c.framing}</p></div>)}</div>}
      {Array.isArray(R.lines) && <div className="space-y-1">{R.lines.map((l: any, i: number) => <div key={i} className="rounded-lg bg-black/50 p-2"><p className="mono text-[10px] text-white/45">{l.t}</p><p className="my text-[13px]">{l.mm}</p><p className="text-[11.5px] text-white/55">{l.en}</p></div>)}</div>}
      {R.metrics && <div className="grid grid-cols-2 gap-1.5">{Object.entries(R.metrics).map(([k, v]) => <KV key={k} k={k} v={String(v)} ac={f.primary} />)}</div>}
      {Array.isArray(R.script) && <div className="space-y-1">{R.script.map((s: string, i: number) => <p key={i} className="my rounded-lg bg-black/50 px-2.5 py-1.5 text-[12.5px]">{s}</p>)}</div>}
      {Array.isArray(R.bullets) && <ul className="list-disc space-y-1 pl-5 text-[12.5px] text-white/80">{R.bullets.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>}
      {Array.isArray(R.qa) && <div className="space-y-1">{R.qa.map((q: any, i: number) => <div key={i} className="rounded-lg bg-black/50 p-2"><p className="text-[12px] font-bold" style={{ color: f.primary }}>Q: {q.q}</p><p className="text-[12px] text-white/75">A: {q.a}</p></div>)}</div>}
      {Array.isArray(R.slides) && <div className="space-y-1">{R.slides.map((s: any) => <div key={s.n} className="rounded-lg bg-black/50 px-2.5 py-1.5"><p className="my text-[12.5px] font-bold">{s.n}. {s.title}</p><p className="text-[11px] text-white/55">{s.note}</p></div>)}</div>}
      {Array.isArray(R.entities) && <div className="flex flex-wrap gap-1.5">{R.entities.map((e: string, i: number) => <span key={i} className="mono rounded-full border px-2 py-0.5 text-[10.5px]" style={{ borderColor: f.primary, color: f.primary }}>{e}</span>)}</div>}
      {R.transcript && <p className="my rounded-lg bg-black/50 p-2 text-[12.5px]">“{R.transcript}”</p>}
      {(R.highlightRail || R.rundown || R.readingTime || R.polish || R.pages || R.cards || R.stats || R.captions) && (
        <p className="mono rounded-lg bg-black/50 px-2.5 py-1.5 text-[11px] text-white/65">{R.highlightRail || R.rundown || R.readingTime || R.polish || R.pages || R.cards || R.stats || R.captions}</p>
      )}
    </div>
  );
}

/* ================= history ================= */
export interface HistoryPolicy { dailyLimit: number; used: number; since: string; resetsAt: string; note: string }

export function useHistory(limit = 12) {
  const [rows, setRows] = useState<any[]>([]);
  const [policy, setPolicy] = useState<HistoryPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/tasks?limit=${limit}`, { cache: "no-store" });
      const j = await r.json();
      setRows(j.tasks || []);
      setPolicy(j.policy || null);
    } catch {}
    setLoading(false);
  }, [limit]);
  useEffect(() => { load(); }, [load]);
  return { rows, policy, loading, reload: load };
}

export function AutoCleanBanner({ policy, accent = "#00e5ff" }: { policy: HistoryPolicy | null; accent?: string }) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    if (!policy?.resetsAt) return;
    const tick = () => {
      const ms = new Date(policy.resetsAt).getTime() - Date.now();
      if (ms <= 0) { setLeft("00:00:00"); return; }
      const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
      setLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [policy?.resetsAt]);

  const used = policy?.used ?? 0;
  const limit = policy?.dailyLimit ?? 10;
  const pct = Math.min(100, (used / limit) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-300/45 bg-amber-400/[0.08] p-3">
      <div className="hazard-faint absolute inset-0 opacity-25" />
      <div className="relative flex items-start gap-2.5">
        <span className="badge-pulse grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-[17px] text-black">⏱</span>
        <div className="min-w-0 flex-1">
          <p className="my text-[12.5px] font-black leading-[1.7] text-amber-100">
            ⚠ History သည် <b className="text-white">ည ၁၂ နာရီထိုးတိုင်း</b> System မှ <b className="text-white">အလိုအလျောက် ရှင်းလင်း</b> ပါမည်။
          </p>
          <p className="my text-[11.5px] leading-[1.7] text-white/60">
            တစ်ရက်လျှင် ဗီဒီယို <b style={{ color: accent }}>{limit} ပုဒ်</b> အထိသာ သိမ်းထားပေးသည် — အရေးကြီးသောဖိုင်များကို <b>ကြိုတင် EXPORT</b> လုပ်ထားပါ။
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="mono shrink-0 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-black text-amber-200">⌛ {left || "--:--:--"}</span>
            <span className="h-[7px] flex-1 overflow-hidden rounded-full bg-white/12">
              <span className="block h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#fbbf24,#fff,#fb923c)" }} />
            </span>
            <span className="mono shrink-0 text-[11px] font-bold text-white/70">{used}/{limit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useMemoized<T>(fn: () => T, deps: unknown[]): T { return useMemo(fn, deps as never[]); }
