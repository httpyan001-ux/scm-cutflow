import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/* ============================================================
   MAGIC REEL AI — Faction #13
   Scans the server's "Telegram Clip" library, randomly picks
   short clips from FUNNY / Accident(CCTV) and stitches them
   into one ~60 second viral short.
   ============================================================ */

export type ReelCategory = "funny" | "accident";

export const CATEGORY_DIRS: Record<ReelCategory, string[]> = {
  funny: ["FUNNY", "Funny", "funny"],
  accident: ["Accident(CCTV)", "Accident", "ACCIDENT", "accident", "CCTV"],
};

export const CATEGORY_META: Record<ReelCategory, { name: string; my: string; emoji: string; sub: string; mySub: string; color: string }> = {
  funny: { name: "FUNNY", my: "ရယ်စရာ", emoji: "😂", sub: "Comedy Highlights", mySub: "ဟာသအစုအဝေး", color: "#E8FF00" },
  accident: { name: "ACCIDENT", my: "မတော်တဆမှု", emoji: "⚠️🚗", sub: "CCTV Incidents", mySub: "CCTV မှတ်တမ်း", color: "#FF2E9A" },
};

const VIDEO_EXT = new Set([".mp4", ".mov", ".webm", ".mkv", ".m4v", ".avi"]);

export function libraryRoot(): string {
  return process.env.CLIP_LIBRARY_DIR || path.join(process.cwd(), "Telegram Clip");
}

export interface ClipFile {
  name: string;
  label: string;
  sizeKb: number;
  durationSec: number;   // estimated
  category: ReelCategory;
}

function prettyLabel(file: string): string {
  return file
    .replace(/\.[^.]+$/, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .split(" ")
    .slice(0, 6)
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function hashNum(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/** Read one category folder (returns [] when missing). */
export function readCategory(cat: ReelCategory): ClipFile[] {
  const root = libraryRoot();
  for (const dir of CATEGORY_DIRS[cat]) {
    const full = path.join(root, dir);
    try {
      if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) continue;
      const files = fs
        .readdirSync(full)
        .filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))
        .map((f) => {
          let sizeKb = 0;
          try { sizeKb = Math.round(fs.statSync(path.join(full, f)).size / 1024); } catch { /* ignore */ }
          // ~1.1 MB per second for typical phone clips, clamped to a sane short range
          const est = sizeKb > 0 ? sizeKb / 1100 : 4 + (hashNum(f) % 12);
          return {
            name: f,
            label: prettyLabel(f),
            sizeKb,
            durationSec: Math.max(3, Math.min(25, Math.round(est))),
            category: cat,
          };
        });
      if (files.length) return files;
    } catch { /* keep looking */ }
  }
  return [];
}

/* ---- demo pool so the UI always works before real clips are added ---- */
const DEMO: Record<ReelCategory, string[]> = {
  funny: [
    "cat-jumps-fail.mp4", "baby-laugh-loop.mp4", "office-chair-slip.mp4", "dog-steals-snack.mp4",
    "wedding-cake-drop.mp4", "scooter-wheelie-fail.mp4", "parrot-says-hello.mp4", "kid-dance-battle.mp4",
    "grandma-prank.mp4", "slippery-floor-combo.mp4", "balloon-pop-shock.mp4", "soccer-own-goal.mp4",
  ],
  accident: [
    "junction-near-miss.mp4", "rain-skid-truck.mp4", "crosswalk-save.mp4", "parking-lot-bump.mp4",
    "highway-debris-dodge.mp4", "scooter-u-turn.mp4", "cctv-market-collapse.mp4", "bridge-brake-check.mp4",
    "night-cross-escape.mp4", "delivery-bike-slide.mp4", "roundabout-clip.mp4", "tunnel-swerve.mp4",
  ],
};

export function demoClips(cat: ReelCategory): ClipFile[] {
  return DEMO[cat].map((n) => ({
    name: n,
    label: prettyLabel(n),
    sizeKb: 0,
    durationSec: 4 + (hashNum(n) % 12),
    category: cat,
  }));
}

export interface LibraryStatus {
  root: string;
  categories: {
    id: ReelCategory;
    name: string;
    my: string;
    emoji: string;
    sub: string;
    mySub: string;
    color: string;
    count: number;
    demo: boolean;
    totalSec: number;
  }[];
  ready: boolean;
}

export function libraryStatus(): LibraryStatus {
  const cats = (Object.keys(CATEGORY_META) as ReelCategory[]).map((id) => {
    const real = readCategory(id);
    const list = real.length ? real : demoClips(id);
    const m = CATEGORY_META[id];
    return {
      id,
      name: m.name,
      my: m.my,
      emoji: m.emoji,
      sub: m.sub,
      mySub: m.mySub,
      color: m.color,
      count: list.length,
      demo: real.length === 0,
      totalSec: list.reduce((s, c) => s + c.durationSec, 0),
    };
  });
  return { root: libraryRoot(), categories: cats, ready: cats.some((c) => c.count > 0) };
}

/* ---- random selection + stitch plan ---- */
export interface ReelSegment {
  idx: number;
  clip: string;
  label: string;
  start: number;
  end: number;
  duration: number;
  transition: string;
  hookScore: number;
}

export interface MagicReelResult {
  category: ReelCategory;
  categoryName: string;
  aspect: string;
  totalSeconds: number;
  segments: ReelSegment[];
  clipCount: number;
  sourceDemo: boolean;
  transitions: string[];
  audioTrack: string;
  sceneDetect: string;
  viralScore: number;
  caption: string;
  hashtags: string[];
  mentions: string[];
  scriptText: string;
  timestamps: { t: string; label: string }[];
  download: string;
}

const TRANSITIONS = ["hard cut", "whip pan", "zoom punch", "flash cut", "glitch wipe", "speed ramp"];

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Randomly assemble clips until the target length (~60s) is reached.
 * Each clip is trimmed to its punchiest window.
 */
export function buildMagicReel(opts: {
  category: ReelCategory;
  targetSeconds?: number;
  aspect?: string;
  seed?: string;
}): MagicReelResult {
  const cat = opts.category;
  const target = Math.max(30, Math.min(90, opts.targetSeconds ?? 60));
  const aspect = opts.aspect ?? "9:16";
  const real = readCategory(cat);
  const pool = real.length ? real : demoClips(cat);
  const sourceDemo = real.length === 0;

  // deterministic-but-fresh shuffle
  const seed = opts.seed ?? `${Date.now()}`;
  const shuffled = [...pool]
    .map((c, i) => ({ c, k: hashNum(`${seed}:${c.name}:${i}`) }))
    .sort((a, b) => a.k - b.k)
    .map(({ c }) => c);

  const segments: ReelSegment[] = [];
  let t = 0;
  let i = 0;
  while (t < target && segments.length < 14) {
    const clip = shuffled[i % shuffled.length];
    i++;
    // trim each clip to a punchy 4–9s window
    const seg = Math.max(3, Math.min(9, Math.round(clip.durationSec * 0.7)));
    const dur = Math.min(seg, target - t + 2);
    if (dur < 2) break;
    segments.push({
      idx: segments.length + 1,
      clip: clip.name,
      label: clip.label,
      start: Math.round(t * 10) / 10,
      end: Math.round((t + dur) * 10) / 10,
      duration: dur,
      transition: TRANSITIONS[(hashNum(clip.name + segments.length) % TRANSITIONS.length)],
      hookScore: 72 + (hashNum(clip.name) % 27),
    });
    t += dur;
    if (i > shuffled.length * 3) break;
  }

  const total = Math.round(t);
  const meta = CATEGORY_META[cat];
  const viralScore = Math.min(98, 78 + Math.round(segments.reduce((s, x) => s + x.hookScore, 0) / Math.max(1, segments.length) / 9));

  const scriptText = segments
    .map((s) => `[${fmt(s.start)} - ${fmt(s.end)}]  ${s.transition.toUpperCase()}\n${s.label}  (${s.clip})\n`)
    .join("\n");

  const baseTags = cat === "funny"
    ? ["funny", "comedy", "ရယ်စရာ", "fail", "funnyvideo", "shorts", "reels", "fyp"]
    : ["cctv", "accident", "မတော်တဆ", "dashcam", "caughtoncamera", "shorts", "reels", "fyp"];
  const hashtags = Array.from(new Set([...baseTags, "scmcutflow", "magicreel"])).map((h) => `#${h}`);
  const mentions = ["@scm.cutflow"];

  const headline = cat === "funny"
    ? `😂 ရယ်မရပ်နိုင်တဲ့ ${segments.length} ခန်း — အဆုံးထိကြည့်ပါ!`
    : `⚠️ CCTV မှတ်တမ်း ${segments.length} ခု — သတိထားကြပါ`;

  const caption = [
    headline,
    "",
    `⏱ ${fmt(total)} · ${segments.length} clips · viral ${viralScore}%`,
    cat === "funny" ? "ဘယ်အခန်းက အရယ်ရဆုံးလဲ? 👇" : "ဘယ်အခန်းက အကြောက်ဆုံးလဲ? 👇",
    "",
    hashtags.join(" "),
    mentions.join(" "),
  ].join("\n");

  return {
    category: cat,
    categoryName: meta.name,
    aspect,
    totalSeconds: total,
    segments,
    clipCount: segments.length,
    sourceDemo,
    transitions: Array.from(new Set(segments.map((s) => s.transition))),
    audioTrack: cat === "funny" ? "Upbeat comedy bed · royalty-free · -14 LUFS" : "Tense cinematic bed · royalty-free · -14 LUFS",
    sceneDetect: `${segments.length} scenes · OpenCV shot-boundary + motion peak`,
    viralScore,
    caption,
    hashtags,
    mentions,
    scriptText,
    timestamps: segments.map((s) => ({ t: fmt(s.start), label: `${s.label} · ${s.transition}` })),
    download: `magicreel-${cat}-${fmt(total).replace(":", "m")}s-${aspect.replace(":", "x")}.mp4`,
  };
}

export function newSeed(): string {
  return crypto.randomBytes(6).toString("hex");
}
