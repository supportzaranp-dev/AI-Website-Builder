import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const model = String(body.model || "").trim();
  if (!model)
    return NextResponse.json({ error: "Model khaali hai." }, { status: 400 });

  await prisma.setting.upsert({
    where: { key: "model" },
    update: { value: model },
    create: { key: "model", value: model },
  });
  return NextResponse.json({ ok: true, model });
}
