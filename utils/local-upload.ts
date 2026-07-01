import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import type { MediaFileType } from "@/utils/cloudinary-upload";

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov"
};

function safeFolderSegments(folder: string) {
  return folder
    .split(/[\\/]+/)
    .map((segment) => segment.trim().replace(/[^a-zA-Z0-9_-]/g, "-"))
    .filter(Boolean)
    .slice(0, 4);
}

export type LocalMediaResult = {
  url: string;
  absolutePath: string;
  fileType: MediaFileType;
  bytes: number;
  format: string;
};

export async function saveMediaLocally({
  buffer,
  mimeType,
  folder,
  fileType
}: {
  buffer: Buffer;
  mimeType: string;
  folder: string;
  fileType: MediaFileType;
}): Promise<LocalMediaResult> {
  const extension = extensionByMimeType[mimeType];

  if (!extension) {
    throw new Error(`Local storage does not support ${mimeType}.`);
  }

  const now = new Date();
  const relativeSegments = [
    ...safeFolderSegments(folder),
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0")
  ];
  const uploadDirectory = path.join(process.cwd(), "uploads", ...relativeSegments);
  const filename = `${randomUUID()}${extension}`;
  const absolutePath = path.join(uploadDirectory, filename);

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(absolutePath, buffer, { flag: "wx" });

  return {
    url: `/uploads/${[...relativeSegments, filename].map(encodeURIComponent).join("/")}`,
    absolutePath,
    fileType,
    bytes: buffer.byteLength,
    format: extension.slice(1)
  };
}

export async function removeLocalMedia(absolutePath: string) {
  await unlink(absolutePath).catch(() => undefined);
}
