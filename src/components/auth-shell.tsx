"use client";

import { useEffect, useRef } from "react";

/* Shared cinematic auth backdrop — matches dashboard Cyber-Forge language */
export function AuthBackdrop({ a = "#00e5ff", b = "#ff2e4c" }: { a?: string; b?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0, w = 0, h = 0;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const r = cv.getBoundingClientRect();
      w = Math.max(80, r.width); h = Math.max(80, r.height);
      cv.width = w * DPR; cv.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const parts = Array.from({ length: 48 }).map(() => ({
      x: Math.random(), y: Math.random(), v: 0.0004 + Math.random() * 0.0016,
      s: 0.6 + Math.random() * 2, c: Math.random() > 0.5 ? a : b, tw: Math.random() * Math.PI * 2,
    }));
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.tw += 0.04; p.y -= p.v;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(p.tw));
        ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(p.x * w, p.y * h, p.s, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    };
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [a, b]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: "radial-gradient(900px 500px at 50% -10%, rgba(124,58,237,.25), transparent 60%), radial-gradient(700px 420px at 90% 20%, rgba(0,229,255,.16), transparent 60%), radial-gradient(700px 500px at 5% 95%, rgba(255,46,76,.16), transparent 60%), #04050c" }} />
      <div className="aurora-a absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: a, opacity: 0.22 }} />
      <div className="aurora-b absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl" style={{ background: b, opacity: 0.2 }} />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      <div className="dotgrid absolute inset-0 opacity-15" />
      <div className="holo-lines absolute inset-0 opacity-40" />
      <div className="absolute inset-x-0 bottom-0 h-[70px] overflow-hidden opacity-60"><div className="floor-grid absolute inset-[-50px]" /></div>
    </div>
  );
}

export function AuthBrand({ accent = "#00e5ff" }: { accent?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <span className="relative grid h-11 w-11 place-items-center">
        <span className="spin-slow absolute inset-0 rounded-xl border border-dashed" style={{ borderColor: `${accent}88` }} />
        <span className="grid h-[34px] w-[34px] place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 via-cyan-300 to-lime-300 text-[12px] font-black text-black shadow-[0_0_24px_rgba(0,229,255,.55)]">SC</span>
      </span>
      <span className="leading-none">
        <span className="display block text-[17px] font-bold tracking-[0.14em]">CUTFLOW</span>
        <span className="mono block text-[8.5px] tracking-[0.3em]" style={{ color: `${accent}cc` }}>AETHER-FORGE · SECURE</span>
      </span>
    </div>
  );
}

export function FieldShell({
  label, my, icon, children, hint, error, ok,
}: { label: string; my?: string; icon: string; children: React.ReactNode; hint?: string; error?: string | null; ok?: boolean }) {
  return (
    <label className="block">
      <span className="mono mb-1.5 flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.22em] text-white/55">
        <span className="text-[12px]">{icon}</span>{label}
        {my && <span className="my normal-case tracking-normal text-white/35">· {my}</span>}
        {ok && <span className="ml-auto text-lime-300">✓</span>}
        {error && <span className="ml-auto normal-case tracking-normal text-red-300">{error}</span>}
      </span>
      {children}
      {hint && !error && <span className="my mt-1 block text-[10px] text-white/35">{hint}</span>}
    </label>
  );
}
