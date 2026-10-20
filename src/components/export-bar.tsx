"use client";

import { useState } from "react";
import { buildBundle, captionTxt, copyText, downloadText, fullTxt, scriptTxt, srtFrom, timestampTxt } from "@/lib/exporters";

/**
 * Universal OUTPUT EXPORT BAR — shown on every faction result.
 * Video ref + Caption(#@) copy/download + Script + Timestamps + FULL txt.
 */
export function ExportBar({
  factionName, slug, result, accent, accent2,
}: { factionName: string; slug: string; result: Record<string, unknown>; accent: string; accent2: string }) {
  const b = buildBundle(factionName, slug, result);
  const [flash, setFlash] = useState<string | null>(null);
  const [openCap, setOpenCap] = useState(false);

  const ping = (m: string) => { setFlash(m); setTimeout(() => setFlash(null), 1600); };
  const doCopy = async (text: string, label: string) => ping((await copyText(text)) ? `✓ ${label} ကူးပြီး` : "✕ ကူးမရပါ");
  const stamp = b.videoName.replace(/\.(mp4|zip|wav|srt)$/i, "");

  return (
    <div className="rounded-2xl border border-white/12 bg-black/60 p-3" style={{ ["--ac" as string]: accent }}>
      <div className="mono mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] tracking-[0.22em] text-white/50">
        <span style={{ color: accent }}>⬇ OUTPUT EXPORT</span>
        <span className="my normal-case tracking-normal text-white/40">· ဖိုင်ထုတ်ယူ</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 normal-case tracking-normal">{b.aspect}{b.lengthLabel ? ` · ${b.lengthLabel}` : ""}</span>
      </div>

      {/* 1 · VIDEO */}
      <button
        onClick={() => { downloadText(`${stamp}-PACKAGE.txt`, fullTxt(b)); ping("✓ VIDEO package ထုတ်ပြီး"); }}
        className="btn-bevel flex w-full items-center gap-2.5 rounded-2xl px-3 py-3 text-left text-black"
        style={{ ["--ac" as string]: accent, background: `linear-gradient(135deg, ${accent}, #fff, ${accent2})` }}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/85 text-[17px]" style={{ color: accent }}>🎬</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-black leading-tight">VIDEO + CAPTION + TIMESTAMP</span>
          <span className="mono block truncate text-[9.5px] opacity-75">{stamp}-PACKAGE.txt · အပြည့်အစုံ</span>
        </span>
        <span className="shrink-0 text-[16px] font-black">⬇</span>
      </button>

      {/* 2 · caption row */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={() => doCopy(b.caption, "Caption #@")} className="flex items-center gap-2 rounded-2xl border px-2.5 py-2.5 text-left active:scale-95" style={{ borderColor: `${accent}66`, background: `${accent}12` }}>
          <span className="text-[16px]">⧉</span>
          <span className="min-w-0"><span className="block text-[12px] font-black" style={{ color: accent }}>CAPTION COPY</span><span className="my block text-[9.5px] text-white/50">#@ အပါ ကူးမည်</span></span>
        </button>
        <button onClick={() => { downloadText(`${stamp}-CAPTION.txt`, captionTxt(b)); ping("✓ Caption ဖိုင်ရပြီး"); }} className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-2.5 py-2.5 text-left active:scale-95">
          <span className="text-[16px]">💬</span>
          <span className="min-w-0"><span className="block text-[12px] font-black">CAPTION .TXT</span><span className="my block text-[9.5px] text-white/50">#@ ဖိုင်ထုတ်</span></span>
        </button>
      </div>

      {/* 3 · script + timestamp row */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={() => { downloadText(`${stamp}-SCRIPT.txt`, scriptTxt(b)); ping("✓ Script ဖိုင်ရပြီး"); }} className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-2.5 py-2.5 text-left active:scale-95">
          <span className="text-[16px]">📝</span>
          <span className="min-w-0"><span className="block text-[12px] font-black">SCRIPT .TXT</span><span className="my block text-[9.5px] text-white/50">စာသားအပြည့်</span></span>
        </button>
        <button onClick={() => { downloadText(`${stamp}-TIMESTAMP.txt`, timestampTxt(b)); ping("✓ Timestamp ဖိုင်ရပြီး"); }} className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-2.5 py-2.5 text-left active:scale-95">
          <span className="text-[16px]">⏱</span>
          <span className="min-w-0"><span className="block text-[12px] font-black">TIMESTAMP</span><span className="my block text-[9.5px] text-white/50">{b.timestamps.length} အချက်</span></span>
        </button>
      </div>

      {/* 4 · secondary */}
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <button onClick={() => doCopy(b.scriptText, "Script")} className="mono rounded-xl border border-white/12 bg-white/5 py-2 text-[10.5px] font-bold active:scale-95">⧉ Script</button>
        <button onClick={() => doCopy(b.hashtags.join(" ") + "\n" + b.mentions.join(" "), "#@ tags")} className="mono rounded-xl border border-white/12 bg-white/5 py-2 text-[10.5px] font-bold active:scale-95">⧉ #@ only</button>
        <button onClick={() => { downloadText(`${stamp}.srt`, srtFrom(b)); ping("✓ SRT ရပြီး"); }} className="mono rounded-xl border border-white/12 bg-white/5 py-2 text-[10.5px] font-bold active:scale-95">⬇ SRT</button>
      </div>

      {/* caption preview */}
      <button onClick={() => setOpenCap((v) => !v)} className="mono mt-2 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-2.5 py-2 text-[10.5px] text-white/60">
        <span>{openCap ? "▾" : "▸"}</span> CAPTION အကြို ကြည့်ရန် <span className="ml-auto">{b.hashtags.length} tags</span>
      </button>
      {openCap && (
        <pre className="my thin-scroll mt-1.5 max-h-[160px] overflow-y-auto whitespace-pre-wrap break-anywhere rounded-xl border border-white/10 bg-black/60 p-2.5 text-[11px] leading-[1.75] text-white/75">{b.caption}</pre>
      )}

      {flash && <p className="mono mt-2 rounded-xl bg-white/10 px-2.5 py-1.5 text-center text-[11px] font-bold" style={{ color: accent }}>{flash}</p>}
    </div>
  );
}
