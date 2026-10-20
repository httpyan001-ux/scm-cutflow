"use client";

import { useEffect, useState } from "react";
import { AVATARS, BG_PRESETS, PAY_METHODS, PRO_PLANS, THEME_PRESETS, bgCss, creditsToMmk, type ProMode } from "@/lib/studio";

export interface ProfileUser {
  id: string; email: string; displayName: string;
  username?: string | null;
  avatar: string; background: string;
  photoUrl?: string; backgroundUrl?: string;
  themePrimary: string; themeSecondary: string;
  hasAiKey: boolean; aiProvider: string;
  isPro: boolean; proExpiresAt: string | null; credits: number;
  proPlan: string; proByok: boolean;
  serverHasKey?: boolean;
}

export type DrawerTab = "profile" | "stats" | "pro" | "credits" | "theme" | "keys";

export function useProfile() {
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<{ totals: { jobs: number; spent: number }; byFaction: { faction: string; n: number; spent: number }[]; favorite: string | null; recent: { id: string; faction: string; status: string; progress: number; cost: number; createdAt: string }[] } | null>(null);
  const load = async () => {
    try {
      const r = await fetch("/api/me/profile", { cache: "no-store" });
      const j = await r.json();
      if (j.user) setProfile(j.user);
    } catch {}
    try {
      const r2 = await fetch("/api/me/stats", { cache: "no-store" });
      const j2 = await r2.json();
      setStats(j2);
    } catch {}
  };
  useEffect(() => { load(); }, []);
  return { profile, stats, reload: load, setProfile };
}

export function applyTheme(p: ProfileUser | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!p) return;
  root.style.setProperty("--user-ac", p.themePrimary);
  root.style.setProperty("--user-bc", p.themeSecondary);
  try { localStorage.setItem("cutflow-theme", JSON.stringify({ a: p.themePrimary, b: p.themeSecondary, bg: p.background, avatar: p.avatar, name: p.displayName })); } catch {}
}

export function ProfileDrawer({ open, onClose, profile, stats, onSaved, initialTab }: {
  open: boolean; onClose: () => void;
  profile: ProfileUser | null; stats: ReturnType<typeof useProfile>["stats"];
  onSaved: () => void; initialTab?: DrawerTab;
}) {
  const [tab, setTab] = useState<DrawerTab>("profile");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("⬢");
  const [bg, setBg] = useState("nebula");
  const [tA, setTA] = useState("#00e5ff");
  const [tB, setTB] = useState("#ff2e4c");
  const [photo, setPhoto] = useState("");
  const [bgPhoto, setBgPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // credit shop
  const [cr, setCr] = useState(100);
  const [crMethod, setCrMethod] = useState("KBPay");
  const [paying, setPaying] = useState(false);
  // pro shop — SINGLE card, dual price via BYOK toggle
  const [plan, setPlan] = useState("30-day");
  const [byok, setByok] = useState(false);
  const [byokKey, setByokKey] = useState("");
  const [showByokKey, setShowByokKey] = useState(false);
  const [proMethod, setProMethod] = useState("KBPay");
  const [card, setCard] = useState({ num: "", exp: "", cvc: "", phone: "" });
  const [proPaying, setProPaying] = useState(false);
  // keys
  const [key, setKey] = useState("");
  const [provider, setProvider] = useState("auto");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (profile && open) {
      setName(profile.displayName); setAvatar(profile.avatar); setBg(profile.background);
      setTA(profile.themePrimary); setTB(profile.themeSecondary); setProvider(profile.aiProvider || "auto");
      setPhoto(profile.photoUrl || ""); setBgPhoto(profile.backgroundUrl || "");
      setByok(Boolean(profile.proByok));
      if (profile.proPlan) setPlan(profile.proPlan);
    }
  }, [profile, open]);
  useEffect(() => {
    if (open && initialTab) setTab(initialTab);
  }, [open, initialTab]);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [open, onClose]);

  if (!open) return null;
  const p = profile;
  const mmk = creditsToMmk(cr);
  const planObj = PRO_PLANS.find((x) => x.id === plan) ?? PRO_PLANS[0];
  const mode: ProMode = byok ? "byok" : "standard";
  const dueToday = byok ? planObj.byokPrice : planObj.price;

  const pickImage = (kind: "photo" | "bg") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files?.[0];
    if (!fl) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(fl.type)) { setMsg("✕ PNG / JPG / WEBP ပုံသာ ရပါသည်"); return; }
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const max = kind === "photo" ? 320 : 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
        const ctx = cv.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        const out = cv.toDataURL("image/jpeg", 0.82);
        if (out.length > 1_800_000) { setMsg("✕ ပုံကြီးလွန်းသည် — သေးသောပုံ ရွေးပါ"); return; }
        if (kind === "photo") setPhoto(out); else setBgPhoto(out);
        setMsg(kind === "photo" ? "✓ ပရိုဖိုင်ပုံ ရွေးပြီး — SAVE နှိပ်ပါ" : "✓ နောက်ခံပုံ ရွေးပြီး — SAVE နှိပ်ပါ");
        setTimeout(() => setMsg(null), 2200);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(fl);
  };

  const logout = async () => {
    await fetch("/api/auth/login", { method: "DELETE" }).catch(() => {});
    window.location.href = "/login";
  };

  const saveProfile = async () => {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch("/api/me/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: name, avatar, background: bg, themePrimary: tA, themeSecondary: tB, photoUrl: photo, backgroundUrl: bgPhoto }) });
      const j = await r.json();
      if (r.ok && j.user) { setMsg("✓ Profile + Theme သိမ်းပြီးပြီ"); onSaved(); setTimeout(() => setMsg(null), 2200); }
      else setMsg("✕ သိမ်းမရပါ — နာမည် 1–40 လုံး");
    } catch { setMsg("✕ ကွန်ရက်မှား"); }
    setSaving(false);
  };

  const saveKey = async () => {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch("/api/me/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aiApiKey: key, aiProvider: provider }) });
      if (r.ok) { setMsg(key ? "✓ API Key ချိတ်ပြီးပြီ — cloud engine" : "✓ Key ဖျက်ပြီးပြီ — offline forge"); setKey(""); onSaved(); setTimeout(() => setMsg(null), 2400); }
      else setMsg("✕ Key သိမ်းမရပါ");
    } catch { setMsg("✕ ကွန်ရက်မှား"); }
    setSaving(false);
  };

  const buyCredits = async () => {
    setPaying(true);
    try {
      const r = await fetch("/api/me/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: cr, method: crMethod, priceMmk: mmk }) });
      if (r.ok) { setMsg(`⚡ +${cr} CR ဝင်ပြီ · ${mmk.toLocaleString()} Ks (${crMethod})`); onSaved(); setTimeout(() => setMsg(null), 2600); }
      else setMsg("✕ ဝယ်မရပါ");
    } catch { setMsg("✕ ကွန်ရက်မှား"); }
    setPaying(false);
  };

  const buyPro = async () => {
    if (byok && !p?.hasAiKey && byokKey.trim().length < 8) { setMsg("✕ BYOK စျေးသုံးရန် API Key (sk-…) အရင်ထည့်ပါ — အောက်က box မှာ"); return; }
    if (proMethod === "Card" && (card.num.replace(/\D/g, "").length < 12 || !card.exp || !card.cvc)) { setMsg("✕ ကတ်အချက်အလက် မပြည့်စုံပါ"); return; }
    if ((proMethod === "KBPay" || proMethod === "WavePay" || proMethod === "CBPay") && card.phone.replace(/\D/g, "").length < 7) { setMsg("✕ ဖုန်းနံပါတ် ထည့်ပါ (ငွေလွှဲအတည်ပြု)"); return; }
    setProPaying(true);
    await new Promise((r) => setTimeout(r, 1100));
    try {
      const r = await fetch("/api/me/pro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planObj.id, method: proMethod, mode, aiApiKey: byok && byokKey.trim() ? byokKey.trim() : undefined }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setMsg(`◆ ${planObj.name} (${byok ? "BYOK" : "STANDARD"}) ပွင့်ပြီ — ${proMethod} · ${dueToday.toLocaleString()} Ks`);
        setByokKey("");
        onSaved(); setTimeout(() => setMsg(null), 2800);
      } else if (j.error === "BYOK_KEY_REQUIRED") setMsg("✕ BYOK အတွက် API Key လိုသည် — key ထည့်ပြီးမှ ထပ်နှိပ်ပါ");
      else setMsg("✕ PRO ဖွင့်မရပါ");
    } catch { setMsg("✕ ကွန်ရက်မှား"); }
    setProPaying(false);
  };

  const tabs: { k: DrawerTab; l: string; i: string }[] = [
    { k: "profile", l: "Profile", i: "◉" },
    { k: "stats", l: "Stats", i: "▤" },
    { k: "pro", l: "PRO", i: "◆" },
    { k: "credits", l: "Credits", i: "⚡" },
    { k: "theme", l: "Theme", i: "◈" },
    { k: "keys", l: "API", i: "⧉" },
  ];

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <aside className="profile-slide absolute bottom-0 right-0 top-0 flex w-full max-w-[430px] flex-col overflow-hidden border-l border-white/12 bg-[#070a15]" style={{ ["--ac" as string]: tA, ["--bc" as string]: tB }}>
        <div className="relative shrink-0 overflow-hidden px-4 pb-3 pt-4" style={{ background: bgPhoto ? `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.75)), center/cover no-repeat url(${bgPhoto})` : bgCss(bg) }}>
          <div className="dotgrid absolute inset-0 opacity-20" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 bg-black/70 text-[26px]" style={{ borderColor: tA, boxShadow: `0 0 26px ${tA}66` }}>
              {photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt="profile" className="h-full w-full object-cover" /> : avatar}
            </span>
            <div className="min-w-0 flex-1">
              <p className="mono text-[9px] tracking-[0.32em] text-white/55">OPERATOR PASSPORT</p>
              <h2 className="my truncate text-[17px] font-bold leading-[1.5]">{name || p?.displayName || "…"}</h2>
              <p className="mono truncate text-[10px] text-white/50">{p?.email} · {p?.isPro ? `◆ PRO ∞${p?.proByok ? " · BYOK" : ""}` : "○ FREE"} · ⚡ {p?.credits ?? "…"} CR</p>
            </div>
            <button onClick={onClose} className="mono rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-[13px] active:scale-95">✕</button>
          </div>
          <div className="relative mt-3 flex gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)} className={`mono shrink-0 rounded-xl border px-3 py-2 text-[11px] font-bold active:scale-95 ${tab === t.k ? "text-black" : "border-white/15 bg-black/50 text-white/60"}`} style={tab === t.k ? { background: `linear-gradient(135deg, ${tA}, ${tB})`, borderColor: "transparent" } : undefined}>
                {t.i} {t.l}
              </button>
            ))}
          </div>
        </div>

        <div className="thin-scroll flex-1 overflow-y-auto p-4" style={{ paddingBottom: "calc(1rem + var(--safe-b))" }}>
          {msg && <div className="rise mb-3 rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-[12.5px] font-bold">{msg}</div>}

          {tab === "profile" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">DISPLAY NAME</p>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Forge Operator" className="my w-full rounded-xl border border-white/15 bg-black/70 px-3 py-2.5 text-[14px]" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">PROFILE PHOTO · ပရိုဖိုင်ပုံ</p>
                <div className="flex items-center gap-3">
                  <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 bg-black/70 text-[26px]" style={{ borderColor: tA, boxShadow: `0 0 20px ${tA}44` }}>
                    {photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt="profile" className="h-full w-full object-cover" /> : avatar}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <label className="mono block cursor-pointer rounded-xl py-2.5 text-center text-[12px] font-black text-black active:scale-95" style={{ background: `linear-gradient(135deg, ${tA}, ${tB})` }}>
                      ⬆ ပုံတင်မည်
                      <input type="file" accept="image/*" className="hidden" onChange={pickImage("photo")} />
                    </label>
                    {photo && <button onClick={() => setPhoto("")} className="mono w-full rounded-xl border border-red-400/40 py-2 text-[11px] text-red-200 active:scale-95">✕ ပုံဖယ်မည်</button>}
                    <p className="my text-[10px] text-white/40">PNG / JPG / WEBP · auto-resize</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">CUSTOM BACKGROUND · ကိုယ်ပိုင်နောက်ခံ</p>
                <div className="overflow-hidden rounded-xl border border-white/12" style={{ background: bgPhoto ? `center/cover no-repeat url(${bgPhoto})` : bgCss(bg) }}>
                  <div className="flex h-[70px] items-end justify-between p-2">
                    <span className="mono rounded-md bg-black/70 px-1.5 py-0.5 text-[9.5px]">{bgPhoto ? "ကိုယ်ပိုင်ပုံ" : "preset"}</span>
                    {bgPhoto && <button onClick={() => setBgPhoto("")} className="mono rounded-md border border-red-400/50 bg-black/70 px-2 py-0.5 text-[9.5px] text-red-200">✕ ဖယ်</button>}
                  </div>
                </div>
                <label className="mono mt-2 block cursor-pointer rounded-xl border border-white/15 bg-white/5 py-2.5 text-center text-[12px] font-bold active:scale-95">
                  ⬆ နောက်ခံပုံတင်မည်
                  <input type="file" accept="image/*" className="hidden" onChange={pickImage("bg")} />
                </label>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">AVATAR · ကိုယ်ပွား</p>
                <div className="grid grid-cols-8 gap-1.5">
                  {AVATARS.map((a) => (
                    <button key={a} onClick={() => setAvatar(a)} className={`grid h-9 place-items-center rounded-xl border text-[17px] active:scale-90 ${avatar === a ? "text-black" : "border-white/12 bg-white/5"}`} style={avatar === a ? { background: `linear-gradient(135deg, ${tA}, ${tB})`, borderColor: "transparent" } : undefined}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">BACKGROUND · နောက်ခံ</p>
                <div className="grid grid-cols-2 gap-2">
                  {BG_PRESETS.map((b) => (
                    <button key={b.id} onClick={() => setBg(b.id)} className={`overflow-hidden rounded-xl border text-left active:scale-95 ${bg === b.id ? "border-white/60" : "border-white/12"}`}>
                      <span className="block h-[52px]" style={{ background: b.css }} />
                      <span className="block bg-black/70 px-2 py-1"><span className="block text-[11px] font-bold">{b.name}</span><span className="my block text-[10px] text-white/50">{b.my} {bg === b.id ? "✓" : ""}</span></span>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving} className="btn-bevel w-full rounded-2xl py-3.5 text-[13.5px] font-black text-black disabled:opacity-50" style={{ ["--ac" as string]: tA, background: `linear-gradient(135deg, ${tA}, ${tB})` }}>{saving ? "◌ SAVING…" : "✓ SAVE PROFILE"}</button>
              <p className="mono text-center text-[10px] text-white/35">Theme အရောင်ပါ တစ်ခါတည်း သိမ်းမည် · Settings → Theme မှ အသေးစိတ်ပြင်</p>
              <button onClick={logout} className="mono w-full rounded-2xl border border-red-400/40 bg-red-500/10 py-3 text-[12.5px] font-bold text-red-100 active:scale-95">⎋ LOGOUT · အကောင့်ထွက်</button>
            </div>
          )}

          {tab === "stats" && (
            <div className="space-y-3">
              <div className="flow-border relative overflow-hidden rounded-2xl p-4" style={{ ["--ac" as string]: tA, ["--bc" as string]: tB, background: bgPhoto ? `linear-gradient(rgba(0,0,0,.72), rgba(0,0,0,.86)), center/cover no-repeat url(${bgPhoto})` : "rgba(0,0,0,.6)" }}>
                <div className="flex items-center gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 text-[24px] text-black" style={{ borderColor: tA, background: photo ? "#000" : `linear-gradient(135deg, ${tA}, ${tB})`, boxShadow: `0 0 20px ${tA}44` }}>
                    {photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt="profile" className="h-full w-full object-cover" /> : avatar}
                  </span>
                  <div className="min-w-0"><p className="mono text-[9px] tracking-[0.3em]" style={{ color: tA }}>USER STATIC CARD</p><p className="my truncate text-[15px] font-bold">{p?.displayName}</p><p className="mono truncate text-[10px] text-white/50">@{p?.username ?? "operator"} · {p?.email}</p></div>
                  <span className={`mono ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold ${p?.isPro ? "bg-lime-300/15 text-lime-200 border border-lime-300/40" : "bg-white/5 text-white/60 border border-white/15"}`}>{p?.isPro ? (p?.proByok ? "◆ BYOK" : "◆ PRO") : "○ FREE"}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[{ k: "JOBS", v: String(stats?.totals.jobs ?? "…") }, { k: "SPENT", v: `${stats?.totals.spent ?? "…"} CR` }, { k: "VAULT", v: `${p?.credits ?? "…"} CR` }].map((s) => (
                    <div key={s.k} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center"><p className="mono text-[8.5px] tracking-[0.25em] text-white/45">{s.k}</p><p className="mono text-[15px] font-bold">{s.v}</p></div>
                  ))}
                </div>
                <div className="mono mt-2 flex justify-between text-[10px] text-white/50"><span>★ favorite: {stats?.favorite ?? "—"}</span><span>{p?.proExpiresAt ? `PRO → ${new Date(p.proExpiresAt).toLocaleDateString()}${p?.proByok ? " · BYOK" : ""}` : "no expiry"}</span></div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">PER-FACTION MATRIX</p>
                {(stats?.byFaction?.length ?? 0) === 0 && <p className="mono text-[11px] text-white/40">no jobs yet — ignite a faction</p>}
                <div className="space-y-1.5">
                  {(stats?.byFaction ?? []).map((r) => (
                    <div key={r.faction} className="flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1.5"><span className="mono text-[11px] font-bold">{r.faction}</span><span className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full" style={{ width: `${Math.min(100, r.n * 20)}%`, background: `linear-gradient(90deg, ${tA}, ${tB})` }} /></span><span className="mono text-[10px] text-white/55">×{r.n} · {r.spent}CR</span></div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">RECENT LEDGER</p>
                <div className="space-y-1.5">
                  {(stats?.recent ?? []).map((t) => (
                    <div key={t.id} className="mono flex justify-between rounded-lg bg-white/5 px-2 py-1.5 text-[10.5px]"><span>{t.faction} · {t.status}</span><span className="text-white/50">{t.cost}CR</span></div>
                  ))}
                  {(stats?.recent?.length ?? 0) === 0 && <p className="mono text-[11px] text-white/40">empty</p>}
                </div>
              </div>
            </div>
          )}

          {tab === "pro" && (
            <div className="space-y-3">
              {/* SINGLE payment card */}
              <div className="relative overflow-hidden rounded-2xl border border-lime-300/30 bg-gradient-to-br from-[#0c1a0c] to-black p-4">
                <div className="dotgrid absolute inset-0 opacity-15" />
                <p className="mono relative text-[9.5px] tracking-[0.3em] text-lime-300">◆ PRO MEMBER PAYMENT CARD · SINGLE</p>
                <h3 className="display relative mt-1 text-[18px] font-black">UNLIMITED ×5 RIGS</h3>
                <p className="my relative mt-1 text-[12px] text-white/65">Recap · Reel · MM Voice · Subs · Upscale — အကန့်အသတ်မရှိ။ Server က <span className="mono text-lime-200">is_pro</span> စစ်သည်။</p>

                {/* BYOK ON/OFF — single toggle */}
                <div className="relative mt-3 flex items-center gap-3 rounded-2xl border border-white/12 bg-black/60 p-3" style={{ ["--ac" as string]: "#7CFC00", ["--bc" as string]: "#00e5ff" }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-black">⧉ ကိုယ့် API KEY နဲ့ကိုအသုံးပြုမည်</p>
                    <p className="my text-[11px] text-white/55">{byok ? "BYOK ON — ကိုယ့် key, ဈေးသက်သာ −40%" : "OFF — platform key အပါ, key မလို"}</p>
                  </div>
                  <button onClick={() => setByok((s) => !s)} className="forge-switch" data-on={byok} aria-label="BYOK toggle" role="switch" aria-checked={byok} />
                </div>
                <div className="relative mt-2 grid grid-cols-2 gap-1.5">
                  <div className={`rounded-xl border p-2 text-center ${!byok ? "border-lime-300/60 bg-lime-300/10" : "border-white/10 bg-black/40 opacity-60"}`}>
                    <p className="mono text-[9px] tracking-[0.2em] text-white/50">STANDARD · KEY မလို {!byok ? "●" : ""}</p>
                    <p className="mono text-[11px] font-bold text-lime-200">platform key ပါ</p>
                  </div>
                  <div className={`rounded-xl border p-2 text-center ${byok ? "border-sky-300/60 bg-sky-300/10" : "border-white/10 bg-black/40 opacity-60"}`}>
                    <p className="mono text-[9px] tracking-[0.2em] text-white/50">BYOK · ကိုယ့် KEY {byok ? "●" : ""}</p>
                    <p className="mono text-[11px] font-bold text-sky-200">−40% သက်သာ</p>
                  </div>
                </div>

                {/* inline key box when BYOK */}
                {byok && (
                  <div className="relative mt-2 rounded-2xl border border-sky-300/40 bg-sky-300/[0.06] p-2.5">
                    <p className="mono mb-1.5 text-[10px] tracking-[0.22em] text-sky-200">BYOK API KEY {p?.hasAiKey ? "· ● LINKED" : "· ○ REQUIRED"}</p>
                    {p?.hasAiKey ? (
                      <p className="mono rounded-xl bg-black/50 px-2.5 py-2 text-[11px] text-white/65">● key ချိတ်ပြီးသား — အသစ်ထည့်မှ replace မည်။ <button onClick={() => setTab("keys")} className="underline" style={{ color: tA }}>API tab ›</button></p>
                    ) : null}
                    <div className="mt-1.5 flex gap-1.5">
                      <input value={byokKey} onChange={(e) => setByokKey(e.target.value)} type={showByokKey ? "text" : "password"} placeholder="sk-… ထည့်ပါ (BYOK ဈေးအတွက် မဖြစ်မနေ)" className="mono w-full rounded-xl border border-sky-300/30 bg-black/70 px-3 py-2.5 text-[12px]" />
                      <button onClick={() => setShowByokKey((s) => !s)} className="mono shrink-0 rounded-xl border border-white/15 px-3 text-[12px]">{showByokKey ? "🙈" : "👁"}</button>
                    </div>
                    <p className="my mt-1 text-[10.5px] text-white/50">ဒီ key ကို PRO purchase နဲ့တစ်ခါတည်း သိမ်းမည်။ OpenAI bill ကို သင်ကိုယ်တိုင် ကျခံမည် — ဒါကြောင့် PRO ဈေးသက်သာသည်။</p>
                  </div>
                )}

                <div className="relative mt-3 space-y-1.5">
                  {PRO_PLANS.map((pl) => {
                    const showPrice = byok ? pl.byokPrice : pl.price;
                    const wasPrice = byok ? pl.price : null;
                    return (
                      <button key={pl.id} onClick={() => setPlan(pl.id)} className={`flex w-full items-center gap-2 rounded-2xl border p-2.5 text-left active:scale-[0.99] ${plan === pl.id ? "border-lime-300/70 bg-lime-300/10" : "border-white/12 bg-black/50"}`}>
                        <span className={`mono rounded-lg px-2 py-1 text-[9px] font-bold ${plan === pl.id ? "bg-lime-300 text-black" : "bg-white/10 text-white/60"}`}>{pl.tag}</span>
                        <span><span className="block text-[13px] font-bold">{pl.name}</span><span className="my block text-[11px] text-white/55">{pl.my} · {pl.days} ရက် · {byok ? "BYOK" : "STANDARD"}</span></span>
                        <span className="ml-auto text-right"><span className="mono block text-[13px] font-bold text-lime-200">{showPrice.toLocaleString()} Ks</span>{wasPrice ? <span className="mono block text-[10px] text-white/35 line-through">{wasPrice.toLocaleString()}</span> : null}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">PAY WITH · ငွေချေနည်း</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {PAY_METHODS.map((m) => (
                    <button key={m.id} onClick={() => { setProMethod(m.id); }} className={`rounded-xl border p-2 text-center active:scale-95 ${proMethod === m.id ? "border-white/70 bg-white/10" : "border-white/12 bg-white/[0.03]"}`}>
                      <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl text-[16px] font-black text-black" style={{ background: m.color }}>{m.glyph}</span>
                      <span className="mono mt-1 block text-[9px] font-bold">{m.name}</span>
                    </button>
                  ))}
                </div>
                {proMethod === "Card" ? (
                  <div className="mt-2 space-y-1.5">
                    <input value={card.num} onChange={(e) => setCard({ ...card, num: e.target.value })} inputMode="numeric" placeholder="Card number · 4242 4242 4242 4242" className="mono w-full rounded-xl border border-white/15 bg-black/70 px-3 py-2.5 text-[12.5px]" />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/YY" className="mono w-full rounded-xl border border-white/15 bg-black/70 px-3 py-2.5 text-[12.5px]" />
                      <input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} inputMode="numeric" placeholder="CVC" className="mono w-full rounded-xl border border-white/15 bg-black/70 px-3 py-2.5 text-[12.5px]" />
                    </div>
                  </div>
                ) : (
                  <input value={card.phone} onChange={(e) => setCard({ ...card, phone: e.target.value })} inputMode="tel" placeholder={`${proMethod} phone · 09xxxxxxxxx`} className="mono mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-3 py-2.5 text-[12.5px]" />
                )}
                <div className="mono mt-2 flex justify-between rounded-xl bg-white/5 px-3 py-2 text-[11.5px]"><span>Due today · {byok ? "BYOK" : "STANDARD"}</span><span className="font-bold text-lime-200">{dueToday.toLocaleString()} Ks</span></div>
              </div>
              <button onClick={buyPro} disabled={proPaying} className="btn-bevel w-full rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 py-3.5 text-[13.5px] font-black text-black disabled:opacity-50" style={{ ["--ac" as string]: "#7CFC00" }}>{proPaying ? "◌ VERIFYING PAYMENT…" : `◆ PAY ${dueToday.toLocaleString()} Ks — ${byok ? "BYOK " : ""}ACTIVATE PRO`}</button>
              <p className="mono text-center text-[10px] text-white/35">ကတ်တစ်ခုတည်း · toggle နဲ့ ၂ ဈေး · order + mode ledger မှာသိမ်း</p>
            </div>
          )}

          {tab === "credits" && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-2xl border border-amber-300/30 bg-gradient-to-br from-[#211303] to-black p-4">
                <p className="mono text-[9.5px] tracking-[0.3em] text-amber-300">⚡ CREDIT PAYMENT · SLIDER SHOP</p>
                <p className="display mt-1 text-[30px] font-black leading-none">{cr} <span className="text-[14px]">CR</span></p>
                <p className="mono text-[12px] text-amber-200">≈ {mmk.toLocaleString()} Ks <span className="text-white/40">· 10 CR = 1,000 Ks</span></p>
                <input type="range" min={10} max={500} step={10} value={cr} onChange={(e) => setCr(Number(e.target.value))} className="credit-slider mt-3 w-full" style={{ ["--ac" as string]: "#fbbf24" }} />
                <div className="mono flex justify-between text-[9.5px] text-white/40"><span>10</span><span>100</span><span>250</span><span>500</span></div>
                <div className="mt-2 flex gap-1.5">{[50, 100, 200, 500].map((q) => <button key={q} onClick={() => setCr(q)} className={`mono flex-1 rounded-xl border py-2 text-[11px] font-bold active:scale-95 ${cr === q ? "border-amber-300/70 bg-amber-300/15 text-amber-100" : "border-white/12 bg-black/50 text-white/55"}`}>+{q}</button>)}</div>
                <div className="relative mt-3 h-[10px] overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all" style={{ width: `${(cr / 500) * 100}%`, background: "linear-gradient(90deg,#fbbf24,#fff,#fb923c)", boxShadow: "0 0 18px rgba(251,191,36,.6)" }} /></div>
                <p className="my mt-2 text-[11px] text-white/50">GPU TURBO + credit forge tools အားလုံး ဒီ vault က ဖြတ်မည်။</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">PAY WITH</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {PAY_METHODS.map((m) => (
                    <button key={m.id} onClick={() => setCrMethod(m.id)} className={`rounded-xl border p-2 text-center active:scale-95 ${crMethod === m.id ? "border-amber-300/70 bg-amber-300/10" : "border-white/12 bg-white/[0.03]"}`}>
                      <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl text-[16px] font-black text-black" style={{ background: m.color }}>{m.glyph}</span>
                      <span className="mono mt-1 block text-[9px] font-bold">{m.name}</span>
                    </button>
                  ))}
                </div>
                <div className="mono mt-2 flex justify-between rounded-xl bg-white/5 px-3 py-2 text-[11.5px]"><span>{cr} CR via {crMethod}</span><span className="font-bold text-amber-200">{mmk.toLocaleString()} Ks</span></div>
              </div>
              <button onClick={buyCredits} disabled={paying} className="btn-bevel w-full rounded-2xl bg-gradient-to-r from-amber-300 to-orange-500 py-3.5 text-[13.5px] font-black text-black disabled:opacity-50" style={{ ["--ac" as string]: "#fbbf24" }}>{paying ? "◌ SMELTING…" : `⚡ BUY ${cr} CR — ${mmk.toLocaleString()} Ks`}</button>
              <p className="my text-center text-[11px] text-white/45">ဆွဲပြီးစိတ်ကြိုက်ဝယ် — vault ထဲ တန်းဝင်။ GPU 4–8 · NEWS 15 · URL 10 · YT 12 · DOC 8 · KNOW 5</p>
            </div>
          )}

          {tab === "theme" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">PRESET THEMES · အဆင်သင့်</p>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map((t) => {
                    const on = tA.toLowerCase() === t.primary.toLowerCase() && tB.toLowerCase() === t.secondary.toLowerCase();
                    return (
                      <button key={t.id} onClick={() => { setTA(t.primary); setTB(t.secondary); }} className={`rounded-2xl border p-2.5 text-left active:scale-95 ${on ? "border-white/70" : "border-white/12 bg-white/[0.03]"}`}>
                        <span className="flex h-8 overflow-hidden rounded-lg"><span className="flex-1" style={{ background: t.primary }} /><span className="flex-1" style={{ background: t.secondary }} /></span>
                        <span className="mt-1.5 block text-[12px] font-bold">{t.name} {on ? "✓" : ""}</span>
                        <span className="my block text-[10.5px] text-white/50">{t.my}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">CUSTOM · စိတ်ကြိုက်အရောင်</p>
                <div className="grid grid-cols-2 gap-2">
                  {( [{ k: "Primary", v: tA, s: setTA }, { k: "Secondary", v: tB, s: setTB }] ).map((c) => (
                    <label key={c.k} className="rounded-2xl border border-white/12 bg-black/60 p-2.5">
                      <span className="mono text-[10px] text-white/55">{c.k}</span>
                      <span className="mt-1.5 flex items-center gap-2">
                        <input type="color" value={c.v} onChange={(e) => c.s(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-white/20 bg-transparent" />
                        <span className="mono text-[11px]">{c.v}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 p-3" style={{ background: `linear-gradient(135deg, ${tA}26, transparent 50%, ${tB}26), #05070f` }}>
                  <p className="display text-[15px] font-black" style={{ color: tA }}>LIVE PREVIEW · CUTFLOW</p>
                  <p className="my text-[11.5px] text-white/60">မိန်းကာလာ ပြောင်းတာနဲ့ header, reactor, button အားလုံး လိုက်ပြောင်းမည်။</p>
                  <span className="mt-2 inline-block rounded-xl px-4 py-2 text-[12px] font-black text-black" style={{ background: `linear-gradient(135deg, ${tA}, ${tB})` }}>⬢ IGNITE SAMPLE</span>
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving} className="btn-bevel w-full rounded-2xl py-3.5 text-[13.5px] font-black text-black disabled:opacity-50" style={{ ["--ac" as string]: tA, background: `linear-gradient(135deg, ${tA}, ${tB})` }}>{saving ? "◌ APPLYING…" : "◈ APPLY THEME"}</button>
            </div>
          )}

          {tab === "keys" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-1 text-[10px] tracking-[0.28em] text-white/50">ENGINE STATUS</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/5 p-2.5"><p className="mono text-[9px] text-white/45">SERVER KEY (.env/zip)</p><p className="mono text-[13px] font-bold">{p?.serverHasKey ? "● READY" : "○ EMPTY"}</p></div>
                  <div className="rounded-xl bg-white/5 p-2.5"><p className="mono text-[9px] text-white/45">MY KEY (BYOK)</p><p className="mono text-[13px] font-bold">{p?.hasAiKey ? "● LINKED" : "○ NONE"}</p></div>
                </div>
                <p className="my mt-2 text-[11.5px] leading-[1.7] text-white/60">Key မရှိလဲ <b>offline forge</b> က auto အလုပ်လုပ်သည်။ BYOK PRO ဝယ်ထားရင် ကိုယ့် key နဲ့ cloud သုံးမည် — OpenAI bill ကိုယ်ကျခံမည်။</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">AI PROVIDER</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[["auto", "AUTO"], ["openai", "CLOUD"], ["offline", "OFFLINE"]].map(([v, l]) => (
                    <button key={v} onClick={() => setProvider(v)} className={`mono rounded-xl border py-2.5 text-[11px] font-bold active:scale-95 ${provider === v ? "text-black" : "border-white/12 bg-white/5 text-white/60"}`} style={provider === v ? { background: `linear-gradient(135deg, ${tA}, ${tB})`, borderColor: "transparent" } : undefined}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <p className="mono mb-2 text-[10px] tracking-[0.28em] text-white/50">OPENAI API KEY · BYOK</p>
                <div className="flex gap-1.5">
                  <input value={key} onChange={(e) => setKey(e.target.value)} type={showKey ? "text" : "password"} placeholder="sk-… (မရှိလဲ ရသည်)" className="mono w-full rounded-xl border border-white/15 bg-black/70 px-3 py-2.5 text-[12px]" />
                  <button onClick={() => setShowKey((s) => !s)} className="mono shrink-0 rounded-xl border border-white/15 px-3 text-[12px]">{showKey ? "🙈" : "👁"}</button>
                </div>
                <p className="mono mt-1.5 text-[10px] leading-relaxed text-white/40">zip → .env မှာ OPENAI_API_KEY=sk-… ဖြည့်လဲ ရသည်။<br />Blank + Save = key ဖျက် → offline mode။ Key မှားလဲ app မပျက် — fallback ခံထားသည်။</p>
              </div>
              <button onClick={saveKey} disabled={saving} className="btn-bevel w-full rounded-2xl py-3.5 text-[13.5px] font-black text-black disabled:opacity-50" style={{ ["--ac" as string]: tA, background: `linear-gradient(135deg, ${tA}, ${tB})` }}>{saving ? "◌ LINKING…" : "⧉ SAVE AI SETTINGS"}</button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
