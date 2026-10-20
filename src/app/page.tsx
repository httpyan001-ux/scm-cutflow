"use client";

import { useEffect, useState } from "react";
import { useMemo } from "react";
import { FACTIONS, FORGE_FACTIONS, PRO_FACTIONS } from "@/lib/factions";
import { GUIDE_FACTIONS } from "@/lib/guide";
import { bgCss } from "@/lib/studio";
import { AutoCleanBanner, AuroraBg, EmberCanvas, FactionCard, ForgeShell, PipelineMini, ScrollProgress, useForgeUser, useHistory } from "@/components/forge-ui";
import { ProfileDrawer, applyTheme, useProfile, type DrawerTab } from "@/components/profile-drawer";
import { HelpAgent } from "@/components/help-agent";
import { MagicReelHero } from "@/components/magic-reel";
import { PRO_PLANS, gpuCostFor } from "@/lib/studio";

export default function Dashboard() {
  const { user, loading, refresh } = useForgeUser();
  const { rows, policy } = useHistory(10);
  const { profile, stats, reload: reloadProfile } = useProfile();
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "pro" | "forge">("all");
  const [drawer, setDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("pro");
  const [deckQuery, setDeckQuery] = useState("");
  const openDrawer = (tab: DrawerTab) => { setDrawerTab(tab); setDrawer(true); };

  useEffect(() => {
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, []);

  useEffect(() => { applyTheme(profile); }, [profile]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };
  const activatePro = async () => {
    const r = await fetch("/api/me/pro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: "30-day", method: "KBPay" }) });
    if (r.ok) { await refresh(); await reloadProfile(); flash("◆ PRO ∞ engaged — 30 days unlimited."); }
  };
  const addCredits = async (amount: number) => {
    const r = await fetch("/api/me/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) });
    if (r.ok) { await refresh(); await reloadProfile(); flash(`⚡ +${amount} CR smelted into vault.`); }
  };
  const onSaved = async () => { await refresh(); await reloadProfile(); };

  const baseShown = tab === "pro" ? PRO_FACTIONS : tab === "forge" ? FORGE_FACTIONS : FACTIONS;
  const shown = useMemo(() => {
    const q = deckQuery.trim().toLowerCase();
    if (!q) return baseShown;
    return baseShown.filter((f) => {
      const g = GUIDE_FACTIONS.find((x) => x.slug === f.slug);
      return `${f.name} ${f.myName} ${f.tagline} ${f.myTagline} ${g?.what ?? ""}`.toLowerCase().includes(q);
    });
  }, [baseShown, deckQuery]);
  const tA = profile?.themePrimary || "#00e5ff";
  const tB = profile?.themeSecondary || "#ff2e4c";
  const bg = profile?.background || "nebula";

  return (
    <div className="min-h-[100dvh] pb-24 md:pb-10">
      <ScrollProgress />
      <ForgeShell user={user} active="forge" onProfile={() => openDrawer("profile")} profile={{ avatar: profile?.avatar, displayName: profile?.displayName, themePrimary: tA, photoUrl: profile?.photoUrl }}
        onNav={(k) => {
          if (k === "pro" || k === "credits") document.getElementById(k)?.scrollIntoView({ behavior: "smooth" });
          if (k === "history") window.location.href = "/history";
          if (k === "forge") window.scrollTo({ top: 0, behavior: "smooth" });
        }} />

      <main className="mx-auto w-full max-w-5xl overflow-x-clip pt-3" style={{ paddingLeft: "calc(0.75rem + var(--safe-l))", paddingRight: "calc(0.75rem + var(--safe-r))" }}>
        {/* ============ EPIC HERO REACTOR (user-themed) ============ */}
        <section className="faction-lift relative overflow-hidden rounded-[22px] border border-white/10 sm:rounded-[28px]" style={{ background: bgCss(bg) }}>
          <AuroraBg a={tB} b={tA} />
          <EmberCanvas colorA={tA} colorB={tB} density={70} className="absolute inset-0 h-full w-full" />
          <div className="plasma-drift absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-30 blur-3xl" style={{ background: tB }} />
          <div className="plasma-drift-2 absolute -bottom-24 -right-24 h-80 w-80 rounded-full opacity-25 blur-3xl" style={{ background: tA }} />
          <div className="dotgrid absolute inset-0 opacity-15" />
          <div className="holo-lines absolute inset-0 opacity-50" />

          <div className="relative grid gap-2 p-4 sm:grid-cols-[1fr_230px] sm:p-7">
            <div className="min-w-0">
              <div className="mono flex flex-wrap items-center gap-1 text-[9px] font-bold tracking-[0.16em] sm:gap-1.5 sm:text-[9.5px] sm:tracking-[0.22em]">
                <span className="rounded-full border border-lime-300/50 bg-lime-300/10 px-2 py-1 text-lime-200">◆ PRO ∞ ×5</span>
                <span className="rounded-full bg-gradient-to-r from-amber-300 to-orange-500 px-2 py-1 text-black">⚡ FORGE ×5</span>
                <button onClick={() => openDrawer("profile")} className="mono max-w-[48%] truncate rounded-full border border-white/20 bg-black/50 px-2 py-1 text-white/70 active:scale-95">
                  {profile ? `${profile.avatar} ${profile.displayName.slice(0, 10)} ⚙` : "◉ PROFILE ⚙"}
                </button>
              </div>
              <h1 className="display mt-3 text-[clamp(2rem,11vw,4.2rem)] font-black leading-[0.95] tracking-tight">
                <span className="text-stroke block text-[0.4em] tracking-[0.28em] sm:tracking-[0.4em]">SCM // AETHER</span>
                <span className="shimmer-text break-anywhere" style={{ ["--ac" as string]: tA }}>CUTFLOW</span>
              </h1>
              <p className="display mt-1 text-[9.5px] tracking-[0.26em] text-white/50 sm:text-[11px] sm:tracking-[0.4em]">CYBER-FORGE WORKSTATION</p>
              <p className="my mt-3 max-w-md text-[13px] text-white/70 sm:text-[13.5px]">ဗီဒီယိုအနှစ်ချုပ်၊ ရီးလ်ဖြတ်၊ မြန်မာအသံ၊ စာတန်းထိုး — Pro များအတွက် အကန့်အသတ်မရှိ။ သတင်း၊ လင့်ခ်၊ ယူကျု့၊ စာရွက်များကို Credit ဖြင့် ဖန်တီးပါ။</p>
              <div className="mt-4 grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                <a href="#deck" className="btn-bevel rounded-xl px-3 py-2.5 text-center text-[12.5px] font-black text-black sm:px-5" style={{ ["--ac" as string]: tA, background: `linear-gradient(135deg, ${tA}, #fff, ${tB})` }}>⬢ IGNITE DECK</a>
                <a href="/guide" className="faction-lift rounded-xl border border-white/20 bg-black/50 px-3 py-2.5 text-center text-[12.5px] font-bold active:scale-95 sm:px-4">📖 GUIDE</a>
                <a href="/faction/recap" className="truncate rounded-xl border px-3 py-2.5 text-center text-[12.5px] font-bold active:scale-95 sm:px-4" style={{ borderColor: `${tA}66`, color: tA, background: `${tA}14` }}>◈ RECAP STUDIO</a>
                <a href="/history" className="mono truncate rounded-xl border border-white/12 bg-black/50 px-3 py-2.5 text-center text-[11.5px] text-white/60 sm:px-4">▤ {stats?.totals.jobs ?? rows.length} jobs</a>
              </div>
              <div className="relative mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/50">
                <div className="marquee-slow mono flex w-max gap-8 whitespace-nowrap px-3 py-1.5 text-[10px] tracking-[0.18em] text-white/55">
                  <span>◈ RECAP အနှစ်ချုပ် ◈ REEL ၉:၁၆ ◈ MM VOICE မြန်မာအသံ ◈ SUBS စာတန်း ◈ UPSCALE 4K ◈ NEWS သတင်း ◈ URL လင့်ခ် ◈ YT PRO ◈ DOC ဘာသာပြန် ◈ KNOWLEDGE &nbsp;</span>
                  <span>◈ RECAP အနှစ်ချုပ် ◈ REEL ၉:၁၆ ◈ MM VOICE မြန်မာအသံ ◈ SUBS စာတန်း ◈ UPSCALE 4K ◈ NEWS သတင်း ◈ URL လင့်ခ် ◈ YT PRO ◈ DOC ဘာသာပြန် ◈ KNOWLEDGE &nbsp;</span>
                </div>
              </div>
            </div>

            {/* mini reactor */}
            <div className="relative mx-auto grid w-full max-w-[210px] place-items-center" style={{ aspectRatio: "1 / 1" }}>
              <div className="tick-ring spin-med absolute inset-0 rounded-full opacity-60" />
              <div className="orbit-ring absolute inset-3">
                {FACTIONS.slice(0, 8).map((g, i) => {
                  const a = (i / 8) * Math.PI * 2;
                  return <span key={g.slug} className="absolute grid h-7 w-7 place-items-center rounded-full border bg-black text-[11px]" style={{ left: `${50 + 50 * Math.cos(a)}%`, top: `${50 + 50 * Math.sin(a)}%`, transform: "translate(-50%,-50%)", borderColor: g.primary, color: g.primary, boxShadow: `0 0 12px ${g.glow}` }}>{g.glyph}</span>;
                })}
              </div>
              <div className="spin-slow absolute inset-8 rounded-full border border-dashed border-white/25" />
              <button onClick={() => openDrawer("profile")} className="core-pulse grid h-[104px] w-[104px] place-items-center rounded-full border bg-black/80 text-center active:scale-95" style={{ borderColor: `${tA}99`, boxShadow: `0 0 50px ${tA}66, inset 0 0 26px rgba(0,0,0,0.9)` }}>
                <span><span className="block text-[26px]">{profile?.avatar ?? "⬢"}</span><span className="mono block text-[8px] tracking-[0.3em]" style={{ color: tA }}>PROFILE</span><span className="mono block text-[8px] text-white/45">OPEN ⚙</span></span>
              </button>
            </div>
          </div>

          {/* stat rail */}
          <div className="relative grid grid-cols-3 gap-1.5 px-3 pb-4 sm:gap-2 sm:px-6 sm:pb-5">
            {[
              { k: "JOBS", v: loading ? "…" : `${stats?.totals.jobs ?? rows.length}`, c: tA },
              { k: "PASSPORT", v: loading ? "…" : user?.isPro ? "PRO ∞" : "FREE", c: user?.isPro ? "#7CFC00" : "#fff" },
              { k: "VAULT", v: loading ? "…" : `${user?.credits ?? 0} CR`, c: "#fbbf24" },
            ].map((s) => (
              <button key={s.k} onClick={() => openDrawer(s.k === "VAULT" ? "credits" : "profile")} className="forge-glass min-w-0 rounded-xl px-2 py-2 text-left active:scale-95 sm:px-3 sm:py-2.5"><p className="mono truncate text-[8.5px] tracking-[0.2em] text-white/45 sm:text-[9px] sm:tracking-[0.28em]">{s.k}</p><p className="mono truncate text-[14px] font-bold sm:text-[16px]" style={{ color: s.c, textShadow: `0 0 16px ${s.c}` }}>{s.v}</p></button>
            ))}
          </div>
          <div className="relative h-[46px] overflow-hidden border-t border-white/10 opacity-80"><div className="floor-grid absolute inset-[-46px]" style={{ filter: `drop-shadow(0 0 12px ${tA})` }} /></div>
        </section>

        {/* ⚡ MAGIC REEL AI — flagship hero */}
        <MagicReelHero
          isPro={Boolean(user?.isPro)}
          onOpenPro={() => openDrawer("pro")}
          vault={user?.credits ?? 0}
          onOpenCredits={() => openDrawer("credits")}
        />

        {/* GUIDE BANNER */}
        <section className="faction-lift relative mt-4 overflow-hidden rounded-[24px] border border-white/12 bg-black/60">
          <AuroraBg a={tA} b={tB} />
          <div className="relative flex items-center gap-3 p-4">
            <span className="badge-pulse grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[24px] text-black" style={{ background: `linear-gradient(135deg, ${tA}, ${tB})` }}>📖</span>
            <div className="min-w-0 flex-1">
              <p className="mono text-[9.5px] tracking-[0.3em] text-white/50">ပထမဆုံးလား? · NEW HERE</p>
              <p className="my text-[13.5px] font-bold leading-[1.7]">Tool ၁၀ မျိုး + logo + အလုပ်လုပ်ပုံအသေးစိတ် — မြန်မာလို Guide</p>
            </div>
            <a href="/guide" className="btn-bevel shrink-0 rounded-xl px-4 py-2.5 text-[12.5px] font-black text-black" style={{ ["--ac" as string]: tA, background: `linear-gradient(135deg, ${tA}, #fff)` }}>ဖွင့်ဖတ် ›</a>
          </div>
        </section>

        <div className="mt-4"><PipelineMini accent={tA} /></div>

        {/* TAB + SEARCH */}
        <div id="deck" className="sticky top-[78px] z-30 mt-4 scroll-mt-24 bg-[#04050c]/90 py-2 backdrop-blur-xl md:top-[64px]">
          <div className="mx-auto max-w-5xl space-y-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">⌕</span>
              <input value={deckQuery} onChange={(e) => setDeckQuery(e.target.value)} placeholder="Deck ထဲရှာ — ရီးလ် / စာတန်း / သတင်း / 4K…" className="search-glow my w-full rounded-2xl border border-white/12 bg-black/70 py-2.5 pl-9 pr-8 text-[13px]" />
              {deckQuery && <button onClick={() => setDeckQuery("")} aria-label="Clear search" className="mono absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-white/15 px-2 py-0.5 text-[11px] text-white/60">✕</button>}
            </div>
            <div className="flex gap-2">
              {([["all", "⬢ ALL 10"], ["pro", "◆ PRO ∞"], ["forge", "⚡ FORGE"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={`mono flex-1 rounded-xl border py-2.5 text-[12px] font-bold active:scale-95 ${tab === k ? "text-cyan-100" : "border-white/10 bg-white/5 text-white/55"}`} style={tab === k ? { borderColor: `${tA}99`, background: `${tA}22`, boxShadow: `0 0 20px ${tA}44` } : undefined}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <section className="mt-3 space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
          {shown.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center sm:col-span-2">
              <p className="text-[26px]">⌕</p>
              <p className="my mt-1 text-[13.5px] font-bold">“{deckQuery}” နဲ့ကိုက်တဲ့ tool မတွေ့ပါ</p>
              <p className="my text-[12px] text-white/55">စာလုံးပြောင်းရှာပါ — သို့မဟုတ် <a href="/guide" className="underline" style={{ color: tA }}>Guide မှာ tool ၁၀ မျိုးလုံးကြည့်</a></p>
              <button onClick={() => { setDeckQuery(""); setTab("all"); }} className="mono mt-2 rounded-xl border border-white/15 px-4 py-2 text-[12px]">RESET ✕</button>
            </div>
          ) : shown.map((ff, i) => (
            <div key={ff.slug} className={`faction-lift ${i === 0 || i === 5 ? "sm:col-span-2" : ""}`}>
              <FactionCard f={ff} index={i} />
              <div className="mono mt-1 flex items-center gap-2 px-1 text-[10.5px] text-white/45">
                <span className="truncate">{GUIDE_FACTIONS.find((x) => x.slug === ff.slug)?.what.slice(0, 46)}…</span>
                <a href={`/guide#faction-${ff.slug}`} className="ml-auto shrink-0 font-bold" style={{ color: tA }}>နည်းလမ်း ›</a>
              </div>
            </div>
          ))}
        </section>

        {/* PRO SANCTUM */}
        <section id="pro" className="relative mt-6 scroll-mt-28 overflow-hidden rounded-[28px] border border-lime-300/25 bg-[#071007]">
          <EmberCanvas colorA="#7CFC00" colorB={tA} density={40} className="absolute inset-0 h-full w-full opacity-70" />
          <div className="plasma-drift absolute -left-20 top-0 h-64 w-64 rounded-full bg-lime-400/20 blur-3xl" />
          <div className="relative p-5 sm:p-7">
            <div className="flex items-center gap-2">
              <span className="core-pulse grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-lime-300 to-emerald-400 text-[22px] font-black text-black shadow-[0_0_30px_rgba(124,252,0,0.5)]">◆</span>
              <div><p className="mono text-[10px] tracking-[0.32em] text-lime-300">PRO UNLIMITED SANCTUM · SERVER-SEALED</p>
              <h2 className="display text-[22px] font-black leading-tight">FIVE RIGS · ZERO METER</h2></div>
            </div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
              {PRO_FACTIONS.map((pp) => <a key={pp.slug} href={`/faction/${pp.slug}`} className="flex shrink-0 items-center gap-1.5 rounded-full border bg-black/60 py-1.5 pl-1.5 pr-3" style={{ borderColor: `${pp.primary}66` }}><span className="grid h-7 w-7 place-items-center rounded-full text-[13px] text-black" style={{ background: pp.primary }}>{pp.glyph}</span><span className="mono text-[10.5px] font-bold">{pp.name}</span></a>)}
            </div>
            <p className="my mt-3 text-[13px] text-white/65">Pro သက်တမ်းရှိနေသမျှ Group A (၅) မျိုးကို အကန့်အသတ်မရှိ သုံးနိုင်သည်။ <button onClick={() => openDrawer("pro")} className="mono text-lime-200 underline">PRO payment card (ကတ်တစ်ခုတည်း · BYOK toggle)</button> မှ STANDARD {PRO_PLANS[0].price.toLocaleString()} / BYOK {PRO_PLANS[0].byokPrice.toLocaleString()} Ks — KBZPay / WavePay / Card ဖြင့် ဝယ်ပါ။ GPU TURBO (+{gpuCostFor("recap")}–{gpuCostFor("upscale")} CR) က vault က ဖြတ်မည်။</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {user?.isPro
                ? <button onClick={() => openDrawer("pro")} className="mono flow-border rounded-xl bg-lime-300/10 px-4 py-2.5 text-[13px] font-bold text-lime-100" style={{ ["--ac" as string]: "#7CFC00" }}>◆ ACTIVE{profile?.proByok ? " · BYOK" : ""} → {user.proExpiresAt ? new Date(user.proExpiresAt).toLocaleDateString() : "∞"} · MANAGE ›</button>
                : <><button onClick={activatePro} className="btn-bevel clip-shard-sm bg-gradient-to-r from-lime-300 via-emerald-200 to-cyan-200 px-6 py-3 text-[13px] font-black text-black" style={{ ["--ac" as string]: "#7CFC00" }}>◆ QUICK ACTIVATE — 30 DAYS</button>
                <button onClick={() => openDrawer("pro")} className="rounded-xl border border-lime-300/40 bg-black/50 px-4 py-3 text-[13px] font-bold text-lime-100 active:scale-95">⧉ PAYMENT CARD ›</button></>}
            </div>
          </div>
        </section>

        {/* CREDIT VAULT */}
        <section id="credits" className="forge-panel relative mt-3 scroll-mt-28 overflow-hidden rounded-[28px] p-5 sm:p-7">
          <div className="dotgrid absolute inset-0 opacity-10" />
          <div className="plasma-drift absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="relative">
            <p className="mono text-[10px] tracking-[0.32em] text-amber-300">⚡ CREDIT VAULT · SLIDER SHOP</p>
            <h2 className="display mt-1 text-[22px] font-black">SMELT CREDITS · FEED THE FORGE</h2>
            <div className="mt-3 grid grid-cols-5 gap-1 sm:gap-1.5">
              {FORGE_FACTIONS.map((g) => (
                <a key={g.slug} href={`/faction/${g.slug}`} className="rounded-xl border bg-black/50 p-2 text-center active:scale-95" style={{ borderColor: `${g.primary}55` }}>
                  <span className="block text-[18px]" style={{ color: g.primary }}>{g.glyph}</span>
                  <span className="mono block truncate text-[8px] font-bold text-white/70">{g.name}</span>
                  <span className="mono block text-[10px] font-bold text-amber-300">{g.cost}</span>
                </a>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="mono clip-tag bg-gradient-to-r from-amber-300 to-orange-500 px-4 py-2.5 text-[17px] font-black text-black">⚡ {user?.credits ?? "…"}</span>
              <div className="flex flex-1 gap-1.5">{[25, 60, 150].map((a) => <button key={a} onClick={() => addCredits(a)} className="flex-1 rounded-xl border border-amber-300/30 bg-amber-400/10 py-2.5 text-[12px] font-black text-amber-100 active:scale-95">+{a}</button>)}</div>
              <button onClick={() => openDrawer("credits")} className="mono shrink-0 rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2.5 text-[11px] font-bold text-amber-100 active:scale-95">SLIDER ›</button>
            </div>
            <p className="mono mt-2 text-[10px] text-white/40">slider ဆွဲပြီး စိတ်ကြိုက်ဝယ် → Profile → Credits · GPU 4–8 · NEWS 15 · URL 10 · YT 12 · DOC 8 · KNOW 5</p>
          </div>
        </section>

        {/* LEDGER */}
        <section className="mt-6">
          <div className="mb-2"><AutoCleanBanner policy={policy} accent={tA} /></div>
          <div className="mb-2 flex items-center"><h2 className="mono text-[11px] tracking-[0.32em] text-white/50">◈ TODAY · FORGE JOBS</h2><a href="/history" className="mono ml-auto text-[11px] font-bold" style={{ color: tA }}>VIEW LEDGER ›</a></div>
          {rows.length === 0
            ? <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center"><p className="display text-[30px] opacity-40">⬢</p><p className="mt-1 font-bold">Ledger empty — ignite a faction</p><p className="my text-[12.5px] text-white/50">မဖန်တီးရသေးပါ။ အထက်က deck မှ ရွေးပါ။</p></div>
            : <div className="relative space-y-2 pl-5"><span className="absolute bottom-2 left-[7px] top-2 w-px" style={{ background: `linear-gradient(180deg, ${tA}, ${tB}, transparent)` }} />
              {rows.map((t) => {
                const ff = FACTIONS.find((x) => x.slug === t.faction);
                return <a key={t.taskId} href={ff ? `/faction/${ff.slug}` : "/history"} className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 backdrop-blur active:scale-[0.99]">
                  <span className="absolute -left-5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border" style={{ borderColor: ff?.primary ?? tA, background: ff?.primary ?? tA, boxShadow: `0 0 10px ${ff?.primary ?? tA}` }} />
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[17px] text-black" style={{ background: ff ? `linear-gradient(135deg, ${ff.primary}, ${ff.secondary})` : "#333" }}>{ff?.glyph ?? "⬢"}</span>
                  <span className="min-w-0"><span className="block truncate text-[13px] font-bold">{ff?.name ?? t.faction} <span className="mono text-[9px] text-white/45">{t.status} {t.progress}%</span>{(t.input as { gpu?: boolean } | undefined)?.gpu ? <span className="mono ml-1 rounded-full border border-amber-300/50 px-1 text-[8px] text-amber-200">⚡</span> : null}</span>
                  <span className="mono block text-[10px] text-white/40">{new Date(t.createdAt).toLocaleTimeString()} · {t.cost} CR</span>
                  <span className="mt-1 block h-[5px] overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full" style={{ width: `${t.progress}%`, background: ff ? `linear-gradient(90deg, ${ff.primary}, ${ff.secondary})` : tA }} /></span></span>
                  <span className="ml-auto text-white/30">›</span></a>;
              })}</div>}
        </section>

        <div className="guide-divider mt-6" style={{ ["--ac" as string]: tA, ["--bc" as string]: tB }} />
        <footer className="mono mt-4 border-t border-white/10 pt-4 text-center text-[10px] leading-relaxed text-white/35">
          SCM CUTFLOW · AETHER-FORGE v3 · {profile?.displayName ?? "OPERATOR"} · PRO ∞ + CREDIT VAULT<br />BYOK + offline fallback · Next.js + Postgres · Pyidaungsu-safe<br />
          <span className="mt-1 inline-flex gap-3"><a href="/guide" className="underline">📖 User Guide</a><a href="/" className="underline">Deck</a><a href="/history" className="underline">Ledger</a></span>
        </footer>
      </main>

      <HelpAgent accent={tA} accent2={tB} />
      <ProfileDrawer open={drawer} onClose={() => setDrawer(false)} profile={profile} stats={stats} onSaved={onSaved} initialTab={drawerTab} />
      {toast && <div className="fixed bottom-20 left-1/2 z-[80] -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-black/90 px-4 py-2 text-[12.5px] font-bold text-white shadow-[0_0_30px_rgba(0,229,255,0.4)] md:bottom-8">{toast}</div>}
    </div>
  );
}
