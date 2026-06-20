import { prisma } from "@/lib/prisma";
import { revalidateCacheTags } from "@/lib/cache";
import { homepageSectionSchema } from "@/lib/validations/admin";
import { handleApiError, noContent, ok, requireAdmin } from "@/lib/api/admin";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const section = await prisma.homepageSection.update({
      where: { id: params.id },
      data: homepageSectionSchema.parse(await request.json())
    });
    revalidateCacheTags(["storefront", "homepage-sections"]);
    return ok(section);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await prisma.homepageSection.delete({ where: { id: params.id } });
    revalidateCacheTags(["storefront", "homepage-sections"]);
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
