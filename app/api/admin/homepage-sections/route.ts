import { prisma } from "@/lib/prisma";
import { revalidateCacheTags } from "@/lib/cache";
import { homepageSectionSchema } from "@/lib/validations/admin";
import { created, handleApiError, ok, requireAdmin } from "@/lib/api/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const sections = await prisma.homepageSection.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    return ok(sections);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const section = await prisma.homepageSection.create({ data: homepageSectionSchema.parse(await request.json()) });
    revalidateCacheTags(["storefront", "homepage-sections"]);
    return created(section);
  } catch (error) {
    return handleApiError(error);
  }
}
