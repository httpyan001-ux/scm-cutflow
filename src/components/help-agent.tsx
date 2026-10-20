"use client";

import { useEffect, useRef, useState } from "react";

interface Msg { role: "user" | "agent"; text: string; chips?: string[]; engine?: string }

const WELCOME: Msg = {
  role: "agent",
  text:
    "👋 မင်္ဂလာပါ! ကျွန်တော်က **CUTFLOW အကူအညီ Agent** ပါ။\n\n" +
    "Faction Tool ၁၀ မျိုးရဲ့ အလုပ်လုပ်ပုံ၊ PRO member ဝင်နည်း၊ Credit / GPU TURBO အသုံးပြုနည်းများကို ဖြေပေးပါမယ်။\n\n" +
    "အောက်က ခလုတ်တွေနှိပ်လို့လည်းရ၊ ကိုယ်တိုင်ရိုက်မေးလို့လည်းရပါတယ်။",
  chips: ["Tool ၁၀ မျိုး ဘာတွေလဲ?", "PRO ဘယ်လိုဝင်မလဲ?", "Credit ဝယ်နည်း", "GPU TURBO ဆိုတာ?"],
};

/* tiny markdown: **bold** + line breaks */
function RichText({ text, accent }: { text: string; accent: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <span key={i} className="block h-1.5" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i} className="my block break-anywhere text-[12.5px] leading-[1.8]">
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**")
                ? <b key={j} style={{ color: accent }}>{p.slice(2, -2)}</b>
                : <span key={j}>{p}</span>
            )}
          </span>
        );
      })}
    </>
  );
}

export function HelpAgent({ accent = "#00e5ff", accent2 = "#ff2e4c" }: { accent?: string; accent2?: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [nudge, setNudge] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cutflow-agent-seen")) {
        const t = setTimeout(() => setNudge(true), 3000);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" }), 80);
  }, [msgs, open, busy]);

  const openChat = () => {
    setOpen(true); setNudge(false);
    try { localStorage.setItem("cutflow-agent-seen", "1"); } catch {}
    setTimeout(() => inputRef.current?.focus(), 350);
  };

  const send = async (raw?: string) => {
    const q = (raw ?? input).trim();
    if (!q || busy) return;
    setInput("");
    const history = msgs.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const r = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q, history }) });
      const j = await r.json();
      setMsgs((m) => [...m, { role: "agent", text: j.reply || "…", chips: j.chips, engine: j.engine }]);
    } catch {
      setMsgs((m) => [...m, { role: "agent", text: "⚠ ကွန်ရက်ပြဿနာ — ထပ်စမ်းကြည့်ပါ။", chips: ["Tool ၁၀ မျိုး", "PRO ဝင်နည်း"] }]);
    }
    setBusy(false);
  };

  const lastChips = msgs[msgs.length - 1]?.role === "agent" ? msgs[msgs.length - 1].chips : undefined;

  return (
    <>
      {/* nudge bubble */}
      {nudge && !open && (
        <div className="rise fixed bottom-[104px] right-3 z-[58] max-w-[250px] md:bottom-[92px] md:right-6">
          <button onClick={openChat} className="flow-border block overflow-hidden rounded-2xl bg-[#070a15]/95 p-3 text-left backdrop-blur-xl" style={{ ["--ac" as string]: accent, ["--bc" as string]: accent2 }}>
            <p className="mono text-[9px] tracking-[0.28em] text-white/50">◈ အကူအညီ AGENT</p>
            <p className="my mt-0.5 text-[12px] font-bold leading-[1.7]">Tool တွေ၊ PRO ဝင်နည်း မေးစရာရှိရင် ဒီမှာနှိပ်ပါ။</p>
          </button>
        </div>
      )}

      {/* FAB — replaces old guide icon */}
      <button
        onClick={openChat}
        aria-label="အကူအညီ — AI Agent"
        className="group fixed bottom-[86px] right-3 z-[57] grid h-[54px] w-[54px] place-items-center rounded-2xl border bg-black/85 backdrop-blur-xl transition-transform active:scale-90 md:bottom-7 md:right-6"
        style={{ borderColor: `${accent}99`, boxShadow: `0 0 26px ${accent}55, inset 0 0 16px rgba(0,0,0,.8)` }}
      >
        <span className="absolute inset-0 rounded-2xl opacity-60" style={{ background: `radial-gradient(circle at 50% 120%, ${accent}33, transparent 70%)` }} />
        <span className="relative text-[22px]">💬</span>
        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full text-[9px] font-black text-black" style={{ background: accent }}>AI</span>
        <span className="mono absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold tracking-widest text-white/50">အကူအညီ</span>
      </button>

      {/* chat window */}
      {open && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-6">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="sheet-up relative flex h-[88dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-[24px] border border-white/12 bg-[#070a15] sm:h-[80dvh] sm:rounded-[24px]"
            style={{ ["--ac" as string]: accent, ["--bc" as string]: accent2, paddingBottom: "var(--safe-b)" }}
          >
            {/* header */}
            <div className="relative shrink-0 overflow-hidden border-b border-white/10 px-3 py-2.5" style={{ background: `linear-gradient(135deg, ${accent}1f, transparent 60%, ${accent2}1f)` }}>
              <div className="dotgrid absolute inset-0 opacity-20" />
              <div className="relative flex items-center gap-2.5">
                <span className="core-pulse grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-[19px] text-black" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>💬</span>
                <div className="min-w-0 flex-1">
                  <p className="display truncate text-[14px] font-black">အကူအညီ · SUPPORT AGENT</p>
                  <p className="mono flex items-center gap-1 text-[9.5px] text-white/50"><span className="blink h-1.5 w-1.5 rounded-full" style={{ background: "#7CFC00" }} /> Tools · PRO · Credit သာ ဖြေသည်</p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="mono shrink-0 rounded-xl border border-white/15 bg-black/50 px-2.5 py-2 text-[13px] text-white/70 active:scale-95">✕</button>
              </div>
            </div>

            {/* messages */}
            <div ref={bodyRef} className="thin-scroll flex-1 space-y-2.5 overflow-y-auto p-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3 py-2.5 ${m.role === "user" ? "text-black" : "border border-white/12 bg-white/[0.045]"}`}
                    style={m.role === "user" ? { background: `linear-gradient(135deg, ${accent}, ${accent2})` } : undefined}
                  >
                    {m.role === "agent" && (
                      <p className="mono mb-1 flex items-center gap-1.5 text-[8.5px] tracking-[0.24em] text-white/40">
                        <span style={{ color: accent }}>◈ AGENT</span>
                        {m.engine === "cloud" ? <span className="rounded-full bg-sky-300/15 px-1.5 text-sky-200">cloud</span> : m.engine === "guard" ? <span className="rounded-full bg-red-400/15 px-1.5 text-red-200">guard</span> : m.engine ? <span className="rounded-full bg-lime-300/10 px-1.5 text-lime-200">offline</span> : null}
                      </p>
                    )}
                    {m.role === "user"
                      ? <span className="my block break-anywhere text-[12.5px] font-semibold leading-[1.75]">{m.text}</span>
                      : <RichText text={m.text} accent={accent} />}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-white/12 bg-white/[0.045] px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full" style={{ background: accent, animation: `barsRise .7s ease-in-out ${i * 0.15}s infinite` }} />)}
                      <span className="mono ml-1 text-[10px] text-white/50">စဉ်းစားနေသည်…</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* quick chips */}
            {lastChips && lastChips.length > 0 && !busy && (
              <div className="shrink-0 border-t border-white/10 px-3 py-2">
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {lastChips.map((c) => (
                    <button key={c} onClick={() => send(c)} className="mono shrink-0 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold active:scale-95" style={{ borderColor: `${accent}55`, color: accent, background: `${accent}12` }}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            {/* composer */}
            <div className="shrink-0 border-t border-white/10 bg-black/50 p-2.5" style={{ paddingBottom: "calc(0.625rem + var(--safe-b))" }}>
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tool / PRO / Credit အကြောင်း မေးပါ…"
                  className="search-glow my min-w-0 flex-1 rounded-2xl border border-white/15 bg-black/70 px-3 py-3 text-[13px]"
                  style={{ ["--ac" as string]: accent }}
                />
                <button type="submit" disabled={busy || !input.trim()} aria-label="Send"
                  className="btn-bevel grid h-[46px] w-[46px] shrink-0 place-items-center rounded-2xl text-[17px] font-black text-black disabled:opacity-40"
                  style={{ ["--ac" as string]: accent, background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>➤</button>
              </form>
              <p className="mono mt-1 text-center text-[9px] text-white/30">Project တည်ဆောက်ပုံ / code မေးခွန်းများ မဖြေပါ — Tool နှင့် PRO/Credit သာ</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
