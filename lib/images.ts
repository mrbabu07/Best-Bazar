export const fallbackCategoryImage =
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80";

export const fallbackHeroImage =
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=85";

export const fallbackProductImage =
  "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1000&q=80";

const allowedRemoteImageHosts = new Set(["images.unsplash.com", "res.cloudinary.com"]);
const cloudinaryUploadPath = "/image/upload/";

type CloudinaryImageOptions = {
  width?: number;
  height?: number;
  crop?: "limit" | "fill" | "fit";
};

export const imageUrlValidationMessage = "Use an uploaded image or an allowed image URL.";

export function isAllowedRemoteImage(value?: string | null): value is string {
  if (!value) {
    return false;
  }

  if (/^\/uploads\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:jpe?g|png|webp|gif|avif)$/i.test(value)) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedRemoteImageHosts.has(url.hostname);
  } catch {
    return false;
  }
}

export function optimizeCloudinaryImage(value: string, options: CloudinaryImageOptions = {}) {
  try {
    const url = new URL(value);

    if (url.hostname !== "res.cloudinary.com" || !url.pathname.includes(cloudinaryUploadPath)) {
      return value;
    }

    const transforms = [
      "f_auto",
      "q_auto",
      options.width || options.height ? `c_${options.crop ?? "limit"}` : undefined,
      options.width ? `w_${Math.round(options.width)}` : undefined,
      options.height ? `h_${Math.round(options.height)}` : undefined
    ].filter(Boolean);

    const [beforeUpload, afterUpload] = url.pathname.split(cloudinaryUploadPath);
    const firstSegment = afterUpload.split("/")[0] ?? "";

    if (firstSegment.includes("f_auto") || firstSegment.includes("q_auto")) {
      return value;
    }

    url.pathname = `${beforeUpload}${cloudinaryUploadPath}${transforms.join(",")}/${afterUpload}`;

    return url.toString();
  } catch {
    return value;
  }
}

export function safeRemoteImage(value: string | null | undefined, fallback: string, options?: CloudinaryImageOptions) {
  const source = isAllowedRemoteImage(value) ? value : fallback;
  return optimizeCloudinaryImage(source, options);
}
