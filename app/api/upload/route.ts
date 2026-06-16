import { NextResponse } from "next/server";
import { ApiError, handleApiError, requireAdmin } from "@/lib/api/admin";
import { assertCloudinaryConfigured, cloudinary } from "@/lib/cloudinary";
import { getCloudinaryTimestamp } from "@/lib/cloudinary-time";
import { optimizeCloudinaryImage } from "@/lib/images";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    await requireAdmin();

    try {
      assertCloudinaryConfigured();
    } catch {
      throw new ApiError(
        "Cloudinary credentials are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
        503
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "best-mart/uploads");

    if (!(file instanceof File)) {
      throw new ApiError("A file field is required.", 422);
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      throw new ApiError("Only image and video files are supported.", 415);
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      throw new ApiError("Image is too large. Upload an image under 10MB.", 413);
    }

    if (isVideo && file.size > 50 * 1024 * 1024) {
      throw new ApiError("Video is too large. Upload a short video under 50MB.", 413);
    }

    const dataUri = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    const resourceType = isVideo ? "video" : "image";
    let upload;

    try {
      upload = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: resourceType,
        timeout: 120000,
        timestamp: await getCloudinaryTimestamp()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cloudinary upload failed.";
      throw new ApiError(message, 502);
    }
    const secureUrl = isVideo ? upload.secure_url : optimizeCloudinaryImage(upload.secure_url, { width: 1800 });

    return NextResponse.json(
      {
        publicId: upload.public_id,
        secureUrl,
        width: upload.width,
        height: upload.height,
        format: upload.format,
        bytes: upload.bytes,
        resourceType
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0"
        }
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
