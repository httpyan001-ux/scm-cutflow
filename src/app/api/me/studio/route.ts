import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DEFAULT_PREFS, sanitizePrefs, type StudioPrefs } from "@/lib/studio-prefs";
import { eq } from "drizzle-orm";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });

export const dynamic = "force-dynamic";

function sanitizeLogo(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s === "") return "";
  if (!/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(s)) return null;
  if (s.length > 1_200_000) return null; // ~900KB binary
  return s;
}

/** GET — load the user's PRO studio overlay settings (device-independent). */
export async function GET() {
  const u = await getSessionUser();
  if (!u) return __unauth();
  const raw = (u as unknown as { studioPrefs?: unknown }).studioPrefs;
  const hasPrefs = raw && typeof raw === "object" && Object.keys(raw as object).length > 0;
  return Response.json({
    ok: true,
    isPro: u.isPro,
    logoUrl: (u as unknown as { logoUrl?: string }).logoUrl ?? "",
    prefs: hasPrefs ? sanitizePrefs(raw) : DEFAULT_PREFS,
  });
}

/** PATCH — save prefs + logo. PRO only (server-enforced). */
export async function PATCH(req: Request) {
  const u = await getSessionUser();
  if (!u) return __unauth();
  if (!u.isPro) {
    return Response.json(
      { error: "PRO_REQUIRED", message: "Studio overlay settings သည် PRO member များအတွက်သာ ဖြစ်သည်။" },
      { status: 402 }
    );
  }

  let body: { prefs?: unknown; logoUrl?: unknown } = {};
  try { body = await req.json(); } catch { return Response.json({ error: "BAD_REQUEST" }, { status: 400 }); }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  let prefs: StudioPrefs | null = null;

  if (body.prefs !== undefined) {
    prefs = sanitizePrefs(body.prefs);
    patch.studioPrefs = prefs;
  }
  if (body.logoUrl !== undefined) {
    const logo = sanitizeLogo(body.logoUrl);
    if (logo === null) {
      return Response.json({ error: "BAD_LOGO", message: "Logo မမှန်ပါ — PNG / JPG / WEBP / SVG (≤900KB) သာ။" }, { status: 400 });
    }
    patch.logoUrl = logo;
  }

  await db.update(users).set(patch).where(eq(users.id, u.id));
  const rows = await db.select().from(users).where(eq(users.id, u.id)).limit(1);
  const nu = rows[0] as typeof rows[0] & { logoUrl: string; studioPrefs: unknown };

  return Response.json({
    ok: true,
    logoUrl: nu.logoUrl ?? "",
    prefs: prefs ?? sanitizePrefs(nu.studioPrefs),
    message: "✓ Studio settings သိမ်းပြီး — ဖုန်းအားလုံးတွင် တူညီမည်။",
  });
}
