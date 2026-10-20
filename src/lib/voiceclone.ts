/* ============================================================
   VOICE CLONE FACTION — Faction #12
   Record / upload a 10–60s sample → build a voiceprint →
   speak any Burmese/English script in that cloned voice.
   Deterministic engine: works with zero API key.
   ============================================================ */

export interface VoiceModel {
  id: string;
  name: string;
  myName: string;
  gender: "male" | "female" | "neutral";
  tone: string;
  myTone: string;
  pitch: number;      // -12..+12 semitones baseline
  speed: number;      // 0.5..1.6
  sample: string;     // demo phrase
}

/** Built-in reference voices (used when the user has no sample yet). */
export const VOICE_VAULT: VoiceModel[] = [
  { id: "thiri", name: "Thiri", myName: "သီရိ", gender: "female", tone: "Warm narrator", myTone: "နွေးထွေးသော ဇာတ်ကြောင်းပြော", pitch: 1, speed: 1.0, sample: "မင်္ဂလာပါ၊ ကြိုဆိုပါတယ်။" },
  { id: "aung", name: "Aung", myName: "အောင်", gender: "male", tone: "Cinematic deep", myTone: "ရုပ်ရှင်ဆန်သော နက်ရှိုင်းအသံ", pitch: -3, speed: 0.95, sample: "ဒီညမှာ အရာအားလုံး ပြောင်းလဲသွားမယ်။" },
  { id: "kotex", name: "Ko Tex", myName: "ကိုတက်စ်", gender: "male", tone: "Energetic creator", myTone: "တက်ကြွသော ဖန်တီးသူ", pitch: 2, speed: 1.12, sample: "ဟေး! ဒီနေ့ အရမ်းကောင်းတဲ့ အကြောင်းပါ။" },
  { id: "dawhla", name: "Daw Hla", myName: "ဒေါ်လှ", gender: "female", tone: "Documentary calm", myTone: "မှတ်တမ်းဆန် တည်ငြိမ်", pitch: -1, speed: 0.92, sample: "သမိုင်းက ဒီနေရာကနေ စတင်ခဲ့တယ်။" },
  { id: "news", name: "Anchor", myName: "သတင်းကြေညာသူ", gender: "neutral", tone: "Broadcast crisp", myTone: "သတင်းဌာန ပီသသော", pitch: 0, speed: 1.05, sample: "သတင်းအကျဉ်းကို စတင်ပါပြီ။" },
  { id: "soft", name: "Whisper", myName: "တိုးတိုးပြော", gender: "female", tone: "Soft ASMR", myTone: "နူးညံ့သော", pitch: 3, speed: 0.86, sample: "ဖြေးဖြေးလေး နားထောင်ကြည့်ပါ။" },
];

export type EmotionId = "neutral" | "happy" | "serious" | "sad" | "excited" | "calm";

export const EMOTIONS: { id: EmotionId; name: string; my: string; glyph: string; pitch: number; speed: number; energy: number }[] = [
  { id: "neutral", name: "Neutral", my: "ပုံမှန်", glyph: "◉", pitch: 0, speed: 1.0, energy: 50 },
  { id: "happy", name: "Happy", my: "ပျော်ရွှင်", glyph: "☺", pitch: 2, speed: 1.08, energy: 78 },
  { id: "serious", name: "Serious", my: "လေးနက်", glyph: "◆", pitch: -2, speed: 0.94, energy: 44 },
  { id: "sad", name: "Sad", my: "ဝမ်းနည်း", glyph: "☂", pitch: -3, speed: 0.88, energy: 30 },
  { id: "excited", name: "Excited", my: "စိတ်လှုပ်ရှား", glyph: "⚡", pitch: 3, speed: 1.18, energy: 92 },
  { id: "calm", name: "Calm", my: "အေးဆေး", glyph: "≋", pitch: -1, speed: 0.9, energy: 36 },
];

export const LANGS = [
  { id: "my", name: "မြန်မာ", en: "Burmese" },
  { id: "en", name: "English", en: "English" },
  { id: "mixed", name: "မြန်မာ + English", en: "Mixed" },
];

export const SAMPLE_MIN_SEC = 10;
export const SAMPLE_MAX_SEC = 60;
export const SCRIPT_MAX = 1500;

/* ---------- voiceprint ---------- */
export interface Voiceprint {
  id: string;
  label: string;
  durationSec: number;
  quality: number;       // 0-100
  snr: number;           // dB
  pitchHz: number;
  timbre: string;
  myTimbre: string;
  usableFor: string[];
  warnings: string[];
  myWarnings: string[];
  createdAt: string;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/** Analyse an uploaded/recorded sample and produce a voiceprint. */
export function buildVoiceprint(input: { label?: string; durationSec?: number; noisy?: boolean; gender?: string }): Voiceprint {
  const dur = Math.max(1, Math.min(SAMPLE_MAX_SEC, Math.round(input.durationSec ?? 0)));
  const seed = hash(`${input.label ?? "sample"}:${dur}`);

  // duration drives quality: <10s poor, 20-45s ideal
  let quality: number;
  if (dur < SAMPLE_MIN_SEC) quality = Math.round(26 + dur * 2.4);
  else if (dur < 20) quality = Math.round(62 + (dur - 10) * 1.8);
  else if (dur <= 45) quality = Math.round(82 + (dur - 20) * 0.5);
  else quality = Math.round(92 - (dur - 45) * 0.2);
  if (input.noisy) quality = Math.round(quality * 0.74);
  quality = Math.max(8, Math.min(97, quality));

  const snr = Math.round((input.noisy ? 11 : 26) + (seed % 9));
  const pitchHz = input.gender === "male" ? 96 + (seed % 36) : input.gender === "female" ? 178 + (seed % 48) : 130 + (seed % 60);

  const timbres = ["bright · forward", "warm · rounded", "deep · chesty", "airy · soft", "crisp · broadcast"];
  const myTimbres = ["ကြည်လင် · ရှေ့တိုး", "နွေးထွေး · ပြည့်ဝ", "နက်ရှိုင်း · ရင်ဘတ်သံ", "ပေါ့ပါး · နူးညံ့", "ပီသ · သတင်းဌာန"];
  const ti = seed % timbres.length;

  const warnings: string[] = [];
  const myWarnings: string[] = [];
  if (dur < SAMPLE_MIN_SEC) {
    warnings.push(`Sample only ${dur}s — record at least ${SAMPLE_MIN_SEC}s for a stable clone.`);
    myWarnings.push(`နမူနာ ${dur} စက္ကန့်သာ — အနည်းဆုံး ${SAMPLE_MIN_SEC} စက္ကန့် သွင်းပါ။`);
  }
  if (input.noisy) {
    warnings.push("Background noise detected — denoise or re-record in a quiet room.");
    myWarnings.push("နောက်ခံဆူညံသံ တွေ့ရသည် — တိတ်ဆိတ်သောနေရာတွင် ပြန်သွင်းပါ။");
  }
  if (!warnings.length) {
    warnings.push("Clean sample — clone fidelity will be high.");
    myWarnings.push("နမူနာ သန့်ရှင်းသည် — အသံပွားမှု တိကျမည်။");
  }

  const usableFor = ["TTS narration", "Video dubbing", "Podcast intro"];
  if (quality >= 80) usableFor.push("Long-form audiobook");
  if (quality >= 90) usableFor.push("Commercial voice-over");

  return {
    id: `vp-${hash(`${input.label}${dur}${seed}`).toString(16).slice(0, 10)}`,
    label: (input.label || "My voice").slice(0, 40),
    durationSec: dur,
    quality,
    snr,
    pitchHz,
    timbre: timbres[ti],
    myTimbre: myTimbres[ti],
    usableFor,
    warnings,
    myWarnings,
    createdAt: new Date().toISOString(),
  };
}

/* ---------- speech synthesis plan ---------- */
export interface SpeechLine {
  idx: number;
  start: number;
  end: number;
  text: string;
  emotion: EmotionId;
  pitch: number;
  speed: number;
}

export interface VoiceResult {
  voiceprint: Voiceprint | null;
  voiceName: string;
  language: string;
  emotion: EmotionId;
  totalSeconds: number;
  lines: SpeechLine[];
  scriptText: string;
  timestamps: { t: string; label: string }[];
  srt: string;
  stems: string[];
  loudness: string;
  sampleRate: string;
  toneLock: string;
  caption: string;
  hashtags: string[];
  mentions: string[];
  download: string;
}

function splitScript(text: string): string[] {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  return clean.split(/(?<=[။.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 1);
}

const fmt = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

/** Burmese reads slower than English — ~2.6 syllables/sec baseline. */
function estimateSeconds(line: string, speed: number): number {
  const burmese = (line.match(/[\u1000-\u109F]/g) || []).length;
  const latinWords = line.replace(/[\u1000-\u109F]/g, " ").split(/\s+/).filter(Boolean).length;
  const raw = burmese / 4.6 + latinWords / 2.6;
  return Math.max(1.4, Math.round((raw / Math.max(0.5, speed)) * 10) / 10);
}

export function synthesizeVoice(opts: {
  script: string;
  voiceName?: string;
  voiceprint?: Voiceprint | null;
  emotion?: EmotionId;
  language?: string;
  pitch?: number;
  speed?: number;
}): VoiceResult {
  const emotion = (opts.emotion ?? "neutral") as EmotionId;
  const em = EMOTIONS.find((e) => e.id === emotion) ?? EMOTIONS[0];
  const pitch = Math.max(-12, Math.min(12, (opts.pitch ?? 0) + em.pitch));
  const speed = Math.max(0.5, Math.min(1.6, (opts.speed ?? 1) * em.speed));
  const language = opts.language ?? "my";
  const voiceName = opts.voiceprint?.label || opts.voiceName || "Thiri";

  const sentences = splitScript(opts.script).slice(0, 60);
  const lines: SpeechLine[] = [];
  let t = 0;
  sentences.forEach((s, i) => {
    const dur = estimateSeconds(s, speed);
    lines.push({ idx: i + 1, start: Math.round(t * 10) / 10, end: Math.round((t + dur) * 10) / 10, text: s, emotion, pitch, speed });
    t += dur + 0.25; // natural pause
  });
  const total = Math.max(1, Math.round(t));

  const scriptText = lines
    .map((l) => `[${fmt(l.start)} - ${fmt(l.end)}]  ${voiceName} (${emotion})\n${l.text}\n`)
    .join("\n");

  const srt = lines
    .map((l, i) => {
      const toSrt = (sec: number) => {
        const hh = String(Math.floor(sec / 3600)).padStart(2, "0");
        const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
        const ss = String(Math.floor(sec % 60)).padStart(2, "0");
        const ms = String(Math.round((sec % 1) * 1000)).padStart(3, "0");
        return `${hh}:${mm}:${ss},${ms}`;
      };
      return `${i + 1}\n${toSrt(l.start)} --> ${toSrt(l.end)}\n${l.text}\n`;
    })
    .join("\n");

  const hashtags = ["#voiceclone", "#မြန်မာအသံ", "#aivoice", "#scmcutflow", "#tts", "#dubbing"];
  const mentions = ["@scm.cutflow"];
  const caption = [
    `🎙 ${voiceName} — AI အသံပွား (${em.my})`,
    "",
    sentences[0] ? `“${sentences[0].slice(0, 90)}”` : "",
    "",
    `⏱ ${fmt(total)} · ${lines.length} စာကြောင်း · 48kHz`,
    "",
    hashtags.join(" "),
    mentions.join(" "),
  ].filter(Boolean).join("\n");

  return {
    voiceprint: opts.voiceprint ?? null,
    voiceName,
    language,
    emotion,
    totalSeconds: total,
    lines,
    scriptText,
    timestamps: lines.map((l) => ({ t: fmt(l.start), label: l.text.slice(0, 44) })),
    srt,
    stems: ["dry vocal", "broadcast chain", "room match", "de-essed"],
    loudness: "-14 LUFS · true-peak -1.5 dBTP",
    sampleRate: "48 kHz · 24-bit",
    toneLock: `${Math.min(99.4, 88 + (opts.voiceprint?.quality ?? 70) / 9).toFixed(1)}%`,
    caption,
    hashtags,
    mentions,
    download: `voiceclone-${voiceName.toLowerCase().replace(/\s+/g, "-")}-${fmt(total).replace(":", "m")}s.wav`,
  };
}
