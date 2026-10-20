"use client";

import { use, useEffect, useState } from "react";
import { getFaction } from "@/lib/factions";
import { gpuCostFor } from "@/lib/studio";
import { EmberCanvas, ForgeShell, IngestionChamber, MicroHUD, ResultSheet, useForgeUser, type IngestedFile } from "@/components/forge-ui";
import { ProfileDrawer, applyTheme, useProfile, type DrawerTab } from "@/components/profile-drawer";
import { RecapStudio } from "@/components/recap-studio";
import { YtProStudio } from "@/components/ytpro-studio";
import { KnowledgeStudio } from "@/components/knowledge-studio";
import { CopyrightScanner } from "@/components/copyright-scanner";
import { VoiceCloneStudio } from "@/components/voiceclone-studio";
import { MagicReelHero } from "@/components/magic-reel";
import { HelpAgent } from "@/components/help-agent";
import { ScrollProgress } from "@/components/forge-ui";
import { GUIDE_FACTIONS } from "@/lib/guide";
import { notFound } from "next/navigation";

export default function FactionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const f = getFaction(slug);
  const { user, refresh } = useForgeUser();
  const { profile, stats, reload: reloadProfile } = useProfile();
  const [drawer, setDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("pro");
  const [file, setFile] = useState<IngestedFile | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [taskId, setTaskId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [gpuBusy, setGpuBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    if (f) {
      const init: Record<string, string> = {};
      f.extraFields.forEach((x) => { init[x.key] = x.defaultValue || x.options?.[0] || ""; });
      setFields(init);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f?.slug]);

  useEffect(() => { applyTheme(profile); }, [profile]);

  if (!f) return notFound();
  const isRecap = f.slug === "recap";
  const isYt = f.slug === "yt-pro";
  const isKnow = f.slug === "knowledge";
  const isCopy = f.slug === "copyright";
  const isVoice = f.slug === "voice-clone";
  const isMagic = f.slug === "magic";
  const customStudio = isRecap || isYt || isKnow || isCopy || isVoice || isMagic;
  const gpuCost = gpuCostFor(f.slug);

  const needsFile = !["prompt-plus-topic", "url", "yt-link"].includes(f.inputKind);
  const ready = !needsFile || file || isRecap;
  const canFire = !busy && !gpuBusy && !charging && ready;
  const proLocked = f.group === "pro" && user && !user.isPro;
  const creditShort = f.group === "forge" && user && user.credits < f.cost;
  const gpuShort = user ? user.credits < (f.group === "pro" ? gpuCost : f.cost + gpuCost) : false;

  const openDrawer = (tab: DrawerTab) => { setDrawerTab(tab); setDrawer(true); };

  const dispatch = async (gpu: boolean) => {
    setErr(null);
    if (needsFile && !file && !isRecap) { setErr("⬢ HEX APERTURE လွတ်နေသည် — feed the chamber first. / ဖိုင်အရင်ထည့်ပါ။"); return; }
    if (gpu) setGpuBusy(true); else setBusy(true);
    if (!gpu) {
      setCharging(true);
      await new Promise((r) => setTimeout(r, 900));
      setCharging(false);
    }
    try {
      const payload: Record<string, unknown> = {
        ...fields, gpu, renderMode: gpu ? "gpu" : "cpu",
        fileName: file?.name, fileSize: file?.size, fileType: file?.type, duration: file?.duration, resolution: file?.res,
      };
      const r = await fetch(f.route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok) {
        if (j.error === "PRO_REQUIRED") setErr("◆ PRO GATE — server rejected. Profile → PRO payment card မှ ဖွင့်ပါ။");
        else if (j.error === "INSUFFICIENT_CREDITS") {
          if (j.gpu || gpu) {
            setErr(`⚡ GPU TURBO အတွက် ${j.cost ?? ""} CR လို — vault မှာ ${j.balance ?? user?.credits ?? 0} CR ပဲရှိ။ Credit ဝယ်ပြီးမှ အမြန်ထုတ်ပါ။`);
            openDrawer("credits");
          } else setErr(`⚡ Need ${f.cost} CR — vault holds ${j.balance ?? user?.credits ?? 0} CR. Profile → Credits slider မှ ဝယ်ပါ။`);
        }
        else setErr(j.message || j.error || "Dispatch fault.");
        if (gpu) setGpuBusy(false); else setBusy(false);
        return;
      }
      setTaskId(j.taskId || j.task_id);
      setShowResult(true);
      await refresh(); await reloadProfile();
    } catch {
      setErr("Uplink fault — retry dispatch.");
    }
    if (gpu) setGpuBusy(false); else setBusy(false);
  };

  const onSaved = async () => { await refresh(); await reloadProfile(); };

  const guide = GUIDE_FACTIONS.find((x) => x.slug === f.slug);

  return (
    <div className="min-h-[100dvh] pb-28 md:pb-10" style={{ ["--ac" as string]: f.primary, ["--bc" as string]: f.secondary }}>
      <ScrollProgress />
      <HelpAgent accent={f.primary} accent2={f.secondary} />
      <ForgeShell user={user} active="forge" onProfile={() => openDrawer("profile")} profile={{ avatar: profile?.avatar, displayName: profile?.displayName, themePrimary: profile?.themePrimary, photoUrl: profile?.photoUrl }} />

      {/* SANCTUM HEADER */}
      <div className="relative overflow-hidden border-b border-white/10" style={{ background: `linear-gradient(180deg, ${f.tertiary}, #04050c 88%)` }}>
        <EmberCanvas colorA={f.primary} colorB={f.secondary} density={46} className="absolute inset-0 h-full w-full" />
        <div className="plasma-drift absolute -left-16 -top-20 h-64 w-64 rounded-full opacity-35 blur-3xl" style={{ background: f.primary }} />
        <div className="plasma-drift-2 absolute -bottom-20 -right-16 h-64 w-64 rounded-full opacity-25 blur-3xl" style={{ background: f.secondary }} />
        <div className="dotgrid absolute inset-0 opacity-15" />
        <div className="absolute -right-4 top-2 select-none text-[130px] font-black leading-none opacity-[0.12]" style={{ color: f.primary }}>{f.glyph}</div>
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${f.primary}, ${f.secondary}, transparent)`, boxShadow: `0 0 20px ${f.glow}` }} />

        <div className="relative mx-auto max-w-3xl px-4 pb-5 pt-4" style={{ paddingLeft: "calc(1rem + var(--safe-l))", paddingRight: "calc(1rem + var(--safe-r))" }}>
          <div className="flex items-center gap-2">
            <nav aria-label="Breadcrumb" className="mono flex items-center gap-1.5 text-[11px] text-white/50">
              <a href="/" className="hover:text-white">‹ FORGE</a>
              <span>/</span>
              <a href="/guide" className="hover:text-white">📖 GUIDE</a>
              <span>/</span>
              <span style={{ color: f.primary }}>{f.name}</span>
            </nav>
            <span className="ml-auto flex gap-1.5">
              <a href={`/guide#faction-${f.slug}`} className="mono rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-[10.5px] font-bold" style={{ color: f.primary }}>📖 နည်းလမ်း</a>
              <button onClick={() => openDrawer("profile")} className="mono rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-[10.5px]">{profile?.avatar ?? "⬢"} ⚙</button>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="relative grid h-[68px] w-[68px] shrink-0 place-items-center">
              <span className="spin-slower absolute inset-0 rounded-full border border-dashed opacity-70" style={{ borderColor: f.primary }} />
              <span className="tick-ring spin-slow absolute inset-0 rounded-full opacity-50" />
              <span className="core-pulse grid h-[52px] w-[52px] place-items-center rounded-2xl border text-[26px]" style={{ borderColor: f.primary, color: f.primary, background: "rgba(0,0,0,0.65)", boxShadow: `0 0 34px ${f.glow}` }}>{f.glyph}</span>
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mono text-[9.5px] tracking-[0.3em]" style={{ color: f.primary }}>{f.code} // {f.microHudLabel}</span>
                {f.group === "pro"
                  ? <span className="mono rounded-full border border-lime-300/50 bg-lime-300/15 px-2 py-0.5 text-[10px] font-bold text-lime-200">◆ PRO ∞</span>
                  : <span className="mono clip-tag bg-gradient-to-r from-amber-300 to-orange-500 px-2.5 py-0.5 text-[10px] font-black text-black">⚡ {f.cost} CR</span>}
                <span className="mono rounded-full border border-amber-300/40 bg-amber-400/10 px-2 py-0.5 text-[9.5px] font-bold text-amber-200">⚡ GPU +{gpuCost} · 2.4×</span>
                {isRecap && <span className="mono rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[9.5px] font-bold text-white/70">★ FLAGSHIP · NO-KEY STT</span>}
                {isRecap && <span className="mono rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[9.5px] font-bold text-white/70">◷ ≤10m · ▭ 5 ratio</span>}
                {isYt && <span className="mono tier-glow rounded-full border border-amber-300/50 bg-black/60 px-2 py-0.5 text-[9.5px] font-bold text-amber-200">★ PREMIUM · ◷ ≤30m · ▭ 5 ratio</span>}
                {isKnow && <span className="mono rounded-full border border-lime-300/50 bg-black/60 px-2 py-0.5 text-[9.5px] font-bold text-lime-200">🌐 WEB DISCOVERY · 10→5</span>}
                {isCopy && <span className="mono rounded-full border px-2 py-0.5 text-[9.5px] font-bold" style={{ borderColor: "#00FFC2aa", color: "#00FFC2", background: "rgba(0,0,0,.6)" }}>🛡 FREE SCAN · 8 SIGNALS</span>}
                {isVoice && <span className="mono rounded-full border px-2 py-0.5 text-[9.5px] font-bold" style={{ borderColor: "#C77DFFaa", color: "#C77DFF", background: "rgba(0,0,0,.6)" }}>🎙 VOICEPRINT · 6 EMOTIONS</span>}
                {isMagic && <span className="mono magic-ribbon rounded-full px-2 py-0.5 text-[9.5px] font-black text-black">★ NEW FEATURE</span>}
              </div>
              <h1 className="display chromatic break-anywhere text-[clamp(22px,7vw,30px)] font-black leading-none tracking-wide">{f.name}</h1>
              <p className="my mt-1 text-[13px] text-white/65">{f.myName} — {f.myTagline}</p>
            </div>
          </div>
          <p className="relative mt-2 max-w-2xl text-[13px] text-white/70">{f.description}</p>
          <p className="my relative mt-1 text-[12.5px] text-white/50">{f.myDescription}</p>
          {isRecap && <p className="my relative mt-1.5 rounded-xl border border-white/12 bg-black/60 px-3 py-2 text-[12px] leading-[1.75] text-white/70">◈ <b>Professional Recap Engine</b> — mic/file/text → speak-to-text auto → cloud/offline အနှစ်ချုပ်။ Slider နဲ့ ကြာချိန် <b>အများဆုံး ၁၀ မိနစ်</b> ထိ စိတ်ကြိုက်သတ်မှတ် + aspect ၅ မျိုး။</p>}
          {isVoice && <p className="my relative mt-1.5 rounded-xl border px-3 py-2 text-[12px] leading-[1.75] text-white/70" style={{ borderColor: "#C77DFF44", background: "rgba(0,0,0,.6)" }}>🎙 <b>Voiceprint Engine</b> — mic ဖြင့် <b>၁၀–၆၀ စက္ကန့်</b> သွင်းပါ (သို့) ဖိုင်တင်ပါ → quality score ပါသော voiceprint ဖန်တီး → စာသားမှန်သမျှကို <b>ခံစားချက် ၆ မျိုး</b> ဖြင့် ပြောပေးမည်။ Vault voice ၆ ခုလည်း ရွေးနိုင်သည်။</p>}
          {isCopy && <p className="my relative mt-1.5 rounded-xl border px-3 py-2 text-[12px] leading-[1.75] text-white/70" style={{ borderColor: "#00FFC244", background: "rgba(0,0,0,.6)" }}>🛡 <b>Claim Radar</b> — တင်မယ့်ဗီဒီယိုကို <b>အခမဲ့</b> ကြိုတင်စစ်ဆေးပါ။ အချက် ၈ ချက် (အသံ/ရုပ်ပုံ လက်ဗွေ · သီချင်းလိုင်စင် · အပိုင်းအချိုး · မက်တာဒေတာ · watermark) ကို YouTube · Meta · TikTok မူဝါဒအလိုက် နှိုင်းယှဉ်ပြီး ပြင်ဆင်နည်း ပေးမည်။</p>}
          {isKnow && <p className="my relative mt-1.5 rounded-xl border border-lime-300/30 bg-black/60 px-3 py-2 text-[12px] leading-[1.75] text-white/70">⟡ <b>Web Discovery Engine</b> — ခလုပ်နှိပ်တာနဲ့ အင်တာနက်မှ ဗဟုသုတ <b>၁၀ ခု</b> ရှာပေးမည်။ ကြိုက်ရာ <b>၅ ခု</b> ရွေး → CONFIRM → Script + အသံ + ဓာတ်ပုံ + Caption #@ ပါသော <b>၁ မိနစ်ကျော် ဗီဒီယို</b> ထွက်မည်။</p>}
          {isYt && <p className="my relative mt-1.5 rounded-xl border border-amber-300/30 bg-black/60 px-3 py-2 text-[12px] leading-[1.75] text-white/70">▶ <b>Premium Credit Flagship</b> — Slider နဲ့ <b>နာရီဝက် (၃၀ မိနစ်)</b> ထိ သတ်မှတ်နိုင်။ ကြာချိန်အလိုက် tier ဈေး (12/18/28/40 CR) + aspect ၅ မျိုး + cinema-reel processing.</p>}
          {guide && (
            <details className="group relative mt-2 overflow-hidden rounded-2xl border border-white/12 bg-black/60">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-[16px]" style={{ borderColor: f.primary, color: f.primary }}>{f.glyph}</span>
                <span className="min-w-0 flex-1"><span className="block text-[13px] font-black">📖 {f.glyph} {f.name} — အလုပ်လုပ်ပုံ အသေးစိတ်</span><span className="my block text-[11px] text-white/55">{f.myName} · ၅ ဆင့်နည်းလမ်း + tips</span></span>
                <span className="mono text-white/40 transition-transform group-open:rotate-90">›</span>
              </summary>
              <div className="faq-open space-y-1.5 border-t border-white/10 p-3">
                <p className="my rounded-xl bg-white/[0.04] px-2.5 py-2 text-[12px] leading-[1.8] text-white/75"><b>ဘာလုပ်တာလဲ — </b>{guide.what}</p>
                <ol className="space-y-1">{guide.steps.slice(0, 5).map((s, i) => <li key={i} className="my flex gap-2 text-[12px] leading-[1.75] text-white/75"><span className="mono grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: f.primary }}>{i + 1}</span><span>{s}</span></li>)}</ol>
                <div className="grid grid-cols-2 gap-1.5">
                  <a href={`/guide#faction-${f.slug}`} className="rounded-xl py-2.5 text-center text-[12px] font-black text-black" style={{ background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})` }}>GUIDE အပြည့်ဖတ် ›</a>
                  <a href="/guide#guide-faq" className="mono rounded-xl border border-white/15 bg-white/5 py-2.5 text-center text-[12px] font-bold">FAQ ›</a>
                </div>
              </div>
            </details>
          )}
        </div>
        <div className="relative h-[40px] overflow-hidden opacity-70"><div className="floor-grid absolute inset-[-40px]" style={{ filter: `drop-shadow(0 0 10px ${f.primary})` }} /></div>
      </div>

      <main className="mx-auto max-w-3xl space-y-3 px-4 pt-4" style={{ paddingLeft: "calc(1rem + var(--safe-l))", paddingRight: "calc(1rem + var(--safe-r))" }}>
        {proLocked && (
          <div className="rise flow-border overflow-hidden rounded-2xl bg-lime-300/[0.06] p-4" style={{ ["--ac" as string]: "#7CFC00", ["--bc" as string]: "#00e5ff" }}>
            <p className="display text-[14px] font-bold text-lime-100">◆ PRO GATE — SERVER WILL REJECT</p>
            <p className="my mt-1 text-[12.5px] text-white/65">ဤစက်သည် Pro Zone တွင်ရှိသည်။ STANDARD (key မလို) သို့မဟုတ် BYOK (ကိုယ့် key, −40%) — ကတ်တစ်ခုတည်းမှာ toggle နဲ့ရွေး။</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => openDrawer("pro")} className="btn-bevel clip-shard-sm bg-gradient-to-r from-lime-300 to-emerald-300 py-3 text-[13px] font-black text-black" style={{ ["--ac" as string]: "#7CFC00" }}>⧉ OPEN PAYMENT</button>
              <button onClick={async () => { await fetch("/api/me/pro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: "30-day", method: "KBPay", mode: "standard" }) }); await onSaved(); }} className="rounded-xl border border-lime-300/50 py-3 text-[13px] font-bold text-lime-100 active:scale-95">QUICK ∞</button>
            </div>
          </div>
        )}
        {creditShort && (
          <div className="rise rounded-2xl border border-amber-300/40 bg-amber-400/[0.07] p-4">
            <p className="text-[14px] font-bold text-amber-100">⚡ Vault short — need {f.cost} CR, holds {user?.credits} CR</p>
            <button onClick={() => openDrawer("credits")} className="mt-2 w-full rounded-xl border border-amber-300/50 bg-amber-400/15 py-3 text-[13px] font-black text-amber-100 active:scale-95">⧉ OPEN CREDIT SLIDER</button>
          </div>
        )}

        {isMagic ? (
          <MagicReelHero isPro={Boolean(user?.isPro)} onOpenPro={() => openDrawer("pro")} vault={user?.credits ?? 0} onOpenCredits={() => openDrawer("credits")} />
        ) : isVoice ? (
          <VoiceCloneStudio f={f} vault={user?.credits ?? 0} gpuCost={gpuCost} onOpenCredits={() => openDrawer("credits")} onDone={onSaved} />
        ) : isCopy ? (
          <CopyrightScanner vault={user?.credits ?? 0} onOpenCredits={() => openDrawer("credits")} />
        ) : isKnow ? (
          <KnowledgeStudio f={f} vault={user?.credits ?? 0} gpuCost={gpuCost} onOpenCredits={() => openDrawer("credits")} onDone={onSaved} />
        ) : isYt ? (
          <YtProStudio f={f} vault={user?.credits ?? 0} gpuCost={gpuCost} onOpenCredits={() => openDrawer("credits")} onDone={onSaved} isPro={Boolean(user?.isPro)} onOpenPro={() => openDrawer("pro")} />
        ) : isRecap ? (
          <RecapStudio f={f} onOpenProfile={(tab?: string) => openDrawer(((tab as DrawerTab) || "keys") as DrawerTab)} gpuCost={gpuCost} vault={user?.credits ?? 0} isPro={Boolean(user?.isPro)} />
        ) : (
          <>
            <section>
              <p className="mono mb-2 flex items-center gap-2 text-[10.5px] tracking-[0.3em] text-white/45"><span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: f.primary }}>1</span> HEX-INGESTION APERTURE</p>
              <IngestionChamber f={f} value={file} onPick={setFile} onClear={() => setFile(null)} />
            </section>

            <section className="flow-border rounded-3xl bg-[#070a15]/90 p-4" style={{ ["--ac" as string]: f.primary, ["--bc" as string]: f.secondary }}>
              <p className="mono mb-2 flex items-center gap-2 text-[10.5px] tracking-[0.3em]" style={{ color: f.primary }}><span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: f.primary }}>2</span> FORGE CONTROL DECK</p>
              <div className="space-y-2.5">
                {f.extraFields.map((fld) => (
                  <label key={fld.key} className="block rounded-2xl border border-white/10 bg-black/50 p-2.5">
                    <span className="mono mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/55">{fld.label}<span className="h-1.5 w-1.5 rounded-full" style={{ background: f.primary, boxShadow: `0 0 8px ${f.primary}` }} /></span>
                    {fld.type === "select" ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(fld.options || []).map((o) => {
                          const on = (fields[fld.key] || "") === o;
                          return <button key={o} type="button" onClick={() => setFields((s) => ({ ...s, [fld.key]: o }))}
                            className={`mono rounded-xl border px-2.5 py-2 text-[11.5px] font-bold active:scale-95 ${on ? "text-black" : "border-white/12 bg-white/5 text-white/65"}`}
                            style={on ? { background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})`, borderColor: "transparent", boxShadow: `0 0 18px ${f.glow}` } : undefined}>{o}</button>;
                        })}
                      </div>
                    ) : fld.type === "textarea" ? (
                      <textarea value={fields[fld.key] || ""} onChange={(e) => setFields((s) => ({ ...s, [fld.key]: e.target.value }))} rows={3}
                        placeholder={fld.placeholder} className="my w-full rounded-xl border border-white/12 bg-black/70 px-3 py-2.5 text-[13.5px] leading-[1.7]" />
                    ) : (
                      <input value={fields[fld.key] || ""} onChange={(e) => setFields((s) => ({ ...s, [fld.key]: e.target.value }))} placeholder={fld.placeholder} inputMode={fld.type === "url" ? "url" : "text"}
                        className="w-full rounded-xl border border-white/12 bg-black/70 px-3 py-2.5 text-[13px]" />
                    )}
                  </label>
                ))}
              </div>
            </section>

            <section>
              <p className="mono mb-2 flex items-center gap-2 text-[10.5px] tracking-[0.3em] text-white/45"><span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: f.primary }}>3</span> MICRO-HUD TELEMETRY</p>
              <MicroHUD f={f} progress={file ? 38 : 8} active={!!file} />
            </section>
          </>
        )}

        {err && <div className="rise rounded-2xl border border-red-400/40 bg-red-500/10 p-3.5 text-[13px] font-semibold text-red-100">{err}</div>}

        {/* RENDER LANE — normal vs GPU */}
        {!customStudio && (
          <div className="sticky bottom-[78px] z-30 md:bottom-4">
            <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/70 p-2">
              <div className="mono mb-1.5 flex items-center justify-between px-1 text-[9.5px] tracking-[0.24em] text-white/45">
                <span>◈ RENDER LANE</span>
                <span>VAULT ⚡ {user?.credits ?? "…"} CR</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className={`flow-border overflow-hidden rounded-2xl ${canFire ? "" : "opacity-50"}`} style={{ ["--ac" as string]: f.primary, ["--bc" as string]: f.secondary }}>
                  <button onClick={() => dispatch(false)} disabled={!canFire}
                    className="relative flex w-full flex-col items-center gap-0.5 overflow-hidden bg-black/85 px-2 py-3 text-white active:scale-[0.99]">
                    {charging && <span className="charge-sweep absolute inset-y-0 w-1/2" style={{ background: `linear-gradient(90deg, transparent, ${f.primary}, transparent)` }} />}
                    <span className="display text-[13px] font-black">{charging ? "◌ CHARGING…" : busy ? "◌ QUEUEING…" : `⬢ IGNITE`}</span>
                    <span className="mono text-[9.5px] opacity-70">{f.group === "pro" ? "∞ FREE · normal" : `${f.cost} CR · normal`}</span>
                  </button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-amber-300/50">
                  <button onClick={() => (gpuShort ? openDrawer("credits") : dispatch(true))} disabled={!canFire}
                    className="gpu-turbo relative flex w-full flex-col items-center gap-0.5 overflow-hidden bg-gradient-to-br from-amber-300 via-orange-400 to-red-400 px-2 py-3 text-black active:scale-[0.99] disabled:opacity-50">
                    <span className="display text-[13px] font-black">{gpuBusy ? "◌ TURBO…" : gpuShort ? "⚡ BUY CR" : "⚡ GPU TURBO"}</span>
                    <span className="mono text-[9.5px] font-bold opacity-80">{gpuShort ? "vault empty" : f.group === "pro" ? `+${gpuCost} CR · 2.4×` : `+${gpuCost} CR · 2.4×`}</span>
                  </button>
                </div>
              </div>
              <p className="mono mt-1.5 text-center text-[9.5px] text-white/40">
                {needsFile ? (file ? `⬢ staged: ${file.name.slice(0, 28)}` : "⬢ awaiting ingest") : "⬢ prompt rig"} · GPU = vault CR ဖြတ် · CR မရှိရင် ဝယ်ခိုင်း
              </p>
            </div>
          </div>
        )}
        <div className="h-2" />
      </main>

      <ProfileDrawer open={drawer} onClose={() => setDrawer(false)} profile={profile} stats={stats} onSaved={onSaved} initialTab={drawerTab} />
      {showResult && taskId && <ResultSheet f={f} taskId={taskId} onClose={() => setShowResult(false)} onCredits={() => { setTaskId(null); setFile(null); }} />}
    </div>
  );
}
