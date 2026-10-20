/* ============================================================
   PRO STUDIO OVERLAY PREFS
   Subtitle · Logo · Movie title · Ad ticker · ORG aspect mode
   Persisted per-user in DB → identical on every device.
   ============================================================ */

export interface XY { x: number; y: number } // 0-100 % of frame

export interface SubtitlePrefs {
  enabled: boolean;
  pos: XY;
  size: number;        // 12–48 px @1080 reference
  opacity: number;     // 0-100
  color: string;
  stroke: boolean;
  bg: "none" | "soft" | "solid";
  align: "left" | "center" | "right";
}

export interface LogoPrefs {
  enabled: boolean;
  pos: XY;
  scale: number;       // 4–40 % of frame width
  opacity: number;     // 0-100
  rounded: boolean;
}

export interface TitlePrefs {
  enabled: boolean;
  pos: XY;
  size: number;
  opacity: number;
  showYear: boolean;
  manual: string;      // override; empty = Gemini auto-detect
  manualYear: string;
}

export interface TickerPrefs {
  enabled: boolean;
  text: string;        // ≤300 chars
  everySec: number;    // show once per N seconds
  speed: number;       // 1-10
  color: string;
}

export interface StudioPrefs {
  subtitle: SubtitlePrefs;
  logo: LogoPrefs;
  title: TitlePrefs;
  ticker: TickerPrefs;
  org: boolean;        // true = keep chosen ratio · false = force 9:16 letterbox
  updatedAt?: string;
}

export const TICKER_MAX = 300;

export const DEFAULT_PREFS: StudioPrefs = {
  subtitle: { enabled: true, pos: { x: 50, y: 82 }, size: 26, opacity: 100, color: "#FFFFFF", stroke: true, bg: "soft", align: "center" },
  logo: { enabled: false, pos: { x: 88, y: 10 }, scale: 14, opacity: 85, rounded: true },
  title: { enabled: false, pos: { x: 50, y: 12 }, size: 30, opacity: 100, showYear: true, manual: "", manualYear: "" },
  ticker: { enabled: false, text: "", everySec: 10, speed: 5, color: "#FFD60A" },
  org: true,
};

const clamp = (n: unknown, lo: number, hi: number, def: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;
};
const hex = (v: unknown, def: string) =>
  typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : def;
const bool = (v: unknown, def: boolean) => (typeof v === "boolean" ? v : def);
const pick = <T extends string>(v: unknown, allowed: readonly T[], def: T): T =>
  (allowed as readonly string[]).includes(v as string) ? (v as T) : def;

/** Server-side sanitiser — never trust the client. */
export function sanitizePrefs(raw: unknown): StudioPrefs {
  const r = (raw ?? {}) as Record<string, Record<string, unknown>>;
  const d = DEFAULT_PREFS;
  const s = r.subtitle ?? {};
  const l = r.logo ?? {};
  const t = r.title ?? {};
  const k = r.ticker ?? {};
  const xy = (o: Record<string, unknown> | undefined, def: XY): XY => ({
    x: clamp((o?.pos as XY | undefined)?.x, 0, 100, def.x),
    y: clamp((o?.pos as XY | undefined)?.y, 0, 100, def.y),
  });

  return {
    subtitle: {
      enabled: bool(s.enabled, d.subtitle.enabled),
      pos: xy(s, d.subtitle.pos),
      size: clamp(s.size, 12, 48, d.subtitle.size),
      opacity: clamp(s.opacity, 10, 100, d.subtitle.opacity),
      color: hex(s.color, d.subtitle.color),
      stroke: bool(s.stroke, d.subtitle.stroke),
      bg: pick(s.bg, ["none", "soft", "solid"] as const, d.subtitle.bg),
      align: pick(s.align, ["left", "center", "right"] as const, d.subtitle.align),
    },
    logo: {
      enabled: bool(l.enabled, d.logo.enabled),
      pos: xy(l, d.logo.pos),
      scale: clamp(l.scale, 4, 40, d.logo.scale),
      opacity: clamp(l.opacity, 5, 100, d.logo.opacity),
      rounded: bool(l.rounded, d.logo.rounded),
    },
    title: {
      enabled: bool(t.enabled, d.title.enabled),
      pos: xy(t, d.title.pos),
      size: clamp(t.size, 14, 56, d.title.size),
      opacity: clamp(t.opacity, 10, 100, d.title.opacity),
      showYear: bool(t.showYear, d.title.showYear),
      manual: typeof t.manual === "string" ? t.manual.slice(0, 80) : "",
      manualYear: typeof t.manualYear === "string" ? t.manualYear.replace(/\D/g, "").slice(0, 4) : "",
    },
    ticker: {
      enabled: bool(k.enabled, d.ticker.enabled),
      text: typeof k.text === "string" ? k.text.slice(0, TICKER_MAX) : "",
      everySec: clamp(k.everySec, 5, 60, d.ticker.everySec),
      speed: clamp(k.speed, 1, 10, d.ticker.speed),
      color: hex(k.color, d.ticker.color),
    },
    org: bool(r.org as unknown, d.org),
    updatedAt: new Date().toISOString(),
  };
}

/* ============================================================
   ORG MODE — aspect → OpenCV crop plan
   ORG ON  : export exactly in the chosen ratio
   ORG OFF : crop to chosen ratio first, then letterbox to 9:16
             with a blurred fill (top/bottom)
   ============================================================ */

export interface CropPlan {
  requested: string;
  org: boolean;
  /** ratio the OpenCV person-tracking crop targets */
  cropTo: string;
  /** final container delivered to the user */
  finalAspect: string;
  /** add blurred bars to reach the final aspect */
  blurPad: boolean;
  tracker: "opencv-person-center";
  steps: string[];
  mySteps: string[];
}

export function buildCropPlan(requested: string, org: boolean): CropPlan {
  const steps: string[] = [];
  const mySteps: string[] = [];

  // Every faction crops with OpenCV person tracking — never a hard centre cut.
  steps.push(`OpenCV person detection → track subjects frame-by-frame`);
  mySteps.push(`OpenCV ဖြင့် လူကို ခြေရာခံ၍ ဖရိမ်တိုင်း မှတ်သား`);
  steps.push(`Smoothed centre-of-subject crop to ${requested} (no hard centre cut)`);
  mySteps.push(`လူကို အလယ်တည့်ထား၍ ${requested} သို့ ချောမွေ့စွာ crop`);

  if (org) {
    steps.push(`ORG ON → deliver master exactly in ${requested}`);
    mySteps.push(`ORG ဖွင့်ထား → ${requested} အတိအကျ ထုတ်ပေးမည်`);
    return { requested, org, cropTo: requested, finalAspect: requested, blurPad: false, tracker: "opencv-person-center", steps, mySteps };
  }

  if (requested === "9:16") {
    steps.push("ORG OFF → already 9:16, no padding needed");
    mySteps.push("ORG ပိတ်ထား → 9:16 ဖြစ်နေပြီ၊ ဖြည့်စရာမလို");
    return { requested, org, cropTo: "9:16", finalAspect: "9:16", blurPad: false, tracker: "opencv-person-center", steps, mySteps };
  }

  steps.push(`ORG OFF → blurred letterbox pad ${requested} into a 9:16 canvas (top/bottom)`);
  steps.push("Background = scaled + gaussian-blurred copy of the same frame");
  mySteps.push(`ORG ပိတ်ထား → ${requested} ကို 9:16 ထဲ ထည့်၍ အပေါ်/အောက် ဘလားဖြည့်`);
  mySteps.push("နောက်ခံ = တူညီသောဖရိမ်ကို ချဲ့ပြီး gaussian blur");

  return { requested, org, cropTo: requested, finalAspect: "9:16", blurPad: true, tracker: "opencv-person-center", steps, mySteps };
}

/** Human-readable summary for result payloads / export files. */
export function overlaySummary(p: StudioPrefs, hasLogo: boolean): string[] {
  const out: string[] = [];
  if (p.subtitle.enabled) out.push(`Subtitle @ ${Math.round(p.subtitle.pos.x)}/${Math.round(p.subtitle.pos.y)} · ${p.subtitle.size}px · ${p.subtitle.opacity}%`);
  if (p.logo.enabled && hasLogo) out.push(`Logo @ ${Math.round(p.logo.pos.x)}/${Math.round(p.logo.pos.y)} · ${p.logo.scale}% · ${p.logo.opacity}% opacity`);
  if (p.title.enabled) out.push(`Movie title${p.title.showYear ? " + year" : ""} @ ${Math.round(p.title.pos.y)}% ${p.title.manual ? `(manual: ${p.title.manual})` : "(Gemini auto-detect)"}`);
  if (p.ticker.enabled && p.ticker.text) out.push(`Ad ticker every ${p.ticker.everySec}s · ${p.ticker.text.length}/${TICKER_MAX} chars`);
  if (!out.length) out.push("No overlays enabled");
  return out;
}
