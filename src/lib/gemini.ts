/**
 * GEMINI SERVICE — thin REST wrapper around Google Generative Language API.
 * Supports multiple keys for rotation.
 */
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export function getGeminiKeys(): string[] {
  const single = process.env.GEMINI_API_KEY || "";
  const multi = process.env.GEMINI_API_KEYS || "";
  const raw = (single + "," + multi).split(",");
  const keys = raw.map(k => k.trim().replace(/^["']|["']$/g, '')).filter(k => k.length > 10);
  return [...new Set(keys)];
}

export function geminiEnabled(): boolean {
  return getGeminiKeys().length > 0;
}

export function geminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
}

export async function geminiJson<T>(prompt: string, timeoutMs = 25000): Promise<T | null> {
  const keys = getGeminiKeys();
  if (keys.length === 0) return null;

  // Shuffle keys for load balancing
  const shuffled = [...keys].sort(() => 0.5 - Math.random());

  for (const key of shuffled) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${API_BASE}/${geminiModel()}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            responseMimeType: "application/json",
          },
        }),
      });
      const data = (await res.json()) as GeminiResponse;
      if (!res.ok || data.error) {
        console.error(`[gemini] key ${key.slice(0,8)}... failed: `, data.error?.message || res.statusText);
        continue; // Try next key
      }
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
      const cleaned = text.replace(/^```(?:json)?/m, "").replace(/```$/m, "").trim();
      return JSON.parse(cleaned) as T;
    } catch (err) {
      console.error(`[gemini] key ${key.slice(0,8)}... request failed: `, (err as Error).message);
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}
