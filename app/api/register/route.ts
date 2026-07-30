import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(1).max(60).optional().or(z.literal("")),
  email: z.string().email(),
  password: z.string().min(6, "Password kam se kam 6 characters ka ho"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Yeh email pehle se registered hai." },
        { status: 409 }
      );
    }

    // Sabse pehla user automatically ADMIN banega
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "USER";

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await prisma.user.create({
      data: {
        email,
        name: parsed.data.name || null,
        passwordHash,
        role,
      },
    });

    return NextResponse.json({ ok: true, role });
  } catch (e) {
    return NextResponse.json(
      { error: "Kuch galat ho gaya. Dobara try karein." },
      { status: 500 }
    );
  }
}
