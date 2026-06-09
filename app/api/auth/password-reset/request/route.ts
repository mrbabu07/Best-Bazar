export const dynamic = "force-dynamic";

import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { locales } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/stripe";

const requestSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  locale: z.enum(locales).default("en")
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getIdentifier(email: string) {
  return `password-reset:${email}`;
}

export async function POST(request: Request) {
  try {
    const data = requestSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, email: true, name: true, password: true }
    });
    let resetUrl: string | undefined;

    if (user?.password) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = hashToken(token);
      const identifier = getIdentifier(user.email);

      await prisma.verificationToken.deleteMany({ where: { identifier } });
      await prisma.verificationToken.create({
        data: {
          identifier,
          token: tokenHash,
          expires: new Date(Date.now() + 60 * 60 * 1000)
        }
      });

      resetUrl = `${getSiteUrl()}/${data.locale}/reset-password?email=${encodeURIComponent(user.email)}&token=${token}`;
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl
      });
    }

    return NextResponse.json({
      message: "If an account exists for that email, a reset link has been sent.",
      ...(process.env.NODE_ENV !== "production" && resetUrl ? { resetUrl } : {})
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Invalid password reset request." },
        { status: 422 }
      );
    }

    return NextResponse.json({ error: "Unable to start password reset." }, { status: 500 });
  }
}
