"use client";

import { ASPECT_RATIOS, aspectSpec, fmtDuration, fmtDurationMy, type DurationSpec } from "@/lib/studio";

/* ============ DURATION SLIDER — neon timeline scrubber ============ */
export function DurationSlider({
  spec, value, onChange, accent, accent2, note,
}: {
  spec: DurationSpec; value: number; onChange: (v: number) => void;
  accent: string; accent2: string; note?: string;
}) {
  const pct = ((value - spec.min) / Math.max(1, spec.max - spec.min)) * 100;
  const marks = [spec.min, Math.round((spec.min + spec.max) / 2), spec.max];
  const quick = [spec.min, Math.round(spec.max * 0.25), Math.round(spec.max * 0.5), spec.max].map(
    (v) => Math.min(spec.max, Math.max(spec.min, Math.round(v / spec.step) * spec.step))
  );
  const uniqueQuick = Array.from(new Set(quick));

  return (
    <div className="rounded-2xl border border-white/12 bg-black/55 p-3" style={{ ["--ac" as string]: accent }}>
      <div className="mono mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.2em] text-white/55">
        <span>◷ {spec.label}</span>
        <span className="my normal-case tracking-normal text-white/40">· {spec.my}</span>
        <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold text-black" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>
          အများဆုံး {fmtDuration(spec.max)}
        </span>
      </div>

      {/* big readout */}
      <div className="flex items-end gap-2">
        <p className="display text-[34px] font-black leading-none tabular-nums" style={{ color: accent, textShadow: `0 0 26px ${accent}66` }}>
          {fmtDuration(value)}
        </p>
        <p className="my pb-1 text-[11.5px] text-white/55">{fmtDurationMy(value)}</p>
      </div>

      {/* track */}
      <div className="relative mt-2">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[14px] -translate-y-1/2 overflow-hidden rounded-full border border-white/12 bg-white/[0.06]">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, #fff 70%, ${accent2})`, boxShadow: `0 0 20px ${accent}77` }} />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-[3px] opacity-45">
            {Array.from({ length: 24 }).map((_, i) => <span key={i} className="h-[6px] w-px bg-white/45" />)}
          </div>
        </div>
        <input
          type="range" min={spec.min} max={spec.max} step={spec.step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={spec.label}
          className="dur-slider relative z-10 w-full"
          style={{ ["--ac" as string]: accent }}
        />
      </div>
      <div className="mono mt-1 flex justify-between text-[9.5px] text-white/40">
        {marks.map((m) => <span key={m}>{fmtDuration(m)}</span>)}
      </div>

      {/* quick chips */}
      <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
        {uniqueQuick.map((q) => (
          <button key={q} type="button" onClick={() => onChange(q)}
            className={`mono shrink-0 rounded-xl border px-3 py-2 text-[11px] font-bold active:scale-95 ${value === q ? "text-black" : "border-white/12 bg-white/5 text-white/60"}`}
            style={value === q ? { background: `linear-gradient(135deg, ${accent}, ${accent2})`, borderColor: "transparent" } : undefined}>
            {fmtDuration(q)}
          </button>
        ))}
      </div>
      {note && <p className="my mt-1.5 text-[10.5px] leading-[1.7] text-white/45">{note}</p>}
    </div>
  );
}

/* ============ ASPECT RATIO PICKER — live shape preview ============ */
export function AspectPicker({
  value, onChange, accent, accent2,
}: { value: string; onChange: (v: string) => void; accent: string; accent2: string }) {
  const sel = aspectSpec(value);
  return (
    <div className="rounded-2xl border border-white/12 bg-black/55 p-3">
      <div className="mono mb-2 flex flex-wrap items-center gap-x-2 text-[10px] uppercase tracking-[0.2em] text-white/55">
        <span>▭ Aspect ratio</span>
        <span className="my normal-case tracking-normal text-white/40">· ဖရိမ်အချိုး</span>
        <span className="ml-auto font-bold" style={{ color: accent }}>{sel.label} · {sel.use}</span>
      </div>
      <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
        {ASPECT_RATIOS.map((a) => {
          const on = a.id === value;
          const boxW = a.w >= a.h ? 34 : Math.round((a.w / a.h) * 30);
          const boxH = a.w >= a.h ? Math.round((a.h / a.w) * 34) : 30;
          return (
            <button key={a.id} type="button" onClick={() => onChange(a.id)} aria-pressed={on}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 active:scale-95 ${on ? "" : "border-white/12 bg-white/[0.03]"}`}
              style={on ? { borderColor: accent, background: `${accent}1f`, boxShadow: `0 0 18px ${accent}44` } : undefined}>
              <span className="grid h-[34px] place-items-center">
                <span className="rounded-[3px] border-2 transition-all" style={{ width: boxW, height: boxH, borderColor: on ? accent : "rgba(255,255,255,0.35)", background: on ? `linear-gradient(135deg, ${accent}44, ${accent2}33)` : "transparent" }} />
              </span>
              <span className="mono text-[9.5px] font-bold" style={{ color: on ? accent : "rgba(255,255,255,0.6)" }}>{a.label}</span>
            </button>
          );
        })}
      </div>
      <p className="my mt-1.5 text-[10.5px] text-white/45">{sel.my} — {sel.use}</p>
    </div>
  );
}
