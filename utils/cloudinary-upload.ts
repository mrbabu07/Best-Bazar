import { assertCloudinaryConfigured, cloudinary } from "@/lib/cloudinary";
import { getCloudinaryTimestamp } from "@/lib/cloudinary-time";
import { optimizeCloudinaryImage } from "@/lib/images";

export type MediaFileType = "image" | "video";

export type CloudinaryMediaResult = {
  url: string;
  publicId: string;
  fileType: MediaFileType;
  bytes: number;
  width?: number;
  height?: number;
  format?: string;
};

type CloudinaryLikeError = Error & {
  http_code?: number;
  error?: { http_code?: number; message?: string };
  code?: string | number;
};

export async function uploadMediaToCloudinary({
  buffer,
  mimeType,
  folder,
  fileType
}: {
  buffer: Buffer;
  mimeType: string;
  folder: string;
  fileType: MediaFileType;
}): Promise<CloudinaryMediaResult> {
  assertCloudinaryConfigured();
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
  const upload = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: fileType,
    timeout: 120_000,
    timestamp: await getCloudinaryTimestamp()
  });

  return {
    url: fileType === "image" ? optimizeCloudinaryImage(upload.secure_url, { width: 1800 }) : upload.secure_url,
    publicId: upload.public_id,
    fileType,
    bytes: upload.bytes,
    width: upload.width,
    height: upload.height,
    format: upload.format
  };
}

export function shouldFallbackFromCloudinary(error: unknown) {
  const cloudinaryError = error as CloudinaryLikeError;
  const status = Number(cloudinaryError?.http_code ?? cloudinaryError?.error?.http_code ?? 0);
  const code = String(cloudinaryError?.code ?? "").toLowerCase();
  const message = `${cloudinaryError?.message ?? ""} ${cloudinaryError?.error?.message ?? ""}`.toLowerCase();
  const fallbackTerms = [
    "quota",
    "storage",
    "credit",
    "usage limit",
    "rate limit",
    "insufficient",
    "timeout",
    "timed out",
    "network",
    "socket",
    "fetch failed",
    "econnreset",
    "econnrefused",
    "enotfound",
    "temporarily unavailable",
    "not configured"
  ];

  return (
    status === 420 ||
    status === 429 ||
    status >= 500 ||
    ["econnreset", "econnrefused", "enotfound", "etimedout"].includes(code) ||
    fallbackTerms.some((term) => message.includes(term))
  );
}

export async function removeCloudinaryMedia(publicId: string, fileType: MediaFileType) {
  await cloudinary.uploader.destroy(publicId, { resource_type: fileType, invalidate: true });
}
