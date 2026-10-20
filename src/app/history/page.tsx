"use client";

import { useEffect, useState } from "react";
import { FACTIONS } from "@/lib/factions";
import { AutoCleanBanner, AuroraBg, EmberCanvas, ForgeShell, ScrollProgress, useForgeUser, useHistory } from "@/components/forge-ui";
import { ProfileDrawer, applyTheme, useProfile, type DrawerTab } from "@/components/profile-drawer";
import { HelpAgent } from "@/components/help-agent";

export default function HistoryPage() {
  const { user } = useForgeUser();
  const { rows, policy, loading, reload } = useHistory(10);
  const { profile, stats, reload: reloadProfile } = useProfile();
  const [drawer, setDrawer] = useState(false);
  const [drawerTab] = useState<DrawerTab>("profile");
  useEffect(() => { applyTheme(profile); }, [profile]);

  return (
    <div className="min-h-[100dvh] pb-24 md:pb-10">
      <ScrollProgress />
      <HelpAgent accent={profile?.themePrimary || "#00e5ff"} />
      <ForgeShell user={user} active="history" onProfile={() => setDrawer(true)} profile={{ avatar: profile?.avatar, displayName: profile?.displayName, themePrimary: profile?.themePrimary, photoUrl: profile?.photoUrl }} />
      <main className="mx-auto max-w-3xl px-4 pt-4" style={{ paddingLeft: "calc(1rem + var(--safe-l))", paddingRight: "calc(1rem + var(--safe-r))" }}>
        <section className="faction-lift relative overflow-hidden rounded-[26px] border border-white/10 bg-[#04050c] p-5">
          <AuroraBg a={profile?.themePrimary || "#a855f7"} b={profile?.themeSecondary || "#00e5ff"} />
          <EmberCanvas colorA={profile?.themePrimary || "#a855f7"} colorB={profile?.themeSecondary || "#00e5ff"} density={44} className="absolute inset-0 h-full w-full" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-300 text-[22px] font-black text-black shadow-[0_0_28px_rgba(168,85,247,0.5)]">{profile?.avatar ?? "▤"}</span>
            <div><h1 className="display text-[22px] font-black">FORGE LEDGER</h1><p className="my text-[12.5px] text-white/60">{profile?.displayName ?? "ဖန်တီးမှုမှတ်တမ်း"} — every dispatch, sealed</p></div>
            <button onClick={reload} className="mono ml-auto rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-[12px] font-bold active:scale-95">⟳ RESYNC</button>
          </div>
          <p className="mono relative mt-2 text-[10px] text-white/40">GET /api/v1/tasks · server progress curve · celery parity</p>
          <a href="/guide" className="relative mt-2.5 flex items-center gap-2 overflow-hidden rounded-2xl border border-white/12 bg-black/60 px-3 py-2">
            <span>📖</span><span className="my text-[12px] text-white/70">Ledger ဖတ်မတတ်ရင် — Guide ရဲ့ Pipeline + FAQ ကြည့်</span><span className="mono ml-auto text-[11px] font-bold" style={{ color: profile?.themePrimary || "#00e5ff" }}>ဖွင့် ›</span>
          </a>
        </section>

        <div className="mt-3"><AutoCleanBanner policy={policy} accent={profile?.themePrimary || "#00e5ff"} /></div>

        {loading ? (
          <div className="mt-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-[76px] rounded-2xl" />)}</div>
        ) : rows.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-white/15 p-8 text-center">
            <p className="display text-[30px] opacity-40">⬢</p><p className="mt-1 font-bold">Ledger empty</p>
            <p className="my text-[13px] text-white/55">မဖန်တီးရသေးပါ — <a href="/guide#guide-start" className="underline">Guide Start Here</a> အတိုင်း RECAP SAMPLE နဲ့စပါ။</p>
            <div className="mt-3 flex justify-center gap-2">
              <a href="/" className="rounded-xl bg-cyan-300 px-5 py-2.5 text-[13px] font-black text-black">⬢ IGNITE A FACTION</a>
              <a href="/guide" className="rounded-xl border border-white/15 px-5 py-2.5 text-[13px] font-bold">📖 GUIDE</a>
            </div>
          </div>
        ) : (
          <div className="relative mt-4 space-y-2.5 pl-6">
            <span className="absolute bottom-3 left-[9px] top-3 w-[2px] rounded-full bg-gradient-to-b from-cyan-300 via-fuchsia-400 to-transparent shadow-[0_0_12px_rgba(0,229,255,0.6)]" />
            {rows.map((t) => {
              const f = FACTIONS.find((x) => x.slug === t.faction);
              const ac = f?.primary ?? "#00e5ff";
              return (
                <a key={t.taskId} href={f ? `/faction/${f.slug}` : "#"} className="faction-lift relative block overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e1d] active:scale-[0.99]" style={{ ["--ac" as string]: ac }}>
                  <span className="absolute -left-6 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-2" style={{ borderColor: ac, background: ac, boxShadow: `0 0 12px ${ac}` }} />
                  <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: ac, boxShadow: `0 0 14px ${ac}` }} />
                  <div className="flex items-center gap-3 p-3 pl-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[19px] text-black" style={{ background: f ? `linear-gradient(135deg, ${f.primary}, ${f.secondary})` : "#333", boxShadow: f ? `0 0 20px ${f.glow}` : "none" }}>{f?.glyph ?? "⬢"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold">{f?.name ?? t.faction} <span className={`mono ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${t.status === "completed" ? "bg-lime-300/15 text-lime-200" : "bg-cyan-300/10 text-cyan-200"}`}>{t.status.toUpperCase()} {t.progress}%</span>{(t.input as { gpu?: boolean })?.gpu ? <span className="mono ml-1 rounded-full border border-amber-300/50 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-200">⚡ GPU</span> : null}</p>
                      <p className="mono truncate text-[10px] text-white/45">{t.taskId.slice(0, 13)}… · {new Date(t.createdAt).toLocaleString()} · {t.cost} CR{(t.input as { gpu?: boolean })?.gpu ? " · TURBO" : ""}</p>
                      <div className="relative mt-1.5 h-[7px] overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full transition-all" style={{ width: `${t.progress}%`, background: f ? `linear-gradient(90deg, ${f.primary}, #fff, ${f.secondary})` : "#0ff" }} />
                      </div>
                    </div>
                    <span className="text-white/30">›</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>
      <ProfileDrawer open={drawer} onClose={() => setDrawer(false)} profile={profile} stats={stats} onSaved={reloadProfile} initialTab={drawerTab} />
    </div>
  );
}
