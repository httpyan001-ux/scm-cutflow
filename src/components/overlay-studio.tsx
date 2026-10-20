"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_PREFS, TICKER_MAX, aspectBox, type StudioPrefs, type XY } from "@/lib/studio-prefs-client";

type LayerId = "subtitle" | "logo" | "title" | "ticker";

const NUDGE = 1;      // % per tap
const NUDGE_BIG = 5;  // % per long-press / double arrow

/* ============ tiny on/off switch ============ */
function Switch({ on, onChange, ac, bc }: { on: boolean; onChange: (v: boolean) => void; ac: string; bc: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="forge-switch shrink-0" data-on={on} style={{ ["--ac" as string]: ac, ["--bc" as string]: bc }} />
  );
}

/* ============ game-pad nudge cluster ============ */
function DPad({ onMove, accent, label }: { onMove: (dx: number, dy: number) => void; accent: string; label: string }) {
  const hold = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = (dx: number, dy: number) => {
    onMove(dx, dy);
    hold.current = setInterval(() => onMove(dx * NUDGE_BIG, dy * NUDGE_BIG), 380);
  };
  const stop = () => { if (hold.current) clearInterval(hold.current); hold.current = null; };
  useEffect(() => stop, []);

  const Btn = ({ dx, dy, children }: { dx: number; dy: number; children: string }) => (
    <button type="button"
      onPointerDown={(e) => { e.preventDefault(); start(dx, dy); }}
      onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-black/60 text-[14px] font-black active:scale-90"
      style={{ color: accent }}>{children}</button>
  );

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="mono text-[8.5px] tracking-widest text-white/40">{label}</span>
      <Btn dx={0} dy={-NUDGE}>▲</Btn>
      <div className="flex gap-1">
        <Btn dx={-NUDGE} dy={0}>◀</Btn>
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[10px] text-white/35">✥</span>
        <Btn dx={NUDGE} dy={0}>▶</Btn>
      </div>
      <Btn dx={0} dy={NUDGE}>▼</Btn>
    </div>
  );
}

/* ============ slider row ============ */
function Row({ label, my, value, min, max, step = 1, suffix, onChange, accent }: {
  label: string; my?: string; value: number; min: number; max: number; step?: number; suffix?: string;
  onChange: (v: number) => void; accent: string;
}) {
  return (
    <label className="block">
      <span className="mono mb-1 flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.18em] text-white/50">
        {label}{my && <span className="my normal-case tracking-normal text-white/35">· {my}</span>}
        <span className="ml-auto font-bold" style={{ color: accent }}>{value}{suffix}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="dur-slider w-full" style={{ ["--ac" as string]: accent }} />
    </label>
  );
}

/* ============ MAIN ============ */
export function OverlayStudio({
  isPro, accent, accent2, aspect, onOpenPro, onChange,
}: {
  isPro: boolean; accent: string; accent2: string; aspect: string;
  onOpenPro: () => void;
  onChange?: (p: StudioPrefs, logoUrl: string) => void;
}) {
  const [prefs, setPrefs] = useState<StudioPrefs>(DEFAULT_PREFS);
  const [logoUrl, setLogoUrl] = useState("");
  const [active, setActive] = useState<LayerId>("subtitle");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const dragging = useRef<LayerId | null>(null);

  /* ---- load saved prefs (device-independent) ---- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me/studio", { cache: "no-store" });
        const j = await r.json();
        if (j?.prefs) setPrefs(j.prefs);
        if (j?.logoUrl) setLogoUrl(j.logoUrl);
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { if (loaded) onChangeRef.current?.(prefs, logoUrl); }, [prefs, logoUrl, loaded]);

  const patch = useCallback(<K extends keyof StudioPrefs>(key: K, value: Partial<StudioPrefs[K]>) => {
    setPrefs((p: StudioPrefs) => ({ ...p, [key]: { ...(p[key] as object), ...value } as StudioPrefs[K] }));
  }, []);

  const movePos = useCallback((layer: LayerId, dx: number, dy: number) => {
    setPrefs((p: StudioPrefs) => {
      if (layer === "ticker") return p;
      const cur = (p[layer] as { pos: XY }).pos;
      const pos = { x: Math.min(100, Math.max(0, cur.x + dx)), y: Math.min(100, Math.max(0, cur.y + dy)) };
      return { ...p, [layer]: { ...(p[layer] as object), pos } } as StudioPrefs;
    });
  }, []);

  const setPos = useCallback((layer: LayerId, pos: XY) => {
    if (layer === "ticker") return;
    setPrefs((p: StudioPrefs) => ({ ...p, [layer]: { ...(p[layer] as object), pos } } as StudioPrefs));
  }, []);

  /* ---- drag on the preview stage ---- */
  const pointerPos = (e: React.PointerEvent): XY | null => {
    const el = stageRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)),
    };
  };
  const onDown = (layer: LayerId) => (e: React.PointerEvent) => {
    if (!isPro) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragging.current = layer;
    setActive(layer);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const p = pointerPos(e);
    if (p) setPos(dragging.current, p);
  };
  const onUp = () => { dragging.current = null; };

  /* ---- logo upload (client resize) ---- */
  const pickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files?.[0];
    if (!fl) return;
    if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(fl.type)) { setMsg("✕ PNG / JPG / WEBP / SVG သာ"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      if (fl.type === "image/svg+xml") { setLogoUrl(src); patch("logo", { enabled: true }); return; }
      const img = new Image();
      img.onload = () => {
        const max = 420;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * scale);
        cv.height = Math.round(img.height * scale);
        const ctx = cv.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        const out = cv.toDataURL("image/png");
        if (out.length > 1_100_000) { setMsg("✕ Logo ကြီးလွန်းသည်"); return; }
        setLogoUrl(out);
        patch("logo", { enabled: true });
        setActive("logo");
        setMsg("✓ Logo တင်ပြီး — SAVE နှိပ်ပါ");
        setTimeout(() => setMsg(null), 2200);
      };
      img.src = src;
    };
    reader.readAsDataURL(fl);
  };

  const save = async () => {
    if (!isPro) { onOpenPro(); return; }
    setSaving(true); setMsg(null);
    try {
      const r = await fetch("/api/me/studio", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs, logoUrl }),
      });
      const j = await r.json();
      setMsg(r.ok ? (j.message || "✓ သိမ်းပြီး") : (j.message || "✕ သိမ်းမရပါ"));
    } catch { setMsg("✕ ကွန်ရက်မှား"); }
    setSaving(false);
    setTimeout(() => setMsg(null), 2600);
  };

  const detectTitle = async (hint: string) => {
    setDetecting(true);
    try {
      const r = await fetch("/api/v1/movie-title", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hint }) });
      const j = await r.json();
      if (j?.title) {
        patch("title", { manual: j.title, manualYear: j.year || "", enabled: true });
        setMsg(`✓ ${j.engine === "gemini" ? "Gemini" : "Offline"} — ${j.title}${j.year ? ` (${j.year})` : ""}`);
      }
    } catch { setMsg("✕ ရှာမတွေ့ပါ"); }
    setDetecting(false);
    setTimeout(() => setMsg(null), 2800);
  };

  const box = aspectBox(prefs.org ? aspect : "9:16");
  const sub = prefs.subtitle, lg = prefs.logo, ti = prefs.title, tk = prefs.ticker;
  const lockClass = isPro ? "" : "pointer-events-none select-none opacity-45";

  return (
    <section className="rounded-3xl border border-white/12 bg-black/55 p-3" style={{ ["--ac" as string]: accent }}>
      <div className="mono mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] tracking-[0.24em] text-white/55">
        <span style={{ color: accent }}>🎛 OVERLAY STUDIO</span>
        <span className="my normal-case tracking-normal text-white/40">· စိတ်ကြိုက် ထပ်ပိုးများ</span>
        <span className={`mono ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold ${isPro ? "bg-lime-300/15 text-lime-200" : "bg-white/10 text-white/55"}`}>{isPro ? "◆ PRO" : "🔒 PRO ONLY"}</span>
      </div>

      {!isPro && (
        <button onClick={onOpenPro} className="mb-2 w-full rounded-2xl border border-lime-300/40 bg-lime-300/[0.08] px-3 py-2.5 text-left active:scale-[0.99]">
          <p className="text-[12.5px] font-black text-lime-100">◆ PRO member များသာ သုံးနိုင်သည်</p>
          <p className="my text-[10.5px] text-white/60">စာတန်းထိုး · Logo · Movie title · ကြော်ငြာစာတန်း — ဖွင့်ရန် နှိပ်ပါ</p>
        </button>
      )}

      {/* ---------- LIVE PREVIEW STAGE ---------- */}
      <div className="relative mx-auto w-full overflow-hidden rounded-2xl border border-white/15 bg-[#06070d]"
        ref={stageRef} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        style={{ aspectRatio: `${box.w} / ${box.h}`, maxWidth: box.w >= box.h ? "100%" : "300px", touchAction: "none" }}>
        {/* fake frame content */}
        <div className="absolute inset-0 opacity-70" style={{ background: `linear-gradient(135deg, ${accent}22, transparent 45%, ${accent2}22), repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0 10px, transparent 10px 20px)` }} />
        <div className="dotgrid absolute inset-0 opacity-20" />
        {!prefs.org && aspect !== "9:16" && (
          <>
            <div className="absolute inset-x-0 top-0 h-[16%] bg-black/55 backdrop-blur-[3px]" />
            <div className="absolute inset-x-0 bottom-0 h-[16%] bg-black/55 backdrop-blur-[3px]" />
            <span className="mono absolute left-1/2 top-[6%] -translate-x-1/2 rounded bg-black/70 px-1.5 py-0.5 text-[7.5px] text-white/60">BLUR PAD</span>
          </>
        )}
        <span className="mono absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[8px] text-white/60">
          {prefs.org ? aspect : `${aspect} → 9:16`}
        </span>

        {/* ticker band */}
        {tk.enabled && tk.text && (
          <div className="absolute inset-x-0 top-0 overflow-hidden border-b border-white/15 bg-black/70 py-0.5">
            <div className="ticker-track mono flex w-max gap-6 whitespace-nowrap text-[7.5px] font-bold" style={{ color: tk.color }}>
              <span>{tk.text}</span><span>{tk.text}</span>
            </div>
          </div>
        )}

        {/* movie title */}
        {ti.enabled && (
          <div onPointerDown={onDown("title")}
            className={`absolute cursor-move ${active === "title" ? "ring-1" : ""}`}
            style={{ left: `${ti.pos.x}%`, top: `${ti.pos.y}%`, transform: "translate(-50%,-50%)", opacity: ti.opacity / 100 }}>
            <span className="display whitespace-nowrap rounded px-1.5 py-0.5 text-center font-black" style={{ fontSize: `${Math.max(8, ti.size / 2.6)}px`, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.9)", background: active === "title" ? `${accent}26` : "transparent" }}>
              {ti.manual || "MOVIE TITLE"}{ti.showYear && (ti.manualYear || "2024") ? ` (${ti.manualYear || "2024"})` : ""}
            </span>
          </div>
        )}

        {/* logo */}
        {lg.enabled && logoUrl && (
          <div onPointerDown={onDown("logo")}
            className={`absolute cursor-move ${active === "logo" ? "ring-1 ring-white/50" : ""}`}
            style={{ left: `${lg.pos.x}%`, top: `${lg.pos.y}%`, transform: "translate(-50%,-50%)", width: `${lg.scale}%`, opacity: lg.opacity / 100 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="logo" className={`w-full ${lg.rounded ? "rounded-lg" : ""}`} draggable={false} />
          </div>
        )}

        {/* subtitle */}
        {sub.enabled && (
          <div onPointerDown={onDown("subtitle")}
            className={`absolute cursor-move ${active === "subtitle" ? "ring-1 ring-white/50" : ""}`}
            style={{ left: `${sub.pos.x}%`, top: `${sub.pos.y}%`, transform: "translate(-50%,-50%)", maxWidth: "92%", opacity: sub.opacity / 100 }}>
            <span className="my block whitespace-nowrap rounded px-1.5 py-0.5 text-center font-bold"
              style={{
                fontSize: `${Math.max(7, sub.size / 2.8)}px`, color: sub.color,
                textAlign: sub.align,
                background: sub.bg === "solid" ? "rgba(0,0,0,.85)" : sub.bg === "soft" ? "rgba(0,0,0,.45)" : "transparent",
                textShadow: sub.stroke ? "0 0 3px #000, 0 0 6px #000" : "none",
              }}>
              မင်္ဂလာပါ — စာတန်းနမူနာ
            </span>
          </div>
        )}

        {isPro && <span className="mono absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[7.5px] text-white/50">✥ ဆွဲ၍ နေရာချပါ</span>}
      </div>

      {/* ---------- LAYER TABS ---------- */}
      <div className={`mt-2 grid grid-cols-4 gap-1 ${lockClass}`}>
        {([
          ["subtitle", "☰", "စာတန်း", sub.enabled],
          ["logo", "◆", "Logo", lg.enabled],
          ["title", "🎬", "ခေါင်းစဉ်", ti.enabled],
          ["ticker", "📢", "ကြော်ငြာ", tk.enabled],
        ] as [LayerId, string, string, boolean][]).map(([id, icon, label, on]) => (
          <button key={id} onClick={() => setActive(id)}
            className={`relative rounded-xl border px-1 py-2 text-center active:scale-95 ${active === id ? "" : "border-white/12 bg-white/[0.03]"}`}
            style={active === id ? { borderColor: accent, background: `${accent}18` } : undefined}>
            <span className="block text-[14px]">{icon}</span>
            <span className="my block text-[9px] text-white/60">{label}</span>
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ background: on ? "#7CFC00" : "rgba(255,255,255,.2)" }} />
          </button>
        ))}
      </div>

      {/* ---------- ACTIVE LAYER CONTROLS ---------- */}
      <div className={`mt-2 space-y-2 rounded-2xl border border-white/10 bg-black/40 p-3 ${lockClass}`}>
        {/* SUBTITLE */}
        {active === "subtitle" && (
          <>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-black">☰ စာတန်းထိုး</span><span className="my block text-[10px] text-white/50">Subtitle overlay</span></span>
              <Switch on={sub.enabled} onChange={(v) => patch("subtitle", { enabled: v })} ac={accent} bc={accent2} />
            </div>
            {sub.enabled && (
              <>
                <div className="flex items-start gap-3">
                  <DPad onMove={(dx, dy) => movePos("subtitle", dx, dy)} accent={accent} label="နေရာချ" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Row label="Size" my="အရွယ်" value={sub.size} min={12} max={48} suffix="px" accent={accent} onChange={(v) => patch("subtitle", { size: v })} />
                    <Row label="Opacity" my="ထင်ရှားမှု" value={sub.opacity} min={10} max={100} suffix="%" accent={accent} onChange={(v) => patch("subtitle", { opacity: v })} />
                    <p className="mono text-[9.5px] text-white/40">X {Math.round(sub.pos.x)}% · Y {Math.round(sub.pos.y)}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["none", "soft", "solid"] as const).map((b) => (
                    <button key={b} onClick={() => patch("subtitle", { bg: b })} className={`mono rounded-lg border py-1.5 text-[10px] font-bold ${sub.bg === b ? "text-black" : "border-white/12 bg-white/5 text-white/55"}`}
                      style={sub.bg === b ? { background: accent, borderColor: "transparent" } : undefined}>{b}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={sub.color} onChange={(e) => patch("subtitle", { color: e.target.value })} className="h-9 w-12 rounded-lg border border-white/20 bg-transparent" />
                  <button onClick={() => patch("subtitle", { stroke: !sub.stroke })} className={`mono flex-1 rounded-lg border py-2 text-[10.5px] font-bold ${sub.stroke ? "text-black" : "border-white/12 text-white/55"}`} style={sub.stroke ? { background: accent, borderColor: "transparent" } : undefined}>
                    {sub.stroke ? "✓" : "○"} အနားမည်း
                  </button>
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as const).map((a) => (
                      <button key={a} onClick={() => patch("subtitle", { align: a })} className={`mono h-9 w-9 rounded-lg border text-[12px] ${sub.align === a ? "text-black" : "border-white/12 text-white/55"}`} style={sub.align === a ? { background: accent, borderColor: "transparent" } : undefined}>
                        {a === "left" ? "⬅" : a === "center" ? "↔" : "➡"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* LOGO */}
        {active === "logo" && (
          <>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-black">◆ Logo</span><span className="my block text-[10px] text-white/50">ကိုယ်ပိုင်အမှတ်တံဆိပ်</span></span>
              <Switch on={lg.enabled} onChange={(v) => patch("logo", { enabled: v })} ac={accent} bc={accent2} />
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={pickLogo} />
            <div className="flex items-center gap-2">
              <button onClick={() => logoRef.current?.click()} className="btn-bevel flex-1 rounded-xl py-2.5 text-[12px] font-black text-black" style={{ ["--ac" as string]: accent, background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>
                ⬆ Logo တင်မည်
              </button>
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/20 bg-black/70">
                {logoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={logoUrl} alt="logo preview" className="h-full w-full object-contain p-1" />
                  : <span className="mono text-[8px] text-white/35">none</span>}
              </span>
              {logoUrl && <button onClick={() => { setLogoUrl(""); patch("logo", { enabled: false }); }} className="mono shrink-0 rounded-xl border border-red-400/40 px-2 py-2 text-[10px] text-red-200">✕</button>}
            </div>
            {lg.enabled && logoUrl && (
              <div className="flex items-start gap-3">
                <DPad onMove={(dx, dy) => movePos("logo", dx, dy)} accent={accent} label="နေရာချ" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Row label="Size" my="အရွယ်" value={lg.scale} min={4} max={40} suffix="%" accent={accent} onChange={(v) => patch("logo", { scale: v })} />
                  <Row label="Opacity" my="ထင်ရှား/ပျက်သား" value={lg.opacity} min={5} max={100} suffix="%" accent={accent} onChange={(v) => patch("logo", { opacity: v })} />
                  <button onClick={() => patch("logo", { rounded: !lg.rounded })} className={`mono w-full rounded-lg border py-1.5 text-[10px] font-bold ${lg.rounded ? "text-black" : "border-white/12 text-white/55"}`} style={lg.rounded ? { background: accent, borderColor: "transparent" } : undefined}>
                    {lg.rounded ? "✓" : "○"} ထောင့်ပြေ
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MOVIE TITLE */}
        {active === "title" && (
          <>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-black">🎬 Movie title</span><span className="my block text-[10px] text-white/50">Gemini ဖြင့် အလိုအလျောက်ရှာ</span></span>
              <Switch on={ti.enabled} onChange={(v) => patch("title", { enabled: v })} ac={accent} bc={accent2} />
            </div>
            {ti.enabled && (
              <>
                <div className="flex gap-1.5">
                  <input value={ti.manual} onChange={(e) => patch("title", { manual: e.target.value.slice(0, 80) })} placeholder="ခေါင်းစဉ် (auto-detect ရန် ကွက်လပ်ထားပါ)"
                    className="search-glow my min-w-0 flex-1 rounded-xl border border-white/15 bg-black/70 px-2.5 py-2.5 text-[12px]" style={{ ["--ac" as string]: accent }} />
                  <input value={ti.manualYear} onChange={(e) => patch("title", { manualYear: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="နှစ်"
                    inputMode="numeric" className="mono w-[62px] shrink-0 rounded-xl border border-white/15 bg-black/70 px-2 py-2.5 text-center text-[12px]" />
                </div>
                <button onClick={() => detectTitle(ti.manual || "video")} disabled={detecting}
                  className="mono w-full rounded-xl border border-white/15 bg-white/5 py-2 text-[11px] font-bold disabled:opacity-50">
                  {detecting ? "◌ ရှာနေသည်…" : "✨ Gemini ဖြင့် ခေါင်းစဉ်ရှာမည်"}
                </button>
                <div className="flex items-start gap-3">
                  <DPad onMove={(dx, dy) => movePos("title", dx, dy)} accent={accent} label="နေရာချ" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Row label="Size" my="အရွယ်" value={ti.size} min={14} max={56} suffix="px" accent={accent} onChange={(v) => patch("title", { size: v })} />
                    <Row label="Opacity" my="ထင်ရှားမှု" value={ti.opacity} min={10} max={100} suffix="%" accent={accent} onChange={(v) => patch("title", { opacity: v })} />
                    <button onClick={() => patch("title", { showYear: !ti.showYear })} className={`mono w-full rounded-lg border py-1.5 text-[10px] font-bold ${ti.showYear ? "text-black" : "border-white/12 text-white/55"}`} style={ti.showYear ? { background: accent, borderColor: "transparent" } : undefined}>
                      {ti.showYear ? "✓" : "○"} ထွက်သည့်နှစ် ပြ
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* TICKER */}
        {active === "ticker" && (
          <>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-black">📢 ကြော်ငြာစာတန်း</span><span className="my block text-[10px] text-white/50">အပေါ်ဘားတန်း · စက္ကန့်အလိုက် ပြေး</span></span>
              <Switch on={tk.enabled} onChange={(v) => patch("ticker", { enabled: v })} ac={accent} bc={accent2} />
            </div>
            {tk.enabled && (
              <>
                <textarea value={tk.text} onChange={(e) => patch("ticker", { text: e.target.value.slice(0, TICKER_MAX) })} rows={3}
                  placeholder="ကြော်ငြာစာသား ရိုက်ထည့်ပါ…"
                  className="search-glow my w-full rounded-xl border border-white/15 bg-black/70 px-2.5 py-2 text-[12px] leading-[1.7]" style={{ ["--ac" as string]: accent }} />
                <div className="mono flex items-center gap-2 text-[9.5px]">
                  <span className={tk.text.length > TICKER_MAX - 40 ? "text-amber-300" : "text-white/45"}>{tk.text.length}/{TICKER_MAX} လုံး</span>
                  <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full" style={{ width: `${(tk.text.length / TICKER_MAX) * 100}%`, background: tk.text.length > TICKER_MAX - 40 ? "#fbbf24" : accent }} />
                  </span>
                </div>
                <Row label="Every" my="ကြားကာလ" value={tk.everySec} min={5} max={60} suffix="s" accent={accent} onChange={(v) => patch("ticker", { everySec: v })} />
                <Row label="Speed" my="အမြန်နှုန်း" value={tk.speed} min={1} max={10} accent={accent} onChange={(v) => patch("ticker", { speed: v })} />
                <div className="flex items-center gap-2">
                  <span className="mono text-[9.5px] text-white/50">အရောင်</span>
                  <input type="color" value={tk.color} onChange={(e) => patch("ticker", { color: e.target.value })} className="h-9 w-12 rounded-lg border border-white/20 bg-transparent" />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ---------- ORG MODE ---------- */}
      <div className={`mt-2 rounded-2xl border p-3 ${lockClass}`} style={{ borderColor: prefs.org ? `${accent}66` : "rgba(251,191,36,.45)", background: prefs.org ? `${accent}0f` : "rgba(251,191,36,.07)" }}>
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-black">⬛ ORG — မူရင်းအချိုး</span>
            <span className="my block text-[10.5px] leading-[1.7] text-white/55">
              {prefs.org
                ? `ဖွင့်ထား → ရွေးထားသော ${aspect} အတိအကျ ထုတ်မည်`
                : `ပိတ်ထား → ${aspect} ဖြတ်ပြီး 9:16 အဖြစ် အပေါ်/အောက် ဘလားဖြည့်မည်`}
            </span>
          </span>
          <Switch on={prefs.org} onChange={(v) => setPrefs((p: StudioPrefs) => ({ ...p, org: v }))} ac={accent} bc={accent2} />
        </div>
        <p className="mono mt-1.5 text-[9.5px] leading-relaxed text-white/40">
          OpenCV person-tracking crop — လူကို အလယ်တည့်ထား၍ ဖြတ်သည် (hard centre cut မဟုတ်)
        </p>
      </div>

      {msg && <p className="mono mt-2 rounded-xl bg-white/10 px-2.5 py-1.5 text-center text-[11px] font-bold" style={{ color: accent }}>{msg}</p>}

      <button onClick={save} disabled={saving || !isPro}
        className="btn-bevel mt-2 w-full rounded-2xl py-3 text-[13px] font-black text-black disabled:opacity-40"
        style={{ ["--ac" as string]: accent, background: `linear-gradient(135deg, ${accent}, #fff, ${accent2})` }}>
        {saving ? "◌ သိမ်းနေသည်…" : "💾 SAVE — ဖုန်းအားလုံးတွင် တူညီမည်"}
      </button>
    </section>
  );
}
