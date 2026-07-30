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

const SYSTEM_PROMPT = `You are a world-class web developer and UI/UX designer. From the user's request, build ONE complete, polished, professional, fully responsive single-page website.

OUTPUT RULES (very important):
- Output ONLY raw HTML. Start with <!DOCTYPE html> and end with </html>.
- NO markdown, NO code fences, NO JSON, NO explanation before or after the HTML.
- Put ALL CSS inside a single <style> tag in <head>. Put any JavaScript inside a <script> tag before </body>.
- Use plain CSS only (do NOT use Tailwind or external CSS frameworks). You may load Google Fonts via a <link> tag.

CONTENT (very important - be accurate to the request):
- Read the user's request carefully and make ALL content SPECIFICALLY about that exact topic / business / person. Use realistic, professional, relevant copy: real-sounding headings, descriptions and section text that truly fit the topic. Do NOT add unrelated or random filler text.
- Choose sections that match the request. For example a company profile: hero (company name + tagline), About Us, Services/Products, Why Choose Us, Team, Testimonials, Contact (with a form) and footer.
- If the user gives a name, use that exact name consistently throughout the site.

IMAGES (very important - relevant, not random):
- Use REAL topic-relevant photos from loremflickr: https://loremflickr.com/WIDTH/HEIGHT/KEYWORD - pick keywords that match each section's content (e.g. https://loremflickr.com/800/500/construction , https://loremflickr.com/600/400/office,team , https://loremflickr.com/400/400/dog). NEVER use random or unrelated images.

DESIGN QUALITY:
- Modern, clean, professional: hero section, clear sections, footer, nice typography, a consistent color palette, generous spacing, rounded corners, subtle shadows, hover effects and smooth transitions.
- Fully responsive (mobile + desktop) with CSS media queries. Include a working navigation bar. Add advanced features the user asks for (forms, galleries, sliders, dark mode, etc.).

LENGTH: Complete but focused. The page MUST be COMPLETE and end with </html> with every tag closed. Prioritize finishing the whole page over adding excessive content.`;

function extractHtml(text: string): string {
  let t = (text || "").trim();
  // remove ```html ... ``` fences if the model added them
  t = t.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  // slice from the document start
  const start = t.search(/<!doctype html|<html[\s>]/i);
  if (start > 0) t = t.slice(start);
  // slice to the closing </html> if present
  const end = t.toLowerCase().lastIndexOf("</html>");
  if (end !== -1) t = t.slice(0, end + "</html>".length);
  return t.trim();
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (m && m[1].trim()) return m[1].trim();
  const h1 = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  if (h1 && h1[1].trim()) return h1[1].trim();
  return "Website";
}

async function getModel(): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key: "model" } });
  return (
    setting?.value ||
    process.env.OPENROUTER_MODEL ||
    "nvidia/nemotron-3-nano-30b-a3b:free"
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
      "OPENROUTER_API_KEY set nahi hai. .env ya Vercel me apni free OpenRouter key daalein."
    );
  }

  const model = await getModel();

  // Sirf pichle kuch turns bhejo taaki context chota rahe (speed ke liye).
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-4).map((h) => ({ role: h.role, content: h.content })),
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
      temperature: 0.6,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      res.status === 401
        ? "API key galat hai."
        : res.status === 429
        ? "Free model ki limit khatam ho gayi. Thodi der baad try karein ya Admin se doosra model chunein."
        : `AI service error (${res.status}). ${errText.slice(0, 150)}`
    );
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  if (!content.trim())
    throw new Error("AI se koi response nahi mila. Dobara try karein.");

  const html = extractHtml(content);
  if (!/<[a-z]/i.test(html)) {
    throw new Error(
      "AI ne sahi website nahi banayi. Dobara try karein ya Admin se doosra model chunein."
    );
  }

  return {
    title: extractTitle(html),
    html,
    css: "",
    js: "",
    notes: "Website ban gayi! Preview me dekhein. ✅",
  };
}
