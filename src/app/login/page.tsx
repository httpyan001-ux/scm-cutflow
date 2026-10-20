"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthBackdrop, AuthBrand, FieldShell } from "@/components/auth-shell";

const AC = "#00e5ff";
const BC = "#ff2e4c";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr(null); setOk(null); setBusy(true);
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identity, password }) });
      const j = await r.json();
      if (!r.ok) { setErr(j.message || "ဝင်မရပါ"); setBusy(false); return; }
      setOk(j.message || "ဝင်ပြီးပါပြီ");
      router.replace(next.startsWith("/") ? next : "/");
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
          <div className="relative overflow-hidden border-b border-white/10 px-5 py-4" style={{ background: `linear-gradient(135deg, ${AC}1f, transparent 60%, ${BC}1f)` }}>
            <div className="dotgrid absolute inset-0 opacity-20" />
            <p className="mono relative text-[9.5px] tracking-[0.32em]" style={{ color: AC }}>◈ OPERATOR ACCESS</p>
            <h1 className="display relative mt-1 text-[24px] font-black leading-tight">LOGIN <span className="my text-[14px] font-medium text-white/55">· အကောင့်ဝင်</span></h1>
            <p className="my relative mt-1 text-[12px] text-white/55">USERNAME သို့ Gmail နှင့် စကားဝှက်ဖြင့် ဝင်ပါ။</p>
          </div>

          <form onSubmit={submit} className="space-y-3 p-5">
            <FieldShell label="Username / Gmail" my="အကောင့်" icon="◉">
              <input value={identity} onChange={(e) => setIdentity(e.target.value)} autoComplete="username" placeholder="forge_operator  သို့  you@gmail.com"
                className="search-glow my w-full rounded-2xl border border-white/15 bg-black/70 px-3 py-3 text-[13.5px]" style={{ ["--ac" as string]: AC }} />
            </FieldShell>

            <FieldShell label="Password" my="စကားဝှက်" icon="🔒">
              <span className="flex gap-1.5">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} autoComplete="current-password" placeholder="••••••••"
                  className="search-glow my w-full rounded-2xl border border-white/15 bg-black/70 px-3 py-3 text-[13.5px]" style={{ ["--ac" as string]: AC }} />
                <button type="button" onClick={() => setShow((s) => !s)} className="mono shrink-0 rounded-2xl border border-white/15 px-3 text-[13px]">{show ? "🙈" : "👁"}</button>
              </span>
            </FieldShell>

            {err && <p className="rise rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2.5 text-[12.5px] font-semibold text-red-100">{err}</p>}
            {ok && <p className="rise rounded-2xl border border-lime-300/40 bg-lime-300/10 px-3 py-2.5 text-[12.5px] font-semibold text-lime-100">{ok}</p>}

            <button type="submit" disabled={busy || !identity || !password}
              className="btn-bevel w-full rounded-2xl py-3.5 text-[14px] font-black text-black disabled:opacity-40"
              style={{ ["--ac" as string]: AC, background: `linear-gradient(135deg, ${AC}, #fff, ${BC})` }}>
              {busy ? "◌ VERIFYING…" : "⬢ LOGIN · ဝင်မည်"}
            </button>

            <div className="guide-divider my-1" style={{ ["--ac" as string]: AC, ["--bc" as string]: BC }} />
            <a href="/register" className="block rounded-2xl border border-white/15 bg-white/5 py-3 text-center text-[13px] font-bold active:scale-95">
              ✦ အကောင့်မရှိသေးဘူးလား? <span style={{ color: AC }}>REGISTER →</span>
            </a>
          </form>

          <div className="mono flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-white/10 bg-black/40 px-4 py-2.5 text-[9.5px] text-white/40">
            <span>🔒 scrypt hash</span><span>🍪 HttpOnly session</span><span>🛡 rate-limited</span><span>📧 Gmail-only</span>
          </div>
        </section>

        <p className="my mt-4 text-center text-[10.5px] leading-[1.8] text-white/35">
          ၆ ကြိမ် မှားရင် ၁၅ မိနစ် ပိတ်မည် · session ကို HttpOnly cookie ဖြင့် လုံခြုံစွာသိမ်းသည်
        </p>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[100dvh] place-items-center text-white/50">loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
