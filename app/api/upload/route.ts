import { NextResponse } from "next/server";
import { assertCloudinaryConfigured, cloudinary } from "@/lib/cloudinary";
import { optimizeCloudinaryImage } from "@/lib/images";
import { ApiError, handleApiError, requireAdmin } from "@/lib/api/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    assertCloudinaryConfigured();

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "best-bazar/uploads");

    if (!(file instanceof File)) {
      throw new ApiError("A file field is required.", 422);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const upload = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image"
    });

    return NextResponse.json({
      publicId: upload.public_id,
      secureUrl: optimizeCloudinaryImage(upload.secure_url, { width: 1800 }),
      width: upload.width,
      height: upload.height,
      format: upload.format,
      bytes: upload.bytes
    });
  } catch (error) {
    return handleApiError(error);
  }
}
