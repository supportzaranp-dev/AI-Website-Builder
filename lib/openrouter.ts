import { prisma } from "@/lib/db";

export { buildDocument } from "@/lib/site";

export interface GeneratedSite {
  title: string;
  html: string;
  css: string;
  js: string;
  notes: string;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert senior web developer and UI/UX designer.
Your job: from the user's request, build a COMPLETE, modern, beautiful, fully responsive website.

STRICT OUTPUT RULES:
- Respond with ONLY a single valid JSON object. No markdown, no code fences, no commentary.
- JSON shape: {"title": string, "html": string, "css": string, "js": string, "notes": string}
- "html": ONLY the markup that goes INSIDE <body>. Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags. Do NOT include <style> or <script> tags here.
- "css": complete CSS (no <style> tags). Use modern responsive design, nice fonts, spacing, colors, hover effects, and mobile media queries.
- "js": vanilla JavaScript only (no <script> tags). Leave "" if not needed.
- "notes": 1-2 short sentences describing what you built and any features.

DESIGN QUALITY:
- Make it look professional: hero section, clear sections, good typography, consistent color palette, rounded corners, subtle shadows, smooth transitions.
- Fully responsive (mobile + desktop). Include a working nav.
- Use only inline data / placeholder images from https://picsum.photos if images are needed.
- Add the specific advanced features the user asks for (forms, sliders, galleries, dark mode, etc.).
- Everything must work standalone in a single HTML file.`;

function stripFences(text: string): string {
  let t = text.trim();
  // remove ```json ... ``` or ``` ... ```
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  return t.trim();
}

function extractJson(text: string): string {
  const cleaned = stripFences(text);
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return cleaned.slice(first, last + 1);
  }
  return cleaned;
}

async function getModel(): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key: "model" } });
  return (
    setting?.value ||
    process.env.OPENROUTER_MODEL ||
    "inclusionai/ling-3.0-flash:free"
  );
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function generateWebsite(
  userPrompt: string,
  history: ChatTurn[] = []
): Promise<GeneratedSite> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY set nahi hai. .env file me apni free OpenRouter key daalein."
    );
  }

  const model = await getModel();

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userPrompt },
  ];

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "AI Website Builder",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `AI service error (${res.status}). ${
        res.status === 401
          ? "API key galat hai."
          : res.status === 429
          ? "Free limit khatam ho gayi, thodi der baad try karein."
          : errText.slice(0, 200)
      }`
    );
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("AI se koi response nahi mila. Dobara try karein.");

  let parsed: Partial<GeneratedSite> | null = null;
  try {
    parsed = JSON.parse(extractJson(content));
  } catch {
    parsed = null;
  }

  if (parsed && (parsed.html || parsed.css)) {
    return {
      title: parsed.title || "Website",
      html: parsed.html || "",
      css: parsed.css || "",
      js: parsed.js || "",
      notes: parsed.notes || "",
    };
  }

  // Fallback: agar model ne raw HTML diya to usi ko use karo
  return {
    title: "Website",
    html: content,
    css: "",
    js: "",
    notes: "AI ne raw output diya (JSON nahi). Fallback me dikhaya gaya hai.",
  };
}

