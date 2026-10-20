import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { and, eq, gte, lt, sql } from "drizzle-orm";

const sqlCount = () => sql<number>`count(*)::int`;
import { getFaction } from "./factions";
import { GPU_SPEEDUP, durationSpec, fmtDuration, ytTierFor } from "./studio";
import { shouldFallbackToVps, workerIsLive } from "./gpu-worker";
import { buildShieldPlan, scanCopyright, type ShieldLevel } from "./copyright";
import { buildCropPlan, overlaySummary, sanitizePrefs } from "./studio-prefs";
import { buildVoiceprint, synthesizeVoice, type EmotionId } from "./voiceclone";
import { buildMagicReel, type ReelCategory } from "./magicreel";

export function isGpuJob(input: Record<string, unknown> | null | undefined): boolean {
  if (!input) return false;
  return input.gpu === true || input.gpu === "true" || input.renderMode === "gpu";
}

/** Clamp a requested output length to the faction's slider range. */
export function clampTargetDuration(slug: string, raw: unknown): number | null {
  const spec = durationSpec(slug);
  if (!spec) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return spec.def;
  return Math.min(spec.max, Math.max(spec.min, Math.round(n / spec.step) * spec.step));
}

/** Processing time scales with requested output length (longer target = longer render). */
export function effectiveDuration(factionSlug: string, input?: Record<string, unknown> | null): number {
  const faction = getFaction(factionSlug);
  const base = faction?.durationSec ?? 18;
  if (factionSlug === "knowledge" && (input as Record<string, unknown> | null)?.mode === "discover-produce") {
    const sec = isGpuJob(input) ? base * GPU_SPEEDUP : base;
    return Math.max(8, Math.round(sec));
  }
  const spec = durationSpec(factionSlug);
  let sec = base;
  if (spec) {
    const target = clampTargetDuration(factionSlug, (input as Record<string, unknown> | null)?.targetDuration) ?? spec.def;
    // scale 0.7× … 1.9× of base depending on where target sits in the slider range
    const ratio = (target - spec.min) / Math.max(1, spec.max - spec.min);
    sec = base * (0.7 + ratio * 1.2);
  }
  if (isGpuJob(input)) sec = sec * GPU_SPEEDUP;
  return Math.max(6, Math.round(sec));
}

export { getSessionUser as getOrCreateDemoUser } from "./auth";

/** Daily history policy: keep only the latest N jobs of the current day. */
export const DAILY_HISTORY_LIMIT = 10;

/** Start of "today" for the app timezone (Asia/Yangon, UTC+6:30). */
export function dayStart(d: Date = new Date()): Date {
  const offsetMs = 6.5 * 3600_000;
  const local = new Date(d.getTime() + offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - offsetMs);
}
export function nextMidnight(d: Date = new Date()): Date {
  return new Date(dayStart(d).getTime() + 86400_000);
}

/** Remove every job older than today's 00:00 (Asia/Yangon) for this user. */
export async function purgeOldHistory(userId: string): Promise<number> {
  const res = await db.delete(tasks).where(and(eq(tasks.userId, userId), lt(tasks.createdAt, dayStart())));
  return (res as unknown as { rowCount?: number }).rowCount ?? 0;
}

/** Count how many jobs the user already created today. */
export async function todayJobCount(userId: string): Promise<number> {
  const rows = await db
    .select({ n: sqlCount() })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), gte(tasks.createdAt, dayStart())));
  return Number(rows[0]?.n ?? 0);
}

export function isProActive(u: { isPro: boolean; proExpiresAt: Date | null }) {
  if (!u.isPro) return false;
  if (!u.proExpiresAt) return true;
  return new Date(u.proExpiresAt) > new Date();
}

export function taskProgressFor(createdAt: Date, durationSec: number): number {
  const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000;
  if (elapsed <= 0.5) return 4;
  if (elapsed >= durationSec) return 100;
  const t = elapsed / durationSec;
  // ease-out curve 4 -> 97
  return Math.min(97, Math.round(4 + 93 * (1 - Math.pow(1 - t, 1.6))));
}

export function buildResult(factionSlug: string, input: Record<string, unknown>) {
  const faction = getFaction(factionSlug);
  const fileName = (input.fileName as string) || "ingested-media.mp4";
  const prompt = ((input.prompt as string) || (input.headline as string) || (input.url as string) || (input.ytUrl as string) || (input.query as string) || "Night forge session") as string;
  const stamp = new Date().toISOString();
  const gpu = isGpuJob(input);
  const aspect = (input.aspect as string) || "16:9";
  const targetSec = clampTargetDuration(factionSlug, input.targetDuration);
  const prefs = sanitizePrefs(input.overlayPrefs);
  const crop = buildCropPlan(aspect, prefs.org);
  const base = {
    generatedAt: stamp, fileName, prompt, faction: factionSlug, gpu,
    renderLane: gpu ? "GPU-TURBO" : "CPU-FORGE",
    aspect,
    finalAspect: crop.finalAspect,
    crop,
    overlays: overlaySummary(prefs, Boolean(input.hasLogo)),
    overlayPrefs: prefs,
    ...(targetSec ? { targetDuration: targetSec, length: fmtDuration(targetSec) } : {}),
  };

  switch (factionSlug) {
    case "recap": {
      const tgt = targetSec ?? 120;
      const n = Math.max(3, Math.min(8, Math.round(tgt / 90) + 2));
      const chapters = Array.from({ length: n }).map((_, i) => {
        const at = Math.round((i * tgt) / n);
        const titles = ["Ignition — hook & thesis", "Rising tension — data reveal", "Turning point — demo", "Deep dive — breakdown", "Counterpoint — risks", "Momentum — proof", "Payoff — results", "Outro — CTA"];
        return { t: `${String(Math.floor(at / 60)).padStart(2, "0")}:${String(at % 60).padStart(2, "0")}`, title: titles[i % titles.length], score: 92 + ((i * 3) % 8) };
      });
      const shieldLevel = ((input.shieldLevel as string) || "standard") as ShieldLevel;
      const shield = buildShieldPlan(shieldLevel, { hasMusic: true, sourceKind: "video" });
      return {
        ...base,
        shield,
        copyrightSafe: shield.safetyScore,
        chapters,
        summary: [
          `Target length locked to ${fmtDuration(tgt)} — pacing re-timed to fit exactly.`,
          `Filler & silence trimmed · ${n} chapters mapped · ${aspect} master framing.`,
          "Quotable beats flagged for Reels with Burmese captions ready.",
        ],
        highlightRail: `${fmtDuration(tgt)} · ${crop.finalAspect} master · OpenCV person-track · shield ${shield.level} (${shield.safetyScore}%)`,
        download: `recap-${fmtDuration(tgt)}-${crop.finalAspect.replace(":", "x")}.mp4`,
      };
    }
    case "reel":
      return {
        ...base,
        cuts: [
          { id: "R1", dur: "00:32", hook: "“This one trick broke my timeline…”", viral: 94, framing: "face-tracked 9:16" },
          { id: "R2", dur: "00:27", hook: "Before / After upscale reveal", viral: 91, framing: "split-screen punch" },
          { id: "R3", dur: "00:41", hook: "Silent vlog → beat-synced captions", viral: 88, framing: "center-locked" },
        ],
        captions: "Burmese word-pop + English ghost line · auto-emoji beats",
        download: `reel-pack-${Date.now()}.zip`,
      };
    case "mm-voice":
      return {
        ...base,
        voice: (input.voice as string) || "Thiri — warm female",
        transcript: prompt.slice(0, 220),
        dub: { duration: "00:47", sampleRate: "48kHz", prosody: "native MM tone-lock 99.2%", tracks: ["dry vocal", "broadcast chain", "room match"] },
        audioPeaks: [42, 68, 55, 80, 64, 92, 71, 58, 84, 66, 77, 90, 62, 74, 88, 69],
        download: `mm-voice-${Date.now()}.wav`,
      };
    case "subs":
      return {
        ...base,
        lines: [
          { t: "00:01.2", mm: "မင်္ဂလာပါ၊ ဒီဗီဒီယိုမှ ကြိုဆိုပါတယ်။", en: "Hello, welcome to this video." },
          { t: "00:05.8", mm: "နောက်ခံအသံကို အလိုအလျောက်ဖယ်ရှားပြီးပါပြီ။", en: "Background noise has been removed." },
          { t: "00:11.4", mm: "စာတန်းများသည် အသံ�caledနှင့် တိကျစွာ ကိုက်ညီသည်။", en: "Subtitles are precisely synced to speech." },
        ],
        stats: "312 cues · 99.1% alignment · Pyidaungsu-safe line-height 1.7",
        download: `subs-${Date.now()}.srt`,
      };
    case "upscale":
      return {
        ...base,
        scale: (input.scale as string) || "2X — balanced",
        metrics: { from: "1280×720", to: (input.scale as string)?.includes("4X") ? "5120×2880" : "2560×1440", psnr: "+6.4 dB", faces: "restored 14/14", denoise: "-82% grain" },
        modes: ["deblur", "relight", "skin-true"],
        download: `upscale-${Date.now()}.mp4`,
      };
    case "news":
      return {
        ...base,
        headline: (input.headline as string) || prompt,
        script: ["[ANCHOR] မင်္ဂလာပါ — သတင်းအကျဉ်း စတင်ပါပြီ။", "[B-ROLL] Night forge b-roll 00:06–00:18 with lower-third.", "[TICKER] Creator payouts +38% · Power stable · Transit open."],
        rundown: "00:00 cold open · 00:12 anchor · 00:34 b-roll · 00:52 outro + CTA",
        download: `news-${Date.now()}.mp4`,
      };
    case "url-recap":
      return {
        ...base,
        source: (input.url as string) || "https://example.com/myanmar-creator-report-2026",
        bullets: ["Thesis distilled to 3 claims with pull-quotes.", "Counterpoint preserved — no strawman.", "Narrated 62s digest + 5 chapter cards + source links."],
        readingTime: "12-min read → 62s watch",
        download: `url-digest-${Date.now()}.mp4`,
      };
    case "yt-pro": {
      const tgt = targetSec ?? 300;
      const tier = ytTierFor(tgt);
      const segs = Math.max(3, Math.min(10, Math.round(tgt / 180) + 2));
      const chapters2 = Array.from({ length: segs }).map((_, i) => {
        const at = Math.round((i * tgt) / segs);
        const notes = ["Hook audit — retention risk flagged", "Silent gap tightened −14s", "Viral spike isolated for Reel", "Mid-roll retention patch", "B-roll relight pass", "Chapter art generated", "Loudness normalised −14 LUFS", "De-ess + breath cleanup", "Cold-open rebuilt", "Outro CTA stitched"];
        return `${String(Math.floor(at / 60)).padStart(2, "0")}:${String(at % 60).padStart(2, "0")} ${notes[i % notes.length]}`;
      });
      return {
        ...base,
        source: (input.ytUrl as string) || prompt,
        tier: `${tier.name} · ${tier.badge} · ${tier.cost} CR`,
        chapters2,
        retention: { hookScore: 88 + (segs % 9), patched: `${segs * 4}s dead-air removed`, spikes: Math.max(2, Math.round(segs / 2)) },
        polish: `4K relight · ${crop.finalAspect} master (${crop.blurPad ? "blur-pad" : "native"}) · OpenCV person-track · -14 LUFS`,
        download: `ytpro-${fmtDuration(tgt)}-${crop.finalAspect.replace(":", "x")}.mp4`,
      };
    }
    case "doc-translate":
      return {
        ...base,
        pair: (input.pair as string) || "EN → MM",
        slides: [
          { n: 1, title: "အဖုံး — Cover rebuilt with Noto Myanmar", note: "Line-height 1.7, no clipping" },
          { n: 2, title: "အဓိကအချက် — Key terms with glossary popups", note: "Tables re-flowed" },
          { n: 3, title: "နိဂုံး — CTA + narration track", note: "Voiceover synced" },
        ],
        pages: "18 pages → 9 cinematic slides",
        download: `doc-slides-${Date.now()}.mp4`,
      };
    case "knowledge":
      return {
        ...base,
        entities: ["Forge Operator", "Renewal Clause §4.2", "Payout Rail", "Risk: single-point ingest"],
        qa: [
          { q: (input.query as string) || "Summarize obligations", a: "Operator must purge source after 30d; payouts settle T+2; failover ingest required." },
          { q: "Top risk?", a: "Single ingest node — recommend dual-chamber redundancy." },
        ],
        cards: "14 flashcards · 6-row timeline · mind-map JSON",
        download: `knowledge-${Date.now()}.zip`,
      };
    case "magic": {
      const reel = buildMagicReel({
        category: ((input.category as string) === "accident" ? "accident" : "funny") as ReelCategory,
        targetSeconds: Number(input.targetDuration) || 60,
        aspect,
      });
      return { ...base, ...reel, stats: `${reel.clipCount} clips · ${reel.totalSeconds}s · viral ${reel.viralScore}%` };
    }
    case "voice-clone": {
      const vp = input.sampleDuration
        ? buildVoiceprint({
            label: (input.voiceLabel as string) || "My voice",
            durationSec: Number(input.sampleDuration),
            noisy: Boolean(input.noisy),
            gender: (input.gender as string) || "neutral",
          })
        : null;
      const out = synthesizeVoice({
        script: (input.script as string) || (input.prompt as string) || "မင်္ဂလာပါ။",
        voiceName: (input.voiceName as string) || undefined,
        voiceprint: vp,
        emotion: ((input.emotion as string) || "neutral") as EmotionId,
        language: (input.language as string) || "my",
        pitch: Number(input.pitch) || 0,
        speed: Number(input.speed) || 1,
      });
      return {
        ...base,
        ...out,
        summary: [
          `Voiceprint ${vp ? `${vp.quality}% fidelity · ${vp.durationSec}s sample` : "built-in vault voice"} · tone-lock ${out.toneLock}`,
          `${out.lines.length} lines · ${out.totalSeconds}s · ${out.sampleRate} · ${out.loudness}`,
          `Emotion: ${out.emotion} · stems: ${out.stems.join(" · ")}`,
        ],
        stats: `${out.lines.length} lines · ${out.totalSeconds}s · tone-lock ${out.toneLock}`,
      };
    }
    case "copyright": {
      const lvl = ((input.shieldLevel as string) || "standard") as ShieldLevel;
      const report = scanCopyright({
        shieldLevel: lvl,
        hasMusic: input.hasMusic !== false,
        hasCommentary: Boolean(input.hasCommentary),
        hasAttribution: Boolean(input.hasAttribution),
        longestClipSec: Number(input.longestClipSec) || undefined,
        totalSec: Number(input.totalSec) || Number(input.targetDuration) || undefined,
        voiceReplaced: Boolean(input.voiceReplaced),
        logoRemoved: Boolean(input.logoRemoved),
        title: (input.title as string) || (input.fileName as string),
      });
      return {
        ...base,
        report,
        scanVerdict: report.verdict,
        overall: report.overall,
        entities: report.platforms.map((p) => `${p.name} ${p.score}%`),
        summary: report.fixes.slice(0, 4).map((f) => f.title),
        stats: `${report.signals.length} signals · ${report.verdict} · ${report.overall}% safe · ${report.fingerprint}`,
        download: `copyright-scan-${report.fingerprint}.json`,
      };
    }
    default:
      return { ...base, note: "Forged in cutflow core.", download: `forge-${Date.now()}.mp4` };
  }
}

export async function refreshTaskStatus(taskId: string) {
  const rows = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  const task = rows[0];
  if (!task) return null;
  if (task.status === "completed" || task.status === "failed") return task;

  // --- GPU TURBO lane: a Google Colab T4 node owns the progress ---
  if (task.runner === "colab") {
    if (workerIsLive(task)) return task;              // worker is driving it live
    if (!shouldFallbackToVps(task)) return task;      // still inside the claim window
    // nobody picked it up (or the node died) → VPS finishes it locally
    await db
      .update(tasks)
      .set({ runner: "vps", workerId: null, stage: "VPS FALLBACK", updatedAt: new Date() })
      .where(eq(tasks.id, taskId));
    task.runner = "vps";
  }

  const dur = effectiveDuration(task.faction, (task.inputPayload as Record<string, unknown>) ?? {});
  const created = new Date(task.createdAt as unknown as string);
  const elapsed = (Date.now() - created.getTime()) / 1000;
  if (elapsed >= dur) {
    // Pre-computed payloads (e.g. KNOWLEDGE discover→produce) are preserved as-is.
    const pre = (task.resultPayload ?? {}) as Record<string, unknown>;
    const result = Object.keys(pre).length > 0 ? pre : buildResult(task.faction, (task.inputPayload as Record<string, unknown>) ?? {});
    await db.update(tasks).set({ status: "completed", progress: 100, resultPayload: result, updatedAt: new Date() }).where(eq(tasks.id, taskId));
    const r2 = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    return r2[0];
  } else {
    const p = taskProgressFor(created, dur);
    await db.update(tasks).set({ status: elapsed > 1.2 ? "processing" : "queued", progress: p, updatedAt: new Date() }).where(eq(tasks.id, taskId));
    const r2 = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    return r2[0];
  }
}
