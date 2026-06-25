import { prisma } from "@/lib/prisma";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const email = normalizeEmail(body.email);

    if (!isEmail(email)) {
      return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { isActive: true, source: "homepage" },
      create: { email, source: "homepage" }
    });

    return Response.json({ message: "Subscribed successfully." });
  } catch {
    return Response.json({ message: "Could not subscribe right now." }, { status: 500 });
  }
}
