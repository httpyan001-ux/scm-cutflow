"use client";

import { useEffect, useMemo, useState } from "react";
import { FACTIONS, PRO_FACTIONS, FORGE_FACTIONS, type FactionDef } from "@/lib/factions";
import { GUIDE_CHECKLIST, GUIDE_FAQ, GUIDE_FACTIONS, GUIDE_PIPELINE, GUIDE_START } from "@/lib/guide";
import { gpuCostFor } from "@/lib/studio";
import { EmberCanvas, ForgeShell, useForgeUser } from "@/components/forge-ui";
import { ProfileDrawer, applyTheme, useProfile, type DrawerTab } from "@/components/profile-drawer";
import { HelpAgent } from "@/components/help-agent";

type Section = "start" | "pipeline" | "factions" | "billing" | "faq";

function FactionBadge({ f }: { f: FactionDef }) {
  return (
    <span className="relative grid h-[64px] w-[64px] shrink-0 place-items-center">
      <span className="absolute inset-0 rounded-2xl border border-dashed opacity-60" style={{ borderColor: f.primary }} />
      <span className="grid h-[48px] w-[48px] place-items-center rounded-xl border text-[24px]" style={{ borderColor: f.primary, color: f.primary, background: "rgba(0,0,0,0.65)", boxShadow: `0 0 26px ${f.glow}` }}>{f.glyph}</span>
    </span>
  );
}

export default function GuidePage() {
  const { user } = useForgeUser();
  const { profile, stats, reload: reloadProfile } = useProfile();
  const [drawer, setDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("pro");
  const [section, setSection] = useState<Section>("start");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"all" | "pro" | "forge">("all");
  const [done, setDone] = useState<string[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [openFaction, setOpenFaction] = useState<string | null>(null);

  const tA = profile?.themePrimary || "#00e5ff";
  const tB = profile?.themeSecondary || "#ff2e4c";

  useEffect(() => { applyTheme(profile); }, [profile]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cutflow-guide-checklist");
      if (raw) setDone(JSON.parse(raw));
    } catch {}
    // deep link: /guide#faction-recap or ?tool=recap
    const hash = window.location.hash.replace("#faction-", "");
    const params = new URLSearchParams(window.location.search);
    const tool = params.get("tool") || (window.location.hash.startsWith("#faction-") ? hash : "");
    if (tool) {
      setSection("factions");
      setOpenFaction(tool);
      setTimeout(() => document.getElementById(`faction-${tool}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    } else if (window.location.hash) {
      const id = window.location.hash.slice(1);
      if (["start", "pipeline", "factions", "billing", "faq"].includes(id)) setSection(id as Section);
    }
  }, []);

  const toggleCheck = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    try { localStorage.setItem("cutflow-guide-checklist", JSON.stringify(next)); } catch {}
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FACTIONS.filter((f) => {
      if (group !== "all" && f.group !== group) return false;
      if (!q) return true;
      const g = GUIDE_FACTIONS.find((x) => x.slug === f.slug);
      const hay = `${f.name} ${f.myName} ${f.tagline} ${f.myTagline} ${g?.what ?? ""} ${g?.when ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, group]);

  const progress = Math.round((done.length / GUIDE_CHECKLIST.length) * 100);

  const sections: { k: Section; l: string; i: string }[] = [
    { k: "start", l: "စတင်", i: "◉" },
    { k: "pipeline", l: "စနစ်", i: "⬢" },
    { k: "factions", l: "Tool ၁၀", i: "◈" },
    { k: "billing", l: "ငွေချေ", i: "⚡" },
    { k: "faq", l: "FAQ", i: "?" },
  ];

  return (
    <div className="min-h-[100dvh] pb-28 md:pb-10">
      <ForgeShell user={user} active="forge" onProfile={() => { setDrawerTab("profile"); setDrawer(true); }} profile={{ avatar: profile?.avatar, displayName: profile?.displayName, themePrimary: tA, photoUrl: profile?.photoUrl }} />
      <HelpAgent accent={tA} accent2={tB} />

      {/* HERO */}
      <div className="relative overflow-hidden border-b border-white/10" style={{ background: "linear-gradient(180deg,#0b1024,#04050c 85%)" }}>
        <EmberCanvas colorA={tA} colorB={tB} density={50} className="absolute inset-0 h-full w-full" />
        <div className="plasma-drift absolute -left-16 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl" style={{ background: tA }} />
        <div className="dotgrid absolute inset-0 opacity-15" />
        <div className="relative mx-auto max-w-3xl px-4 pb-5 pt-5" style={{ paddingLeft: "calc(1rem + var(--safe-l))", paddingRight: "calc(1rem + var(--safe-r))" }}>
          <a href="/" className="mono text-[11px] text-white/50">‹ FORGE / USER GUIDE</a>
          <div className="mt-2 flex items-start gap-3">
            <span className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-2xl border text-[30px]" style={{ borderColor: `${tA}88`, background: "rgba(0,0,0,0.6)", boxShadow: `0 0 30px ${tA}44` }}>📖</span>
            <div className="min-w-0">
              <p className="mono text-[9.5px] tracking-[0.32em]" style={{ color: tA }}>အသုံးပြုသူလမ်းညွှန် · BEGINNER → PRO</p>
              <h1 className="display text-[26px] font-black leading-tight">ဘယ်ကနေစရမလဲ?<br /><span className="shimmer-text" style={{ ["--ac" as string]: tA }}>၃ မိနစ်နဲ့တတ်မြောက်</span></h1>
            </div>
          </div>
          <p className="my mt-2 max-w-2xl text-[13px] leading-[1.8] text-white/70">
            Project တစ်ခုလုံးရဲ့ အလုပ်လုပ်စနစ် + Faction Tool ၁၀ မျိုးလုံးရဲ့ logo၊ နာမည်၊ အလုပ်လုပ်ပုံအသေးစိတ်ကို မြန်မာလိုရှင်းပြထားသည်။
            အောက်က search မှာ “ရီးလ်” “စာတန်း” “credit” လို့ရိုက်ရှာလို့ရ — checklist အတိုင်းလုပ်ရင် ပထမ export ၁၀ မိနစ်အတွင်းရမည်။
          </p>
          <div className="relative mt-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">⌕</span>
            <input value={query} onChange={(e) => { setQuery(e.target.value); if (e.target.value) setSection("factions"); }} placeholder="ရှာပါ — ဥပမာ ရီးလ် / စာတန်း / သတင်း / credit / GPU…" className="my w-full rounded-2xl border border-white/15 bg-black/70 py-3 pl-9 pr-3 text-[13.5px]" style={{ boxShadow: query ? `0 0 24px ${tA}33` : "none" }} />
          </div>
          <div className="mt-2.5 flex items-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-black/60 px-3 py-2">
            <span className="mono shrink-0 text-[10px] text-white/50">တိုးတက်မှု {done.length}/{GUIDE_CHECKLIST.length}</span>
            <span className="h-[8px] flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${tA}, ${tB})` }} /></span>
            <span className="mono shrink-0 text-[11px] font-bold" style={{ color: tA }}>{progress}%</span>
          </div>
        </div>
        <div className="relative h-[36px] overflow-hidden opacity-70"><div className="floor-grid absolute inset-[-40px]" style={{ filter: `drop-shadow(0 0 10px ${tA})` }} /></div>
      </div>

      {/* SECTION TABS */}
      <div className="sticky top-[86px] z-30 -mx-0 bg-[#04050c]/88 backdrop-blur-xl md:top-[64px]">
        <div className="mx-auto flex max-w-3xl gap-1.5 overflow-x-auto no-scrollbar px-4 py-2" style={{ paddingLeft: "calc(1rem + var(--safe-l))", paddingRight: "calc(1rem + var(--safe-r))" }}>
          {sections.map((s) => (
            <button key={s.k} onClick={() => { setSection(s.k); document.getElementById(`guide-${s.k}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className={`mono shrink-0 rounded-xl border px-3.5 py-2.5 text-[12px] font-bold active:scale-95 ${section === s.k ? "text-black" : "border-white/12 bg-white/5 text-white/60"}`} style={section === s.k ? { background: `linear-gradient(135deg, ${tA}, ${tB})`, borderColor: "transparent", boxShadow: `0 0 18px ${tA}44` } : undefined}>
              {s.i} {s.l}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-4" style={{ paddingLeft: "calc(1rem + var(--safe-l))", paddingRight: "calc(1rem + var(--safe-r))" }}>

        {/* START */}
        <section id="guide-start" className="scroll-mt-32">
          <p className="mono mb-2 text-[10.5px] tracking-[0.3em] text-white/45">◉ START HERE · ၅ ဆင့် ၁၀ မိနစ်</p>
          <div className="relative space-y-2 pl-6">
            <span className="absolute bottom-3 left-[9px] top-3 w-[2px] rounded-full" style={{ background: `linear-gradient(180deg, ${tA}, ${tB}, transparent)` }} />
            {GUIDE_START.map((s) => (
              <div key={s.n} className="forge-glass relative rounded-2xl p-3.5">
                <span className="absolute -left-6 top-4 grid h-5 w-5 place-items-center rounded-full border bg-black font-mono text-[9px] font-bold" style={{ borderColor: tA, color: tA }}>{s.n}</span>
                <p className="text-[14px] font-black">{s.title} <span className="my text-[12px] font-medium text-white/55">· {s.my}</span></p>
                <p className="my mt-1 text-[12.5px] leading-[1.8] text-white/70">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-3xl border border-white/10 bg-black/50 p-3.5">
            <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">✓ ပထမ ၁၀ မိနစ် CHECKLIST (auto-save)</p>
            <div className="space-y-1.5">
              {GUIDE_CHECKLIST.map((c) => {
                const on = done.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggleCheck(c.id)} className={`flex w-full items-center gap-2.5 rounded-2xl border p-2.5 text-left active:scale-[0.99] ${on ? "border-lime-300/50 bg-lime-300/[0.07]" : "border-white/10 bg-white/[0.03]"}`}>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl text-[14px] font-black ${on ? "bg-lime-300 text-black" : "border border-white/20 text-white/40"}`}>{on ? "✓" : "○"}</span>
                    <span><span className={`block text-[13px] font-bold ${on ? "text-white/90 line-through opacity-70" : ""}`}>{c.label}</span><span className="my block text-[11px] text-white/50">{c.my}</span></span>
                  </button>
                );
              })}
            </div>
            {progress === 100 && <p className="my mt-2 rounded-xl border border-lime-300/40 bg-lime-300/10 p-2.5 text-center text-[12.5px] font-bold text-lime-100">🎉 ပြီးပြီ! — သင် Cutflow operator အစစ်ဖြစ်ပြီ။ History/Ledger မှာစစ်ကြည့်ပါ။</p>}
          </div>
        </section>

        {/* PIPELINE */}
        <section id="guide-pipeline" className="scroll-mt-32">
          <p className="mono mb-2 text-[10.5px] tracking-[0.3em] text-white/45">⬢ PROJECT အလုပ်လုပ်စနစ် · PIPELINE ၅ ဆင့်</p>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/50">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-2">
              {GUIDE_PIPELINE.map((s, i) => (
                <div key={s.n} className="flex min-w-[128px] flex-1 items-stretch gap-1">
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 text-center">
                    <p className="mono text-[9px] font-bold tracking-[0.2em]" style={{ color: tA }}>{s.n}</p>
                    <p className="mt-0.5 text-[12px] font-black">{s.title}</p>
                    <p className="my text-[10.5px] text-white/55">{s.my}</p>
                  </div>
                  {i < GUIDE_PIPELINE.length - 1 && <span className="self-center text-white/30">›</span>}
                </div>
              ))}
            </div>
            <div className="space-y-1.5 border-t border-white/10 p-3">
              {GUIDE_PIPELINE.map((s) => (
                <p key={s.n} className="my rounded-xl bg-white/[0.03] px-2.5 py-2 text-[12px] leading-[1.8] text-white/70"><b className="mono text-[11px]" style={{ color: tA }}>{s.n}</b> — {s.body}</p>
              ))}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {[["◆ PRO ∞", "Tool ၅ မျိုး အခမဲ့", "#7CFC00"], ["⚡ CREDIT", "5–15 CR/run", "#fbbf24"], ["⚡ GPU", "2.4× မြန် +CR", "#fb923c"]].map(([a, b, c]) => (
              <div key={a} className="rounded-2xl border border-white/10 bg-black/50 p-2.5 text-center"><p className="mono text-[12px] font-black" style={{ color: c as string }}>{a}</p><p className="my text-[10.5px] text-white/55">{b}</p></div>
            ))}
          </div>
        </section>

        {/* FACTIONS */}
        <section id="guide-factions" className="scroll-mt-32">
          <div className="mb-2 flex items-center gap-2">
            <p className="mono text-[10.5px] tracking-[0.3em] text-white/45">◈ FACTION TOOL ၁၀ မျိုး · LOGO + အလုပ်လုပ်ပုံ</p>
            <span className="mono ml-auto rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/55">{filtered.length}/10</span>
          </div>
          <div className="mb-2 flex gap-1.5">
            {([["all", "အားလုံး"], ["pro", "◆ PRO ∞"], ["forge", "⚡ CREDIT"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setGroup(k)} className={`mono flex-1 rounded-xl border py-2 text-[11.5px] font-bold active:scale-95 ${group === k ? "text-black" : "border-white/12 bg-white/5 text-white/60"}`} style={group === k ? { background: `linear-gradient(135deg, ${tA}, ${tB})`, borderColor: "transparent" } : undefined}>{l}</button>
            ))}
          </div>
          {filtered.length === 0 && <p className="my rounded-2xl border border-dashed border-white/15 p-5 text-center text-[13px] text-white/50">“{query}” နဲ့ကိုက်တာ မတွေ့ပါ — စာလုံးပြောင်းရှာကြည့်ပါ။</p>}
          <div className="space-y-2.5">
            {filtered.map((f) => {
              const g = GUIDE_FACTIONS.find((x) => x.slug === f.slug)!;
              const open = openFaction === f.slug;
              const gpu = gpuCostFor(f.slug);
              return (
                <article key={f.slug} id={`faction-${f.slug}`} className="scroll-mt-36 overflow-hidden rounded-3xl border bg-[#070a15]/90" style={{ borderColor: `${f.primary}44` }}>
                  <button onClick={() => setOpenFaction(open ? null : f.slug)} className="flex w-full items-center gap-3 p-3.5 text-left active:bg-white/[0.02]">
                    <FactionBadge f={f} />
                    <span className="min-w-0 flex-1">
                      <span className="mono flex items-center gap-1.5 text-[9.5px] tracking-[0.24em]" style={{ color: f.primary }}>{f.code} · {f.group === "pro" ? "◆ PRO ∞" : `⚡ ${f.cost} CR`} · GPU +{gpu}</span>
                      <span className="display block truncate text-[17px] font-black">{f.glyph} {f.name}</span>
                      <span className="my block truncate text-[12px] text-white/60">{f.myName} — {f.myTagline}</span>
                    </span>
                    <span className="mono shrink-0 text-[16px] text-white/40 transition-transform" style={{ transform: open ? "rotate(90deg)" : "none" }}>›</span>
                  </button>
                  {open && (
                    <div className="rise space-y-2 border-t border-white/10 p-3.5" style={{ background: `linear-gradient(180deg, ${f.tertiary}, transparent 140%)` }}>
                      <p className="my rounded-2xl bg-black/50 px-3 py-2.5 text-[12.5px] leading-[1.8] text-white/80"><b>ဘာလုပ်တာလဲ — </b>{g.what}</p>
                      <p className="my rounded-2xl bg-black/50 px-3 py-2.5 text-[12.5px] leading-[1.8] text-white/80"><b>ဘယ်သူသုံးသင့်လဲ — </b>{g.when}</p>
                      <div className="rounded-2xl bg-black/50 px-3 py-2.5">
                        <p className="mono mb-1.5 text-[10px] tracking-[0.24em]" style={{ color: f.primary }}>လိုအပ်ချက် · INPUT</p>
                        <ul className="space-y-1">{g.inputs.map((s, i) => <li key={i} className="my flex gap-2 text-[12.5px] leading-[1.75] text-white/75"><span style={{ color: f.primary }}>▸</span><span>{s}</span></li>)}</ul>
                      </div>
                      <div className="rounded-2xl bg-black/50 px-3 py-2.5">
                        <p className="mono mb-1.5 text-[10px] tracking-[0.24em]" style={{ color: f.primary }}>အဆင့်ဆင့် · ၁→၅</p>
                        <ol className="space-y-1.5">{g.steps.map((s, i) => <li key={i} className="my flex gap-2 text-[12.5px] leading-[1.75] text-white/80"><span className="mono grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-black text-black" style={{ background: f.primary }}>{i + 1}</span><span>{s}</span></li>)}</ol>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                        <p className="mono mb-1.5 text-[10px] tracking-[0.24em] text-amber-200">★ ပညာရှင်အကြံ · TIPS</p>
                        <ul className="space-y-1">{g.tips.map((s, i) => <li key={i} className="my text-[12px] leading-[1.75] text-white/70">★ {s}</li>)}</ul>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="mono rounded-xl bg-black/50 px-2.5 py-2 text-[10.5px]"><p className="text-white/45">OUTPUT</p><p className="mt-0.5 font-bold text-white/85">{g.output}</p></div>
                        <div className="mono rounded-xl bg-black/50 px-2.5 py-2 text-[10.5px]"><p className="text-white/45">COST</p><p className="mt-0.5 font-bold" style={{ color: f.primary }}>{g.costNote}</p></div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <a href={`/faction/${f.slug}`} className="btn-bevel rounded-2xl py-3 text-center text-[13px] font-black text-black" style={{ ["--ac" as string]: f.primary, background: `linear-gradient(135deg, ${f.primary}, ${f.secondary})` }}>◈ {f.name} ဖွင့် ›</a>
                        <button onClick={() => { navigator.clipboard?.writeText(`${location.origin}/guide#faction-${f.slug}`).catch(() => {}); }} className="mono rounded-2xl border border-white/15 bg-white/5 py-3 text-[12px] font-bold active:scale-95">⧉ လင့်ခ်ကူး</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-lime-300/25 bg-lime-300/[0.05] p-3">
              <p className="mono text-[10px] tracking-[0.26em] text-lime-300">◆ PRO ZONE ×5 — ∞</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">{PRO_FACTIONS.map((f) => <a key={f.slug} href={`/faction/${f.slug}`} className="mono rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ borderColor: `${f.primary}66`, color: f.primary }}>{f.glyph} {f.name}</a>)}</div>
            </div>
            <div className="rounded-2xl border border-amber-300/25 bg-amber-400/[0.05] p-3">
              <p className="mono text-[10px] tracking-[0.26em] text-amber-300">⚡ CREDIT FORGE ×5 — 5–15 CR</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">{FORGE_FACTIONS.map((f) => <a key={f.slug} href={`/faction/${f.slug}`} className="mono rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ borderColor: `${f.primary}66`, color: f.primary }}>{f.glyph} {f.name} {f.cost}</a>)}</div>
            </div>
          </div>
        </section>

        {/* BILLING */}
        <section id="guide-billing" className="scroll-mt-32">
          <p className="mono mb-2 text-[10.5px] tracking-[0.3em] text-white/45">⚡ ငွေချေစနစ် · PRO / CREDIT / GPU / BYOK</p>
          <div className="space-y-2">
            <div className="rounded-3xl border border-lime-300/25 bg-gradient-to-br from-[#0c1a0c] to-black p-4">
              <p className="display text-[16px] font-black">◆ PRO — လစဉ်ကြေး · Tool ၅ မျိုး ∞</p>
              <p className="my mt-1 text-[12.5px] leading-[1.8] text-white/65">RECAP · REEL · MM VOICE · SUBS · UPSCALE ကို သက်တမ်းရှိနေသမျှ အကန့်အသတ်မရှိသုံး။ Server က <span className="mono text-lime-200">is_pro + expiry</span> စစ်သည် — badge အတုမရ။ STANDARD (15,000/39,000/129,000 Ks, key မလို) သို့မဟုတ် BYOK toggle ON (9,000/24,000/79,000 Ks, ကိုယ့် API key) — ကတ်တစ်ခုတည်း။ Profile → PRO tab → plan ရွေး → KBZPay/WavePay/CBPay/Card → PAY.</p>
              <button onClick={() => { setDrawerTab("pro"); setDrawer(true); }} className="btn-bevel mt-2 w-full rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 py-3 text-[13px] font-black text-black" style={{ ["--ac" as string]: "#7CFC00" }}>⧉ PRO PAYMENT ဖွင့်</button>
            </div>
            <div className="rounded-3xl border border-amber-300/25 bg-gradient-to-br from-[#211303] to-black p-4">
              <p className="display text-[16px] font-black">⚡ CREDIT — တစ်ခါသုံး · 10 CR = 1,000 Ks</p>
              <p className="my mt-1 text-[12.5px] leading-[1.8] text-white/65">NEWS 15 · URL 10 · YT 12 · DOC 8 · KNOW 5 — atomic DB deduct (never negative)။ Profile → Credits tab မှာ slider 10–500 ဆွဲ + quick +50/100/200/500 → method ရွေး → BUY. GPU TURBO (+4–8) လဲ ဒီ vault က ဖြတ်သည်။</p>
              <button onClick={() => { setDrawerTab("credits"); setDrawer(true); }} className="btn-bevel mt-2 w-full rounded-2xl bg-gradient-to-r from-amber-300 to-orange-500 py-3 text-[13px] font-black text-black" style={{ ["--ac" as string]: "#fbbf24" }}>⧉ CREDIT SLIDER ဖွင့်</button>
            </div>
            <div className="rounded-3xl border border-orange-400/25 bg-gradient-to-br from-[#261003] to-black p-4">
              <p className="display text-[16px] font-black">⚡ GPU TURBO — ၂.၄× မြန် · +CR</p>
              <p className="my mt-1 text-[12.5px] leading-[1.8] text-white/65">Tool တိုင်းမှာ ခလုတ် ၂ ခု — ⬢ IGNITE (ပုံမှန်) / ⚡ GPU TURBO (recap 6 · reel 6 · voice 6 · subs 5 · upscale 8 · news 8 · url 6 · yt 7 · doc 5 · know 4)။ PRO လဲ GPU ဖိုးပေးရ။ CR မရှိရင် ခလုတ် BUY CR ဖြစ်ပြီး slider ပွင့်မည်။ Result/Ledger မှာ ⚡ GPU badge ပါ။</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/50 p-4">
              <p className="display text-[16px] font-black">⧉ API KEY — မရှိလဲရ · ရှိရင်ပိုကောင်း</p>
              <p className="my mt-1 text-[12.5px] leading-[1.8] text-white/65">Key မရှိရင် Offline forge auto (mic speak-to-text + local အနှစ်ချုပ်)။ Profile → API မှာ sk-… ဖြည့် (သို့မဟုတ် .env OPENAI_API_KEY) တာနဲ့ cloud auto-upgrade။ Key မှား/error တက်လဲ fallback ပြန်ကျ — ဘယ်တော့မှမပျက်။ BYOK PRO ဝယ်ရင် key ကို purchase နဲ့တစ်ခါတည်းသိမ်း။</p>
              <button onClick={() => { setDrawerTab("keys"); setDrawer(true); }} className="mono mt-2 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[13px] font-bold active:scale-95">⧉ API SETTINGS ဖွင့်</button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="guide-faq" className="scroll-mt-32">
          <p className="mono mb-2 text-[10.5px] tracking-[0.3em] text-white/45">? မေးလေ့ရှိတာ · FAQ + ဖြေရှင်းနည်း</p>
          <div className="space-y-1.5">
            {GUIDE_FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className={`overflow-hidden rounded-2xl border ${open ? "border-white/25 bg-white/[0.04]" : "border-white/10 bg-black/40"}`}>
                  <button onClick={() => setOpenFaq(open ? null : i)} className="flex w-full items-center gap-2.5 p-3.5 text-left">
                    <span className="mono grid h-7 w-7 shrink-0 place-items-center rounded-xl text-[12px] font-black text-black" style={{ background: open ? `linear-gradient(135deg, ${tA}, ${tB})` : "rgba(255,255,255,0.12)", color: open ? "#000" : "#fff" }}>{open ? "−" : "+"}</span>
                    <span className="my text-[13px] font-bold leading-[1.7]">{item.q}</span>
                  </button>
                  {open && <p className="my border-t border-white/10 px-3.5 py-3 text-[12.5px] leading-[1.85] text-white/70">{item.a}</p>}
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href="/faction/recap" className="btn-bevel rounded-2xl py-3.5 text-center text-[13px] font-black text-black" style={{ ["--ac" as string]: tA, background: `linear-gradient(135deg, ${tA}, ${tB})` }}>◈ RECAP စမ်းလုပ် ›</a>
            <a href="/" className="rounded-2xl border border-white/15 bg-white/5 py-3.5 text-center text-[13px] font-bold active:scale-95">⬢ DECK ပြန် ›</a>
          </div>
        </section>

        <footer className="mono border-t border-white/10 pt-4 text-center text-[10px] leading-relaxed text-white/35">
          SCM CUTFLOW · USER GUIDE v1 · မြန်မာလိုအပြည့်အစုံ · {stats?.totals.jobs ?? 0} jobs forged<br />
          <a href="/" className="underline">Deck</a> · <a href="/history" className="underline">Ledger</a> · <a href="/guide" className="underline">Guide</a>
        </footer>
      </main>

      <ProfileDrawer open={drawer} onClose={() => setDrawer(false)} profile={profile} stats={stats} onSaved={reloadProfile} initialTab={drawerTab} />
    </div>
  );
}
