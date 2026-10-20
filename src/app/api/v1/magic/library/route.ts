import { getSessionUser } from "@/lib/auth";
import { libraryStatus } from "@/lib/magicreel";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });

export const dynamic = "force-dynamic";

/** Live status of the server clip library (FUNNY / Accident CCTV). */
export async function GET() {
  const u = await getSessionUser();
  if (!u) return __unauth();
  const status = libraryStatus();
  return Response.json({
    ok: true,
    ...status,
    note: status.categories.every((c) => c.demo)
      ? "Telegram Clip folder ထဲ clip မရှိသေးပါ — demo pool ဖြင့် စမ်းသပ်နေသည်။"
      : "ဆာဗာမှ clip များ တွေ့ရှိပြီး — generate လုပ်ရန် အဆင်သင့်။",
  });
}
