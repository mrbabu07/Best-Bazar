import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { ApiError, handleApiError, requireAdmin } from "@/lib/api/admin";
import { assertCloudinaryConfigured } from "@/lib/cloudinary";
import { getCloudinaryTimestamp } from "@/lib/cloudinary-time";

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

    const body = (await request.json()) as { folder?: unknown; nonce?: unknown };
    const folder = typeof body.folder === "string" && body.folder.trim() ? body.folder.trim() : "best-mart/uploads";
    const timestamp = await getCloudinaryTimestamp();
    const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
    const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";
    const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, apiSecret);

    return NextResponse.json(
      {
        cloudName,
        apiKey,
        folder,
        timestamp,
        signature
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
