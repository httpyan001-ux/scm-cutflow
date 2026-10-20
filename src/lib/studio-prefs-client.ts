/* Client-safe re-exports + helpers (no server-only imports). */
export type { XY, SubtitlePrefs, LogoPrefs, TitlePrefs, TickerPrefs, StudioPrefs, CropPlan } from "./studio-prefs";
export { DEFAULT_PREFS, TICKER_MAX, buildCropPlan, overlaySummary } from "./studio-prefs";

/** Aspect id → preview box dimensions. */
export function aspectBox(id: string): { w: number; h: number } {
  switch (id) {
    case "9:16": return { w: 9, h: 16 };
    case "1:1": return { w: 1, h: 1 };
    case "3:4": return { w: 3, h: 4 };
    case "4:3": return { w: 4, h: 3 };
    default: return { w: 16, h: 9 };
  }
}
