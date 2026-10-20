"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthBackdrop, AuthBrand, FieldShell } from "@/components/auth-shell";

const AC = "#7CFC00";
const BC = "#00e5ff";

const GMAIL_RE = /^[a-z0-9][a-z0-9._%+-]{4,28}[a-z0-9]@gmail\.com$/i;

function strength(p: string) {
  const checks = [p.length >= 8, /[a-z]/.test(p), /[A-Z]/.test(p), /[0-9]/.test(p), p.length >= 12];
  const score = checks.filter(Boolean).length;
  const missing: string[] = [];
  if (p.length < 8) missing.push("၈ လုံး");
  if (!/[a-z]/.test(p)) missing.push("a-z");
  if (!/[A-Z]/.test(p)) missing.push("A-Z");
  if (!/[0-9]/.test(p)) missing.push("0-9");
  return { score, missing };
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const st = useMemo(() => strength(password), [password]);
  const userOk = /^[a-zA-Z0-9_.]{3,20}$/.test(username) && !/^[._]|[._]$/.test(username);
  const mailOk = GMAIL_RE.test(email.trim());
  const passOk = st.missing.length === 0;
  const matchOk = password.length > 0 && password === confirm;
  const step1Ok = userOk && mailOk && passOk && matchOk;

  const sendOtp = async () => {
    if (!step1Ok || sending || cooldown > 0) return;
    setErr(null); setOk(null); setSending(true);
    try {
      const r = await fetch("/api/auth/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
      const j = await r.json();
      if (!r.ok) { setErr(j.message || "OTP ပို့မရပါ"); setSending(false); return; }
      setOk(j.message || "ကုဒ် ပို့ပြီးပါပြီ");
      setStep(2); setCooldown(60);
    } catch { setErr("ကွန်ရက်မှား — ထပ်စမ်းပါ"); }
    setSending(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || otp.length !== 6) return;
    setErr(null); setOk(null); setBusy(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email: email.trim(), password, confirm, otp }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.message || "အကောင့်ဖွင့်မရပါ"); setBusy(false); return; }
      setOk(j.message || "အကောင့်ဖွင့်ပြီးပါပြီ");
      router.replace("/");
      router.refresh();
    } catch { setErr("ကွန်ရက်မှား — ထပ်စမ်းပါ"); setBusy(false); }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-clip">
      <AuthBackdrop a={AC} b={BC} />
      <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[460px] flex-col justify-center px-4 py-8"
        style={{ paddingLeft: "calc(1rem + var(--safe-l))", paddingRight: "calc(1rem + var(--safe-r))", paddingTop: "calc(2rem + var(--safe-t))", paddingBottom: "calc(2rem + var(--safe-b))" }}>
        <AuthBrand accent={AC} />

        <section className="flow-border rise mt-5 overflow-hidden rounded-[26px] bg-[#070a15]/92 backdrop-blur-xl" style={{ ["--ac" as string]: AC, ["--bc" as string]: BC }}>
          <div className="relative overflow-hidden border-b border-white/10 px-5 py-4" style={{ background: `linear-gradient(135deg, ${AC}1a, transparent 60%, ${BC}1f)` }}>
            <div className="dotgrid absolute inset-0 opacity-20" />
            <p className="mono relative text-[9.5px] tracking-[0.32em]" style={{ color: AC }}>◆ NEW OPERATOR · GMAIL VERIFIED</p>
            <h1 className="display relative mt-1 text-[24px] font-black leading-tight">REGISTER <span className="my text-[14px] font-medium text-white/55">· အကောင့်ဖွင့်</span></h1>
            {/* step rail */}
            <div className="relative mt-2.5 flex items-center gap-2">
              {[1, 2].map((n) => (
                <div key={n} className="flex flex-1 items-center gap-2">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[11px] font-black ${step >= n ? "text-black" : "border border-white/20 text-white/45"}`} style={step >= n ? { background: `linear-gradient(135deg, ${AC}, ${BC})` } : undefined}>{n}</span>
                  <span className="mono text-[9.5px] font-bold tracking-widest text-white/55">{n === 1 ? "အချက်အလက်" : "OTP အတည်ပြု"}</span>
                  {n === 1 && <span className="h-px flex-1 bg-white/15" />}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3 p-5">
            {step === 1 ? (
              <>
                <FieldShell label="Username" my="အသုံးပြုသူအမည်" icon="◉" ok={userOk && username.length > 0} error={username && !userOk ? "3–20 · a-z 0-9 _ ." : null}>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="forge_operator"
                    className="search-glow my w-full rounded-2xl border border-white/15 bg-black/70 px-3 py-3 text-[13.5px]" style={{ ["--ac" as string]: AC }} />
                </FieldShell>

                <FieldShell label="Gmail" my="Gmail သာ" icon="📧" ok={mailOk} error={email && !mailOk ? "Gmail မဟုတ်ပါ" : null} hint="@gmail.com လိပ်စာသာ လက်ခံသည် — OTP ကို ဤ inbox သို့ ပို့မည်">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="you@gmail.com"
                    className="search-glow my w-full rounded-2xl border border-white/15 bg-black/70 px-3 py-3 text-[13.5px]" style={{ ["--ac" as string]: AC }} />
                </FieldShell>

                <FieldShell label="Password" my="စကားဝှက်" icon="🔒" ok={passOk} error={password && !passOk ? `လို: ${st.missing.join(" ")}` : null}>
                  <span className="flex gap-1.5">
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} autoComplete="new-password" placeholder="••••••••"
                      className="search-glow my w-full rounded-2xl border border-white/15 bg-black/70 px-3 py-3 text-[13.5px]" style={{ ["--ac" as string]: AC }} />
                    <button type="button" onClick={() => setShow((s) => !s)} className="mono shrink-0 rounded-2xl border border-white/15 px-3 text-[13px]">{show ? "🙈" : "👁"}</button>
                  </span>
                  <span className="mt-1.5 flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="h-[5px] flex-1 rounded-full transition-all" style={{ background: i < st.score ? (st.score >= 4 ? AC : st.score >= 3 ? "#fbbf24" : "#ef4444") : "rgba(255,255,255,.12)" }} />
                    ))}
                  </span>
                </FieldShell>

                <FieldShell label="Confirm password" my="ထပ်ရိုက်" icon="🔁" ok={matchOk} error={confirm && !matchOk ? "မတူပါ" : null}>
                  <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type={show ? "text" : "password"} autoComplete="new-password" placeholder="••••••••"
                    className="search-glow my w-full rounded-2xl border border-white/15 bg-black/70 px-3 py-3 text-[13.5px]" style={{ ["--ac" as string]: AC }} />
                </FieldShell>

                {err && <p className="rise rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2.5 text-[12.5px] font-semibold text-red-100">{err}</p>}

                <button type="button" onClick={sendOtp} disabled={!step1Ok || sending}
                  className="btn-bevel w-full rounded-2xl py-3.5 text-[14px] font-black text-black disabled:opacity-40"
                  style={{ ["--ac" as string]: AC, background: `linear-gradient(135deg, ${AC}, #fff, ${BC})` }}>
                  {sending ? "◌ OTP ပို့နေသည်…" : "📧 OTP ကုဒ် ပို့ပါ →"}
                </button>
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-white/12 bg-black/50 p-3 text-center">
                  <p className="mono text-[9.5px] tracking-[0.28em] text-white/50">◈ VERIFICATION CODE</p>
                  <p className="my mt-1 text-[12.5px] leading-[1.8] text-white/70">
                    <b style={{ color: AC }}>{email}</b> ထံသို့ ၆ လုံး ကုဒ် ပို့ပြီးပါပြီ။<br />Inbox မတွေ့ရင် <b>Spam</b> ကိုလည်း စစ်ပါ။
                  </p>
                </div>

                <FieldShell label="OTP code" my="၆ လုံး ကုဒ်" icon="#" ok={otp.length === 6}>
                  <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000"
                    className="search-glow mono w-full rounded-2xl border border-white/15 bg-black/70 px-3 py-4 text-center text-[26px] font-black tracking-[0.5em]"
                    style={{ ["--ac" as string]: AC, color: AC }} />
                </FieldShell>

                {err && <p className="rise rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2.5 text-[12.5px] font-semibold text-red-100">{err}</p>}
                {ok && <p className="rise rounded-2xl border border-lime-300/40 bg-lime-300/10 px-3 py-2.5 text-[12.5px] font-semibold text-lime-100">{ok}</p>}

                <button type="submit" disabled={busy || otp.length !== 6}
                  className="btn-bevel w-full rounded-2xl py-3.5 text-[14px] font-black text-black disabled:opacity-40"
                  style={{ ["--ac" as string]: AC, background: `linear-gradient(135deg, ${AC}, #fff, ${BC})` }}>
                  {busy ? "◌ အတည်ပြုနေသည်…" : "✓ အကောင့်ဖွင့်မည်"}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setStep(1); setErr(null); setOk(null); }} className="mono rounded-2xl border border-white/15 bg-white/5 py-3 text-[12.5px] font-bold active:scale-95">‹ ပြန်ပြင်</button>
                  <button type="button" onClick={sendOtp} disabled={cooldown > 0 || sending} className="mono rounded-2xl border border-white/15 bg-white/5 py-3 text-[12.5px] font-bold disabled:opacity-40">
                    {cooldown > 0 ? `ပြန်ပို့ ${cooldown}s` : "↻ ကုဒ်ပြန်ပို့"}
                  </button>
                </div>
              </>
            )}

            <div className="guide-divider my-1" style={{ ["--ac" as string]: AC, ["--bc" as string]: BC }} />
            <a href="/login" className="block rounded-2xl border border-white/15 bg-white/5 py-3 text-center text-[13px] font-bold active:scale-95">
              အကောင့်ရှိပြီးသားလား? <span style={{ color: BC }}>LOGIN →</span>
            </a>
          </form>

          <div className="mono flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-white/10 bg-black/40 px-4 py-2.5 text-[9.5px] text-white/40">
            <span>📧 real OTP mail</span><span>🔒 scrypt</span><span>⏱ 10-min expiry</span><span>🛡 5-try lock</span>
          </div>
        </section>

        <p className="my mt-4 text-center text-[10.5px] leading-[1.8] text-white/35">
          အတုအီးမေးလ် လက်မခံပါ — Gmail inbox သို့ ရောက်သော ကုဒ်ဖြင့်သာ အကောင့်ဖွင့်နိုင်သည်။
        </p>
      </main>
    </div>
  );
}
