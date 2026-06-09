export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  street: z.string().trim().max(180).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable()
});

function nullable(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const data = profileSchema.parse(await request.json());
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        phone: nullable(data.phone),
        street: nullable(data.street),
        city: nullable(data.city),
        country: nullable(data.country)
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        street: true,
        city: true,
        country: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Invalid profile details." },
        { status: 422 }
      );
    }

    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
