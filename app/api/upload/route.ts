import { NextResponse } from "next/server";
import { ApiError, handleApiError, requireAdmin } from "@/lib/api/admin";
import { MediaUploadError, uploadMediaWithFallback } from "@/services/media-upload-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "best-mart/uploads");

    if (!(file instanceof File)) {
      throw new ApiError("A file field is required.", 422);
    }

    try {
      const upload = await uploadMediaWithFallback(file, folder);

      return NextResponse.json(
        {
          mediaId: upload.id,
          publicId: upload.publicId,
          secureUrl: upload.url,
          url: upload.url,
          storageType: upload.storageType,
          storage_type: upload.storageType,
          fileType: upload.fileType,
          file_type: upload.fileType,
          resourceType: upload.fileType,
          width: upload.width,
          height: upload.height,
          format: upload.format,
          bytes: upload.bytes
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
      if (error instanceof MediaUploadError) {
        throw new ApiError(error.message, error.status);
      }

      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
