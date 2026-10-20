import { getSessionUser, publicUser } from "@/lib/auth";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });


export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getSessionUser();
  if (!u) return __unauth();
  return Response.json({ user: publicUser(u) });
}
