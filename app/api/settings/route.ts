import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await prisma.setting.findUnique({
    where: { id: "store-settings" }
  });

  return NextResponse.json(JSON.parse(JSON.stringify(settings)));
}
