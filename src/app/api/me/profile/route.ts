import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser, publicUser, validateUsername } from "@/lib/auth";
import { eq } from "drizzle-orm";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });

export const dynamic = "force-dynamic";

function sanitizeHex(c: unknown, fallback: string): string {
  if (typeof c !== "string") return fallback;
  const t = c.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(t)) return t;
  if (/^#[0-9a-fA-F]{3}$/.test(t)) return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`;
  return fallback;
}

/** Accept only small inline images (data URL, <= ~1.4MB payload). */
function sanitizeImage(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s === "") return "";
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s)) return null;
  if (s.length > 1_900_000) return null;
  return s;
}

export async function GET() {
  const u = await getSessionUser();
  if (!u) return __unauth();
  return Response.json({ user: publicUser(u) });
}

export async function PATCH(req: Request) {
  const u = await getSessionUser();
  if (!u) return __unauth();

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return Response.json({ error: "BAD_REQUEST" }, { status: 400 }); }

  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.displayName === "string" && body.displayName.trim().length > 0 && body.displayName.trim().length <= 40) {
    patch.displayName = body.displayName.trim();
  }
  if (typeof body.username === "string" && body.username.trim() && body.username.trim() !== u.username) {
    const err = validateUsername(body.username);
    if (err) return Response.json({ error: "BAD_USERNAME", message: err }, { status: 400 });
    const dup = await db.select({ id: users.id }).from(users).where(eq(users.username, body.username.trim())).limit(1);
    if (dup[0]) return Response.json({ error: "USERNAME_TAKEN", message: "ဤ USERNAME ကို သုံးပြီးသား။" }, { status: 409 });
    patch.username = body.username.trim();
  }
  if (typeof body.avatar === "string" && body.avatar.length <= 8) patch.avatar = body.avatar;
  if (typeof body.background === "string" && /^[a-z0-9-]{2,20}$/.test(body.background)) patch.background = body.background;
  if (body.themePrimary !== undefined) patch.themePrimary = sanitizeHex(body.themePrimary, "#00e5ff");
  if (body.themeSecondary !== undefined) patch.themeSecondary = sanitizeHex(body.themeSecondary, "#ff2e4c");

  if (body.photoUrl !== undefined) {
    const img = sanitizeImage(body.photoUrl);
    if (img === null) return Response.json({ error: "BAD_IMAGE", message: "ပရိုဖိုင်ပုံ မမှန်ပါ — PNG/JPG/WEBP (≤1.4MB) သာ။" }, { status: 400 });
    patch.photoUrl = img;
  }
  if (body.backgroundUrl !== undefined) {
    const img = sanitizeImage(body.backgroundUrl);
    if (img === null) return Response.json({ error: "BAD_IMAGE", message: "နောက်ခံပုံ မမှန်ပါ — PNG/JPG/WEBP (≤1.4MB) သာ။" }, { status: 400 });
    patch.backgroundUrl = img;
  }

  if (typeof body.aiApiKey === "string" && body.aiApiKey.length <= 300) patch.aiApiKey = body.aiApiKey.trim();
  if (typeof body.aiProvider === "string" && ["auto", "openai", "offline"].includes(body.aiProvider)) patch.aiProvider = body.aiProvider;

  await db.update(users).set(patch).where(eq(users.id, u.id));
  const rows = await db.select().from(users).where(eq(users.id, u.id)).limit(1);
  return Response.json({ ok: true, user: publicUser(rows[0]) });
}
