import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateWebsite, type ChatTurn } from "@/lib/openrouter";

export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!project || project.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt || "").trim();
  if (!prompt)
    return NextResponse.json({ error: "Prompt khaali hai." }, { status: 400 });

  // save user message
  await prisma.chatMessage.create({
    data: { projectId: id, role: "user", content: prompt },
  });

  const history: ChatTurn[] = project.messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  try {
    const site = await generateWebsite(prompt, history);

    const version = await prisma.websiteVersion.create({
      data: {
        projectId: id,
        title: site.title,
        html: site.html,
        css: site.css,
        js: site.js,
        notes: site.notes,
      },
    });

    await prisma.chatMessage.create({
      data: {
        projectId: id,
        role: "assistant",
        content:
          site.notes || "Website ban gayi! Preview me dekhein.",
      },
    });

    await prisma.project.update({
      where: { id },
      data: {
        prompt,
        title: project.title === "Untitled Website" ? site.title : project.title,
      },
    });

    return NextResponse.json({ version });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI generate fail ho gaya.";
    await prisma.chatMessage.create({
      data: { projectId: id, role: "assistant", content: `⚠️ ${msg}` },
    });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
