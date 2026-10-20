/* Studio presets — themes, backgrounds, avatars, pricing + offline AI fallback */

export interface ThemePreset {
  id: string;
  name: string;
  my: string;
  primary: string;
  secondary: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "aether", name: "Aether Cyan", my: "မိုးပြာရောင်", primary: "#00e5ff", secondary: "#ff2e4c" },
  { id: "mandalay", name: "Mandalay Gold", my: "ရွှေမန္တလေး", primary: "#fbbf24", secondary: "#ff2e4c" },
  { id: "bagan", name: "Emerald Bagan", my: "မြ ပုဂံ", primary: "#00ff9d", secondary: "#00b8ff" },
  { id: "royal", name: "Royal Violet", my: "ခရမ်းတော်ဝင်", primary: "#a855f7", secondary: "#ec4899" },
  { id: "volt", name: "Volt Rebellion", my: "ဗို့အား", primary: "#e8ff00", secondary: "#ff00e5" },
  { id: "ember", name: "Forge Ember", my: "မီးတောက်", primary: "#ff8a00", secondary: "#ff2e4c" },
];

export interface BgPreset {
  id: string;
  name: string;
  my: string;
  css: string;
}

export const BG_PRESETS: BgPreset[] = [
  { id: "nebula", name: "Nebula Forge", my: "နက်ဗျူလာ", css: "radial-gradient(500px 260px at 20% 0%, rgba(0,229,255,.25), transparent 60%), radial-gradient(500px 260px at 90% 20%, rgba(255,46,76,.22), transparent 60%), linear-gradient(180deg,#0b1024,#04050c)" },
  { id: "gold", name: "Shwedagon Dusk", my: "ရွှေတိဂုံ ညနေ", css: "radial-gradient(480px 260px at 80% 0%, rgba(251,191,36,.35), transparent 60%), radial-gradient(420px 240px at 10% 100%, rgba(255,46,76,.25), transparent 60%), linear-gradient(180deg,#221303,#04050c)" },
  { id: "emerald", name: "Inle Mist", my: "အင်းလေးမြူ", css: "radial-gradient(480px 260px at 15% 10%, rgba(0,255,157,.28), transparent 60%), radial-gradient(420px 240px at 90% 90%, rgba(0,184,255,.22), transparent 60%), linear-gradient(180deg,#04231a,#04050c)" },
  { id: "violet", name: "Royal Night", my: "တော်ဝင်ည", css: "radial-gradient(480px 260px at 50% 0%, rgba(168,85,247,.35), transparent 60%), radial-gradient(420px 240px at 90% 100%, rgba(236,72,153,.22), transparent 60%), linear-gradient(180deg,#160a26,#04050c)" },
  { id: "crimson", name: "Forge Blood", my: "သွေးရောင်", css: "radial-gradient(480px 260px at 20% 0%, rgba(255,46,76,.35), transparent 60%), radial-gradient(420px 240px at 85% 90%, rgba(255,138,0,.25), transparent 60%), linear-gradient(180deg,#2a0a12,#04050c)" },
  { id: "abyss", name: "Deep Abyss", my: "နက်ရှိုင်းမှောင်", css: "radial-gradient(420px 220px at 50% 0%, rgba(255,255,255,.08), transparent 60%), linear-gradient(180deg,#070a15,#020306)" },
];

export const AVATARS = ["⬢", "◈", "◆", "≋", "☰", "▶", "✦", "⟡", "◉", "⬣", "🐉", "🦚", "🌙", "⚡", "🔥", "🐘"];

export function bgCss(id: string): string {
  return BG_PRESETS.find((b) => b.id === id)?.css ?? BG_PRESETS[0].css;
}

/* ---------- pricing ---------- */
export const CR_PER_1000MMK = 10;
export function creditsToMmk(cr: number): number {
  return Math.round((cr / CR_PER_1000MMK) * 1000);
}
export type ProMode = "standard" | "byok";
export const PRO_PLANS = [
  { id: "30-day", name: "PRO 30 Days", my: "၃၀ ရက်", price: 15000, byokPrice: 9000, days: 30, tag: "POPULAR" },
  { id: "90-day", name: "PRO 90 Days", my: "၉၀ ရက်", price: 39000, byokPrice: 24000, days: 90, tag: "−13%" },
  { id: "365-day", name: "PRO 1 Year", my: "၁ နှစ်", price: 129000, byokPrice: 79000, days: 365, tag: "−28%" },
];
export function proPrice(planId: string, mode: ProMode): { price: number; days: number } {
  const p = PRO_PLANS.find((x) => x.id === planId) ?? PRO_PLANS[0];
  return { price: mode === "byok" ? p.byokPrice : p.price, days: p.days };
}

/* ---------- DURATION SLIDER limits (seconds) ---------- */
export interface DurationSpec { min: number; max: number; step: number; def: number; label: string; my: string }
export const DURATION_LIMITS: Record<string, DurationSpec> = {
  // RECAP — PRO unlimited, capped at 10 minutes
  recap: { min: 30, max: 600, step: 15, def: 120, label: "Recap length", my: "ရီကက်ကြာချိန်" },
  // YT PRO — credit tool, up to 30 minutes (half hour)
  "yt-pro": { min: 60, max: 1800, step: 30, def: 300, label: "Output length", my: "ထုတ်မည့်ကြာချိန်" },
};
export function durationSpec(slug: string): DurationSpec | null {
  return DURATION_LIMITS[slug] ?? null;
}
export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}
export function fmtDurationMy(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} စက္ကန့်`;
  return s === 0 ? `${m} မိနစ်` : `${m} မိနစ် ${s} စက္ကန့်`;
}

/* ---------- ASPECT RATIOS ---------- */
export interface AspectSpec { id: string; label: string; my: string; w: number; h: number; use: string }
export const ASPECT_RATIOS: AspectSpec[] = [
  { id: "9:16", label: "9:16", my: "ဒေါင်လိုက်", w: 9, h: 16, use: "Reels · TikTok · Shorts" },
  { id: "16:9", label: "16:9", my: "အလျားလိုက်", w: 16, h: 9, use: "YouTube · TV" },
  { id: "1:1", label: "1:1", my: "လေးထောင့်", w: 1, h: 1, use: "Feed · Grid post" },
  { id: "3:4", label: "3:4", my: "ဒေါင်အကျယ်", w: 3, h: 4, use: "Portrait post" },
  { id: "4:3", label: "4:3", my: "ကလက်စစ်", w: 4, h: 3, use: "Classic · Slides" },
];
export const DEFAULT_ASPECT = "16:9";
export function aspectSpec(id: string): AspectSpec {
  return ASPECT_RATIOS.find((a) => a.id === id) ?? ASPECT_RATIOS[1];
}

/* ---------- YT PRO dynamic credit pricing by duration ---------- */
export const YT_BASE_COST = 12;
export interface YtTier { id: string; name: string; my: string; upTo: number; cost: number; badge: string }
export const YT_TIERS: YtTier[] = [
  { id: "short", name: "SHORT CUT", my: "အတို", upTo: 300, cost: 12, badge: "≤5m" },
  { id: "standard", name: "STANDARD", my: "ပုံမှန်", upTo: 600, cost: 18, badge: "≤10m" },
  { id: "extended", name: "EXTENDED", my: "ရှည်", upTo: 1200, cost: 28, badge: "≤20m" },
  { id: "marathon", name: "MARATHON", my: "အရှည်ဆုံး", upTo: 1800, cost: 40, badge: "≤30m" },
];
export function ytTierFor(sec: number): YtTier {
  return YT_TIERS.find((t) => sec <= t.upTo) ?? YT_TIERS[YT_TIERS.length - 1];
}
export function ytCostFor(sec: number): number {
  return ytTierFor(sec).cost;
}

/** Server-authoritative cost for any faction given requested duration. */
export function baseCostFor(slug: string, group: "pro" | "forge", fallbackCost: number, durationSec?: number): number {
  if (group === "pro") return 0;
  if (slug === "yt-pro" && typeof durationSec === "number") return ytCostFor(durationSec);
  return fallbackCost;
}

/* ---------- GPU TURBO pricing (credits, deducted from vault) ---------- */
export const GPU_COSTS: Record<string, number> = {
  recap: 6, reel: 6, "mm-voice": 6, subs: 5, upscale: 8,
  news: 8, "url-recap": 6, "yt-pro": 7, "doc-translate": 5, knowledge: 4, copyright: 3, "voice-clone": 5, magic: 4,
};
export const GPU_SPEEDUP = 0.42; // GPU renders in ~42% of normal time
export function gpuCostFor(slug: string): number {
  return GPU_COSTS[slug] ?? 6;
}
export const PAY_METHODS = [
  { id: "KBPay", name: "KBZPay", color: "#1e40ff", glyph: "Ⓚ" },
  { id: "WavePay", name: "WavePay", color: "#ffd60a", glyph: "〰" },
  { id: "CBPay", name: "CBPay", color: "#00b140", glyph: "◉" },
  { id: "Card", name: "Visa / MPU", color: "#a855f7", glyph: "▭" },
];

/* ---------- OFFLINE FALLBACK AI (works with zero API key) ---------- */
export function splitSentences(text: string): string[] {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  // Myanmar "။" + latin ".!?।" aware
  const parts = cleaned.split(/(?<=[။.!?])\s+/);
  return parts.map((s) => s.trim()).filter((s) => s.length > 1);
}

export function offlineSummarize(transcript: string, maxBullets = 5): { bullets: string[]; chapters: { t: string; title: string; score: number }[]; keywords: string[]; reading: string } {
  const sentences = splitSentences(transcript);
  if (sentences.length === 0) {
    return {
      bullets: ["စာသားမရှိသေးပါ — mic သို့မဟုတ် ဖိုင်မှ စာသားထည့်ပါ။"],
      chapters: [{ t: "00:00", title: "Awaiting signal", score: 0 }],
      keywords: [],
      reading: "0 စာကြောင်း",
    };
  }
  const freq = new Map<string, number>();
  const words = transcript.toLowerCase().replace(/[။.,!?;:"“”‘’()\[\]]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  const scored = sentences.map((s, i) => {
    const ws = s.toLowerCase().split(/\s+/);
    let sc = 0;
    for (const w of ws) sc += freq.get(w) ?? 0;
    // position bonus: first + last matter
    if (i === 0) sc *= 1.35;
    if (i === sentences.length - 1) sc *= 1.2;
    sc = sc / Math.max(4, ws.length);
    return { s, sc, i };
  });
  scored.sort((a, b) => b.sc - a.sc);
  const top = scored.slice(0, Math.min(maxBullets, sentences.length)).sort((a, b) => a.i - b.i);
  const bullets = top.map((t) => t.s);
  const n = Math.min(4, sentences.length);
  const chapters = Array.from({ length: n }).map((_, k) => {
    const idx = Math.floor((k * sentences.length) / n);
    const mm = String(Math.floor((k * 11) / n)).padStart(2, "0");
    const ss = String(Math.floor(((k * 137) / n) % 60)).padStart(2, "0");
    return { t: `${mm}:${ss}`, title: sentences[idx].slice(0, 42) + (sentences[idx].length > 42 ? "…" : ""), score: 88 + ((k * 7) % 11) };
  });
  const keywords = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
  const reading = `${sentences.length} စာကြောင်း · ${words.length} လုံး · ~${Math.max(1, Math.round(words.length / 150))} မိနစ်စာ`;
  return { bullets, chapters, keywords, reading };
}

export function toSRT(transcript: string): string {
  const sentences = splitSentences(transcript);
  return sentences.map((s, i) => {
    const st = i * 4;
    const fmt = (sec: number) => `${String(Math.floor(sec / 3600)).padStart(2, "0")}:${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")},000`;
    return `${i + 1}\n${fmt(st)} --> ${fmt(st + 3)}\n${s}\n`;
  }).join("\n");
}
