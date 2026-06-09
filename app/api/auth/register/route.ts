export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  phone: z.string().trim().optional()
});

export async function POST(request: Request) {
  try {
    const data = registerSchema.parse(await request.json());
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
    }

    const password = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password,
        phone: data.phone || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Invalid registration details." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
