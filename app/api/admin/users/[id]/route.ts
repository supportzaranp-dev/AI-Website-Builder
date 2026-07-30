import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: { banned?: boolean; role?: string } = {};
  if (typeof body.banned === "boolean") data.banned = body.banned;
  if (body.role === "ADMIN" || body.role === "USER") data.role = body.role;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, role: true, banned: true },
  });
  return NextResponse.json({ user });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (id === session.user.id)
    return NextResponse.json(
      { error: "Aap khud ko delete nahi kar sakte." },
      { status: 400 }
    );

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
