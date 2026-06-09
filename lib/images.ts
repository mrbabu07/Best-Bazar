export const fallbackCategoryImage =
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80";

export const fallbackHeroImage =
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=85";

export const fallbackProductImage =
  "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1000&q=80";

const allowedRemoteImageHosts = new Set(["images.unsplash.com", "res.cloudinary.com"]);

export const imageUrlValidationMessage = "Use an uploaded image or an allowed image URL.";

export function isAllowedRemoteImage(value?: string | null): value is string {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedRemoteImageHosts.has(url.hostname);
  } catch {
    return false;
  }
}

export function safeRemoteImage(value: string | null | undefined, fallback: string) {
  return isAllowedRemoteImage(value) ? value : fallback;
}
