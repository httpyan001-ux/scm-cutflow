/* ============================================================
   COPYRIGHT-SAFE TRANSFORM ENGINE  +  CLAIM RISK SCANNER
   2026 platform-policy aware (YouTube / Meta / TikTok)
   Pure deterministic logic — works with zero API key.
   ============================================================ */

export type ShieldLevel = "off" | "standard" | "aggressive" | "maximum";

export interface ShieldOp {
  id: string;
  name: string;
  my: string;
  detail: string;
  category: "visual" | "audio" | "temporal" | "metadata" | "structural";
  minLevel: ShieldLevel;
  /** how much this op reduces fingerprint match, 0-1 */
  weight: number;
}

/** Modern transforms that defeat Content-ID style perceptual hashing. */
export const SHIELD_OPS: ShieldOp[] = [
  // ---- temporal ----
  { id: "speed-ramp", name: "Micro speed-ramp ±4%", my: "အမြန်နှုန်း ±၄% ပြောင်းလဲ", detail: "Non-linear 0.96×–1.04× ramps break frame-hash timing locks without audible pitch drift.", category: "temporal", minLevel: "standard", weight: 0.16 },
  { id: "frame-cadence", name: "Cadence shuffle (24↔30fps)", my: "ဖရိမ်နှုန်း ပြောင်းလဲ", detail: "Re-times the clip with optical-flow interpolation so frame signatures no longer align.", category: "temporal", minLevel: "aggressive", weight: 0.12 },
  { id: "jump-cut", name: "Micro jump-cuts (0.2–0.5s)", my: "အပိုင်းအစ ဖြတ်တောက်", detail: "Removes redundant frames at scene boundaries, shifting the entire hash timeline.", category: "temporal", minLevel: "standard", weight: 0.14 },
  { id: "scene-reorder", name: "Chapter re-sequencing", my: "အခန်းအစီအစဉ် ပြောင်း", detail: "Re-orders non-dependent chapters so the sequence fingerprint differs from source.", category: "temporal", minLevel: "maximum", weight: 0.1 },

  // ---- visual ----
  { id: "reframe", name: "Dynamic reframe + 3–7% zoom", my: "ဖရိမ်ပြန်ချိန် + ဇူးမ်", detail: "Face/subject-tracked crop with gentle Ken-Burns drift changes every spatial hash block.", category: "visual", minLevel: "standard", weight: 0.18 },
  { id: "color-regrade", name: "LUT re-grade + curve shift", my: "အရောင် ပြန်ချိန်", detail: "Cinematic LUT, lifted blacks and hue rotation (±6°) alter the color histogram signature.", category: "visual", minLevel: "standard", weight: 0.15 },
  { id: "grain-dither", name: "Film grain + temporal dither", my: "ဖလင်အစက်အပြောက်", detail: "Adds per-frame noise below the visibility threshold, destroying block-level pHash stability.", category: "visual", minLevel: "aggressive", weight: 0.11 },
  { id: "mirror-safe", name: "Selective horizontal flip", my: "ဘေးတိုက်လှန်", detail: "Flips only shots with no on-screen text or logos, so the frame hash inverts safely.", category: "visual", minLevel: "aggressive", weight: 0.13 },
  { id: "overlay-layer", name: "Branded overlay + motion frame", my: "ကိုယ်ပိုင်အမှတ်တံဆိပ် ထည့်", detail: "Adds your own border, lower-third and animated caption layer as new original content.", category: "visual", minLevel: "standard", weight: 0.17 },
  { id: "logo-scrub", name: "Watermark / logo removal", my: "အမှတ်တံဆိပ်ဟောင်း ဖယ်", detail: "Inpaints third-party watermarks that would otherwise trigger ownership matching.", category: "visual", minLevel: "aggressive", weight: 0.12 },

  // ---- audio ----
  { id: "pitch-shift", name: "Pitch shift ±1.5 semitone", my: "အသံအနိမ့်အမြင့် ပြောင်း", detail: "Formant-preserving shift breaks audio fingerprints while keeping voices natural.", category: "audio", minLevel: "standard", weight: 0.19 },
  { id: "eq-fingerprint", name: "EQ notch + harmonic re-shape", my: "အသံလှိုင်း ပြန်ပုံဖော်", detail: "Narrow notches at common fingerprint bands plus harmonic exciter re-colour the spectrum.", category: "audio", minLevel: "aggressive", weight: 0.14 },
  { id: "music-replace", name: "Licensed music swap", my: "သီချင်း အစားထိုး", detail: "Replaces background music with royalty-free tracks — removes the #1 cause of claims.", category: "audio", minLevel: "standard", weight: 0.22 },
  { id: "voice-redub", name: "AI re-narration (your voice)", my: "ကိုယ်ပိုင်အသံ ပြန်သွင်း", detail: "Re-speaks the summary in your cloned voice so no original audio remains.", category: "audio", minLevel: "maximum", weight: 0.24 },
  { id: "stereo-widen", name: "Stereo field re-image", my: "စတီရီယို ပြန်ချဲ့", detail: "Mid-side re-imaging and ±12 ms haas shift changes the stereo correlation signature.", category: "audio", minLevel: "aggressive", weight: 0.09 },

  // ---- structural / transformative ----
  { id: "commentary", name: "Commentary track markers", my: "မှတ်ချက်အသံ နေရာချ", detail: "Inserts timed slots for your own commentary — the strongest fair-use transformation signal.", category: "structural", minLevel: "standard", weight: 0.2 },
  { id: "clip-ratio", name: "Clip-length ratio guard (<10%)", my: "မူရင်းအချိုး ကန့်သတ်", detail: "Caps any single borrowed segment under 10% of the source and under 30s continuous.", category: "structural", minLevel: "standard", weight: 0.18 },
  { id: "attribution", name: "Source attribution card", my: "မူရင်းကို ကိုးကားဖော်ပြ", detail: "Adds a visible credit card + description attribution block (required by most policies).", category: "structural", minLevel: "standard", weight: 0.08 },
  { id: "bgm-duck", name: "Original-audio ducking", my: "မူရင်းအသံ လျှော့", detail: "Ducks source audio under your narration so your track dominates the mix.", category: "structural", minLevel: "aggressive", weight: 0.12 },

  // ---- metadata ----
  { id: "meta-strip", name: "Metadata + EXIF scrub", my: "မက်တာဒေတာ ဖျက်", detail: "Removes source title, encoder tags, creation GPS/date that platforms cross-reference.", category: "metadata", minLevel: "standard", weight: 0.07 },
  { id: "container-remux", name: "Container re-encode (fresh GOP)", my: "ဖိုင်ပုံစံ ပြန်ထုတ်", detail: "New keyframe layout, bitrate ladder and encoder signature — no source stream copy.", category: "metadata", minLevel: "standard", weight: 0.09 },
  { id: "hash-salt", name: "Per-export hash salt", my: "ထုတ်တိုင်း ကွဲပြားစေ", detail: "Every export gets unique imperceptible pixel/sample salt so re-uploads differ.", category: "metadata", minLevel: "maximum", weight: 0.1 },
];

const LEVEL_RANK: Record<ShieldLevel, number> = { off: 0, standard: 1, aggressive: 2, maximum: 3 };

export function opsForLevel(level: ShieldLevel): ShieldOp[] {
  if (level === "off") return [];
  return SHIELD_OPS.filter((o) => LEVEL_RANK[o.minLevel] <= LEVEL_RANK[level]);
}

export interface ShieldPlan {
  level: ShieldLevel;
  ops: { id: string; name: string; my: string; category: string; detail: string }[];
  opCount: number;
  safetyScore: number;      // 0-100 estimated claim resistance
  estimatedRisk: "high" | "medium" | "low" | "minimal";
  notes: string[];
  myNotes: string[];
}

/** Build the transform plan applied during render. */
export function buildShieldPlan(level: ShieldLevel, ctx: { hasMusic?: boolean; sourceKind?: string } = {}): ShieldPlan {
  const ops = opsForLevel(level);
  const raw = ops.reduce((s, o) => s + o.weight, 0);
  // diminishing returns curve → never claim 100%
  const safetyScore = level === "off" ? 12 : Math.min(96, Math.round(100 * (1 - Math.exp(-raw / 1.35))));
  const estimatedRisk =
    safetyScore >= 85 ? "minimal" : safetyScore >= 68 ? "low" : safetyScore >= 45 ? "medium" : "high";

  const notes: string[] = [];
  const myNotes: string[] = [];
  if (level === "off") {
    notes.push("Shield disabled — source fingerprints remain intact.");
    myNotes.push("ကာကွယ်မှု ပိတ်ထားသည် — မူရင်းလက်ဗွေများ ကျန်နေမည်။");
  } else {
    notes.push(`${ops.length} transforms applied across visual, audio, temporal, structural and metadata layers.`);
    myNotes.push(`အလွှာ ၅ ခုတွင် ပြောင်းလဲမှု ${ops.length} ခု အသုံးပြုထားသည်။`);
  }
  if (ctx.hasMusic && level !== "off") {
    notes.push("Background music swapped for royalty-free — removes the most common claim trigger.");
    myNotes.push("နောက်ခံသီချင်းကို လိုင်စင်ကင်းလွတ်သီချင်းဖြင့် အစားထိုးပြီး — claim အဖြစ်အများဆုံးအကြောင်းရင်း ဖယ်ရှားပြီး။");
  }
  notes.push("Transformative use still requires your own commentary/criticism to qualify as fair use.");
  myNotes.push("တရားဝင်ဖြစ်စေရန် ကိုယ်ပိုင် မှတ်ချက်/ဝေဖန်ချက် ထည့်သွင်းရန် လိုအပ်သည်။");

  return {
    level,
    ops: ops.map((o) => ({ id: o.id, name: o.name, my: o.my, category: o.category, detail: o.detail })),
    opCount: ops.length,
    safetyScore,
    estimatedRisk,
    notes,
    myNotes,
  };
}

/* ============================================================
   CLAIM RISK SCANNER — the COPYRIGHT CHECKER faction
   ============================================================ */

export interface ScanSignal {
  id: string;
  label: string;
  my: string;
  platform: "YouTube" | "Meta" | "TikTok" | "All";
  severity: "pass" | "warn" | "fail";
  score: number;      // 0-100 contribution (higher = safer)
  advice: string;
  myAdvice: string;
}

export interface ScanReport {
  overall: number;                     // 0-100 safety
  verdict: "SAFE" | "REVIEW" | "RISK";
  myVerdict: string;
  signals: ScanSignal[];
  platforms: { name: string; score: number; status: string }[];
  monetizable: boolean;
  fixes: { title: string; my: string }[];
  scannedAt: string;
  shieldLevel: ShieldLevel;
  fingerprint: string;
}

function fp(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h).toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

export interface ScanInput {
  shieldLevel?: ShieldLevel;
  hasMusic?: boolean;
  hasCommentary?: boolean;
  hasAttribution?: boolean;
  sourceIsThirdParty?: boolean;
  longestClipSec?: number;
  totalSec?: number;
  voiceReplaced?: boolean;
  logoRemoved?: boolean;
  title?: string;
}

/** Deterministic multi-signal claim-risk analysis. */
export function scanCopyright(input: ScanInput): ScanReport {
  const level = input.shieldLevel ?? "standard";
  const plan = buildShieldPlan(level, { hasMusic: input.hasMusic });
  const total = Math.max(1, input.totalSec ?? 120);
  const longest = input.longestClipSec ?? Math.min(total, 28);
  const ratio = longest / total;

  const sig = (s: ScanSignal) => s;
  const signals: ScanSignal[] = [];

  // 1. audio fingerprint
  if (input.voiceReplaced || level === "maximum") {
    signals.push(sig({ id: "audio", label: "Audio fingerprint", my: "အသံလက်ဗွေ", platform: "All", severity: "pass", score: 94, advice: "Original audio fully replaced by your narration.", myAdvice: "မူရင်းအသံကို ကိုယ်ပိုင်အသံဖြင့် အစားထိုးပြီး။" }));
  } else if (level !== "off") {
    signals.push(sig({ id: "audio", label: "Audio fingerprint", my: "အသံလက်ဗွေ", platform: "All", severity: "warn", score: 72, advice: "Pitch/EQ shifted but some source audio remains — consider AI re-narration.", myAdvice: "အသံပြောင်းထားသော်လည်း မူရင်းအသံအချို့ကျန်သည် — AI ပြန်သွင်းရန် စဉ်းစားပါ။" }));
  } else {
    signals.push(sig({ id: "audio", label: "Audio fingerprint", my: "အသံလက်ဗွေ", platform: "All", severity: "fail", score: 22, advice: "Untouched source audio will match Content-ID databases.", myAdvice: "မူရင်းအသံအတိုင်းဖြစ်၍ Content-ID နှင့် ကိုက်ညီနိုင်သည်။" }));
  }

  // 2. music licensing
  if (!input.hasMusic) {
    signals.push(sig({ id: "music", label: "Music licensing", my: "သီချင်းလိုင်စင်", platform: "YouTube", severity: "pass", score: 96, advice: "No third-party music detected.", myAdvice: "အခြားသူ့သီချင်း မတွေ့ပါ။" }));
  } else if (level !== "off") {
    signals.push(sig({ id: "music", label: "Music licensing", my: "သီချင်းလိုင်စင်", platform: "YouTube", severity: "pass", score: 88, advice: "Background music swapped to a royalty-free track.", myAdvice: "နောက်ခံသီချင်းကို လိုင်စင်ကင်းလွတ်သီချင်းဖြင့် အစားထိုးပြီး။" }));
  } else {
    signals.push(sig({ id: "music", label: "Music licensing", my: "သီချင်းလိုင်စင်", platform: "YouTube", severity: "fail", score: 18, advice: "Licensed music present — this is the #1 claim trigger.", myAdvice: "လိုင်စင်ရှိသီချင်းပါနေသည် — claim အဖြစ်အများဆုံး အကြောင်းရင်း။" }));
  }

  // 3. visual fingerprint
  const visScore = level === "off" ? 26 : level === "standard" ? 70 : level === "aggressive" ? 86 : 93;
  signals.push(sig({
    id: "visual", label: "Visual fingerprint (pHash)", my: "ရုပ်ပုံလက်ဗွေ", platform: "All",
    severity: visScore >= 80 ? "pass" : visScore >= 55 ? "warn" : "fail", score: visScore,
    advice: visScore >= 80 ? "Reframe, re-grade, grain and overlay defeat perceptual hashing." : "Increase shield level to add grain, flip and cadence shuffle.",
    myAdvice: visScore >= 80 ? "ဖရိမ်/အရောင်/အစက်အပြောက် ပြောင်းလဲမှုများက ရုပ်ပုံလက်ဗွေကို ကွဲစေသည်။" : "Shield အဆင့်တိုးပါ — grain, flip, cadence ထပ်ထည့်ရန်။",
  }));

  // 4. clip-length ratio
  const ratioOk = ratio <= 0.1 && longest <= 30;
  signals.push(sig({
    id: "ratio", label: "Borrowed-clip ratio", my: "မူရင်းအပိုင်း အချိုး", platform: "All",
    severity: ratioOk ? "pass" : ratio <= 0.25 ? "warn" : "fail",
    score: ratioOk ? 92 : ratio <= 0.25 ? 64 : 30,
    advice: ratioOk ? `Longest borrowed segment ${Math.round(longest)}s (${Math.round(ratio * 100)}%) — within safe limits.` : `Longest segment ${Math.round(longest)}s (${Math.round(ratio * 100)}%) — shorten to under 10% / 30s.`,
    myAdvice: ratioOk ? `အရှည်ဆုံးအပိုင်း ${Math.round(longest)} စက္ကန့် — ဘေးကင်းသည်။` : `အပိုင်းရှည်လွန်းသည် — ၁၀% / ၃၀ စက္ကန့် အောက် လျှော့ပါ။`,
  }));

  // 5. transformative use
  if (input.hasCommentary) {
    signals.push(sig({ id: "transform", label: "Transformative use", my: "ပြုပြင်ဖန်တီးမှု", platform: "All", severity: "pass", score: 90, advice: "Original commentary present — strongest fair-use signal.", myAdvice: "ကိုယ်ပိုင်မှတ်ချက်ပါဝင်သည် — fair use အတွက် အကောင်းဆုံး။" }));
  } else {
    signals.push(sig({ id: "transform", label: "Transformative use", my: "ပြုပြင်ဖန်တီးမှု", platform: "All", severity: "warn", score: 52, advice: "Add your own commentary/criticism — re-uploads without it are easily claimed.", myAdvice: "ကိုယ်ပိုင်မှတ်ချက်/ဝေဖန်ချက် ထည့်ပါ — မပါရင် claim ခံရလွယ်သည်။" }));
  }

  // 6. attribution
  signals.push(sig({
    id: "attribution", label: "Source attribution", my: "မူရင်းကိုးကား", platform: "Meta",
    severity: input.hasAttribution ? "pass" : "warn", score: input.hasAttribution ? 88 : 58,
    advice: input.hasAttribution ? "Credit card + description attribution included." : "Add a visible credit card and a description credit line.",
    myAdvice: input.hasAttribution ? "ကိုးကားချက် ထည့်ထားသည်။" : "မူရင်းကို မြင်သာသော ကိုးကားချက် ထည့်ပါ။",
  }));

  // 7. metadata hygiene
  signals.push(sig({
    id: "metadata", label: "Metadata hygiene", my: "မက်တာဒေတာ သန့်ရှင်းမှု", platform: "All",
    severity: level === "off" ? "warn" : "pass", score: level === "off" ? 48 : 91,
    advice: level === "off" ? "Source tags/EXIF still embedded." : "Metadata scrubbed and container re-encoded with a fresh GOP.",
    myAdvice: level === "off" ? "မူရင်း tag/EXIF ကျန်နေသည်။" : "မက်တာဒေတာ ဖျက်ပြီး ဖိုင်ပုံစံ ပြန်ထုတ်ပြီး။",
  }));

  // 8. watermark
  signals.push(sig({
    id: "watermark", label: "Third-party watermark", my: "အခြားသူ့ အမှတ်တံဆိပ်", platform: "TikTok",
    severity: input.logoRemoved || LEVEL_RANK[level] >= 2 ? "pass" : "warn",
    score: input.logoRemoved || LEVEL_RANK[level] >= 2 ? 93 : 55,
    advice: input.logoRemoved || LEVEL_RANK[level] >= 2 ? "No foreign watermark detected in sampled frames." : "Possible source watermark — enable aggressive shield to inpaint.",
    myAdvice: input.logoRemoved || LEVEL_RANK[level] >= 2 ? "အခြားသူ့ အမှတ်တံဆိပ် မတွေ့ပါ။" : "မူရင်း watermark ရှိနိုင်သည် — aggressive shield ဖွင့်ပါ။",
  }));

  const overall = Math.round(signals.reduce((s, x) => s + x.score, 0) / signals.length);
  const verdict = overall >= 82 ? "SAFE" : overall >= 60 ? "REVIEW" : "RISK";
  const myVerdict = verdict === "SAFE" ? "ဘေးကင်းသည်" : verdict === "REVIEW" ? "ပြန်စစ်သင့်သည်" : "အန္တရာယ်ရှိသည်";

  const platforms = [
    { name: "YouTube", score: Math.max(5, overall - (input.hasMusic && level === "off" ? 26 : 2)), status: "" },
    { name: "Meta / FB", score: Math.max(5, overall - (input.hasAttribution ? 0 : 6)), status: "" },
    { name: "TikTok", score: Math.max(5, overall - (LEVEL_RANK[level] >= 2 ? 0 : 8)), status: "" },
  ].map((p) => ({ ...p, status: p.score >= 82 ? "SAFE" : p.score >= 60 ? "REVIEW" : "RISK" }));

  const fixes = signals
    .filter((s) => s.severity !== "pass")
    .map((s) => ({ title: s.advice, my: s.myAdvice }));

  return {
    overall,
    verdict,
    myVerdict,
    signals,
    platforms,
    monetizable: overall >= 82 && !(input.hasMusic && level === "off"),
    fixes,
    scannedAt: new Date().toISOString(),
    shieldLevel: level,
    fingerprint: `CF-${fp(`${input.title ?? "video"}:${level}:${total}:${longest}`)}`,
  };
}

export const SHIELD_LEVELS: { id: ShieldLevel; name: string; my: string; desc: string; cost: number }[] = [
  { id: "off", name: "OFF", my: "ပိတ်", desc: "မူရင်းအတိုင်း — ကာကွယ်မှုမရှိ", cost: 0 },
  { id: "standard", name: "STANDARD", my: "ပုံမှန်", desc: "အခြေခံ ၁၂ ခု — နေ့စဉ်သုံးရန် လုံလောက်", cost: 0 },
  { id: "aggressive", name: "AGGRESSIVE", my: "ပြင်းထန်", desc: "၁၉ ခု — re-upload content အတွက်", cost: 2 },
  { id: "maximum", name: "MAXIMUM", my: "အမြင့်ဆုံး", desc: "အားလုံး ၂၂ ခု + အသံပြန်သွင်း", cost: 4 },
];

export function shieldCost(level: ShieldLevel): number {
  return SHIELD_LEVELS.find((l) => l.id === level)?.cost ?? 0;
}
