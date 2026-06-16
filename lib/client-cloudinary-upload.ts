"use client";

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

async function getFreshSignature(folder: string) {
  const signatureResponse = await fetch(`/api/upload/signature?ts=${Date.now()}`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, nonce: crypto.randomUUID?.() ?? String(Date.now()) })
  });
  const signature = await safeResponseJson<UploadSignature>(signatureResponse, {});

  if (!signatureResponse.ok) {
    throw new Error(signature?.error ?? "Unable to prepare upload.");
  }

  if (!signature.cloudName || !signature.apiKey || !signature.folder || !signature.timestamp || !signature.signature) {
    throw new Error("Upload signature was not returned.");
  }

  return signature;
}

async function uploadWithSignature(file: File, resourceType: "image" | "video", signature: Required<UploadSignature>) {
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

  return upload.secure_url;
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
    error?: string;
  }>(response, {});

  if (!response.ok || !upload.secureUrl || !upload.resourceType) {
    throw new Error(upload?.error ?? "Upload failed.");
  }

  return {
    secureUrl: upload.secureUrl,
    resourceType: upload.resourceType
  };
}

export async function uploadToCloudinary(file: File, folder = "best-mart/uploads"): Promise<ClientUploadResult> {
  const resourceType = getResourceType(file);
  validateSize(file, resourceType);

  if (resourceType === "image") {
    return uploadThroughServer(file, folder);
  }

  let signature = (await getFreshSignature(folder)) as Required<UploadSignature>;
  let secureUrl: string;

  try {
    secureUrl = await uploadWithSignature(file, resourceType, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (!message.toLowerCase().includes("stale request")) {
      throw error;
    }

    signature = (await getFreshSignature(folder)) as Required<UploadSignature>;
    secureUrl = await uploadWithSignature(file, resourceType, signature);
  }

  return {
    secureUrl,
    resourceType
  };
}
