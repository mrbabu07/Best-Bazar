export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { bannerSchema } from "@/lib/validations/admin";
import { created, handleApiError, ok, requireAdmin } from "@/lib/api/admin";

export async function GET() {
  try {
    await requireAdmin();
    const banners = await prisma.banner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });

    return ok(banners);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = bannerSchema.parse(await request.json());
    const banner = await prisma.banner.create({ data });

    return created(banner);
  } catch (error) {
    return handleApiError(error);
  }
}
