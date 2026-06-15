"use client";

import { optimizeCloudinaryImage } from "@/lib/images";
import { safeResponseJson } from "@/lib/safe-json";

type UploadSignature = {
  cloudName?: string;
  apiKey?: string;
  folder?: string;
  timestamp?: number;
  signature?: string;
  error?: string;
};

export type ClientUploadResult = {
  secureUrl: string;
  resourceType: "image" | "video";
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

export async function uploadToCloudinary(file: File, folder = "best-mart/uploads"): Promise<ClientUploadResult> {
  const resourceType = getResourceType(file);
  validateSize(file, resourceType);

  const signatureResponse = await fetch("/api/upload/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder })
  });
  const signature = await safeResponseJson<UploadSignature>(signatureResponse, {});

  if (!signatureResponse.ok) {
    throw new Error(signature?.error ?? "Unable to prepare upload.");
  }

  if (!signature.cloudName || !signature.apiKey || !signature.folder || !signature.timestamp || !signature.signature) {
    throw new Error("Upload signature was not returned.");
  }

  const formData = new FormData();
  formData.set("file", file);
  formData.set("api_key", signature.apiKey);
  formData.set("folder", signature.folder);
  formData.set("timestamp", String(signature.timestamp));
  formData.set("signature", signature.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData
    }
  );
  const upload = await safeResponseJson<{ secure_url?: string; error?: { message?: string } }>(uploadResponse, {});

  if (!uploadResponse.ok || !upload?.secure_url) {
    throw new Error(upload?.error?.message ?? "Cloudinary upload failed.");
  }

  return {
    secureUrl: resourceType === "image" ? optimizeCloudinaryImage(upload.secure_url, { width: 1800 }) : upload.secure_url,
    resourceType
  };
}
