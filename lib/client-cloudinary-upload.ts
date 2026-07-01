"use client";

import { safeResponseJson } from "@/lib/safe-json";

export type ClientUploadResult = {
  secureUrl: string;
  resourceType: "image" | "video";
  storageType?: "cloudinary" | "local";
  mediaId?: string;
};

function getResourceType(file: File): "image" | "video" {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  throw new Error("Only image and video files are supported.");
}

function validateSize(file: File, resourceType: "image" | "video") {
  const maxImageBytes = 10 * 1024 * 1024;
  const maxVideoBytes = 50 * 1024 * 1024;

  if (resourceType === "image" && file.size > maxImageBytes) {
    throw new Error("Image is too large. Upload an image under 10MB.");
  }

  if (resourceType === "video" && file.size > maxVideoBytes) {
    throw new Error("Video is too large. Upload a short video under 50MB.");
  }
}

async function uploadThroughServer(file: File, folder: string) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("folder", folder);

  const response = await fetch(`/api/upload?ts=${Date.now()}`, {
    method: "POST",
    cache: "no-store",
    body: formData
  });
  const upload = await safeResponseJson<{
    secureUrl?: string;
    resourceType?: "image" | "video";
    storageType?: "cloudinary" | "local";
    mediaId?: string;
    error?: string;
  }>(response, {});

  if (!response.ok || !upload.secureUrl || !upload.resourceType) {
    throw new Error(upload?.error ? `Upload failed: ${upload.error}` : "Upload failed.");
  }

  return {
    secureUrl: upload.secureUrl,
    resourceType: upload.resourceType,
    storageType: upload.storageType,
    mediaId: upload.mediaId
  };
}

export async function uploadToCloudinary(file: File, folder = "best-mart/uploads"): Promise<ClientUploadResult> {
  const resourceType = getResourceType(file);
  validateSize(file, resourceType);

  return uploadThroughServer(file, folder);
}
