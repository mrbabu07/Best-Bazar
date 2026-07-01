import { prisma } from "@/lib/prisma";
import {
  removeCloudinaryMedia,
  shouldFallbackFromCloudinary,
  uploadMediaToCloudinary,
  type MediaFileType
} from "@/utils/cloudinary-upload";
import { removeLocalMedia, saveMediaLocally } from "@/utils/local-upload";

const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const allowedVideoMimeTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const maxImageBytes = 10 * 1024 * 1024;
const maxVideoBytes = 50 * 1024 * 1024;

export class MediaUploadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function detectFileType(mimeType: string): MediaFileType | null {
  if (allowedImageMimeTypes.has(mimeType)) return "image";
  if (allowedVideoMimeTypes.has(mimeType)) return "video";
  return null;
}

function hasExpectedSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (mimeType === "image/gif") return ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"));
  if (mimeType === "image/avif") return buffer.subarray(4, 12).toString("ascii").includes("ftypavif");
  if (mimeType === "video/webm") return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mimeType === "video/mp4" || mimeType === "video/quicktime") return buffer.subarray(4, 12).toString("ascii").includes("ftyp");
  return false;
}

async function validateFile(file: File) {
  const mimeType = file.type.toLowerCase();
  const fileType = detectFileType(mimeType);

  if (!fileType) {
    throw new MediaUploadError("Only JPG, PNG, WebP, GIF, AVIF, MP4, WebM, and MOV files are supported.", 415);
  }

  if (file.size <= 0) {
    throw new MediaUploadError("The uploaded file is empty.", 422);
  }

  const maxBytes = fileType === "image" ? maxImageBytes : maxVideoBytes;
  if (file.size > maxBytes) {
    throw new MediaUploadError(
      fileType === "image" ? "Image is too large. Upload an image under 10MB." : "Video is too large. Upload a short video under 50MB.",
      413
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasExpectedSignature(buffer, mimeType)) {
    throw new MediaUploadError("The file content does not match its image/video type.", 422);
  }

  return { buffer, mimeType, fileType };
}

export async function uploadMediaWithFallback(file: File, folder: string) {
  const { buffer, mimeType, fileType } = await validateFile(file);
  let uploaded:
    | {
        storageType: "cloudinary";
        url: string;
        publicId: string;
        absolutePath?: never;
        bytes: number;
        width?: number;
        height?: number;
        format?: string;
      }
    | {
        storageType: "local";
        url: string;
        publicId: null;
        absolutePath: string;
        bytes: number;
        width?: never;
        height?: never;
        format: string;
      };

  try {
    const cloudinaryMedia = await uploadMediaToCloudinary({ buffer, mimeType, folder, fileType });
    uploaded = { storageType: "cloudinary", ...cloudinaryMedia };
  } catch (error) {
    if (!shouldFallbackFromCloudinary(error)) {
      const message = error instanceof Error ? error.message : "Cloudinary upload failed.";
      throw new MediaUploadError(`Cloudinary upload failed: ${message}`, 502);
    }

    console.warn("Cloudinary unavailable; saving media to local storage fallback.", {
      reason: error instanceof Error ? error.message : "Unknown Cloudinary error",
      fileType
    });
    const localMedia = await saveMediaLocally({ buffer, mimeType, folder, fileType });
    uploaded = { storageType: "local", publicId: null, ...localMedia };
  }

  try {
    const media = await prisma.mediaAsset.create({
      data: {
        url: uploaded.url,
        storageType: uploaded.storageType,
        publicId: uploaded.publicId,
        fileType,
        originalName: file.name || null,
        mimeType,
        bytes: uploaded.bytes,
        width: uploaded.width,
        height: uploaded.height,
        format: uploaded.format
      }
    });

    return { ...uploaded, id: media.id, fileType, mimeType };
  } catch (error) {
    if (uploaded.storageType === "cloudinary") {
      await removeCloudinaryMedia(uploaded.publicId, fileType).catch(() => undefined);
    } else {
      await removeLocalMedia(uploaded.absolutePath);
    }
    throw new MediaUploadError("Media uploaded but its database record could not be saved.", 500);
  }
}
