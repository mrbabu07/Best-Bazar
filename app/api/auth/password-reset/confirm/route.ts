export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";

const confirmSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  token: z.string().trim().min(32),
  password: z.string().min(8)
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getIdentifier(email: string) {
  return `password-reset:${email}`;
}

export async function POST(request: Request) {
  try {
    const data = confirmSchema.parse(await request.json());
    const tokenHash = hashToken(data.token);
    const record = await prisma.verificationToken.findUnique({
      where: { token: tokenHash }
    });

    if (!record || record.identifier !== getIdentifier(data.email)) {
      return NextResponse.json({ error: "Password reset link is invalid or expired." }, { status: 400 });
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { token: tokenHash } });
      return NextResponse.json({ error: "Password reset link is invalid or expired." }, { status: 400 });
    }

    const password = await bcrypt.hash(data.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: data.email },
        data: { password }
      }),
      prisma.verificationToken.delete({
        where: { token: tokenHash }
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Invalid password reset details." },
        { status: 422 }
      );
    }

    return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
  }
}
