let cachedTimestamp = 0;
let cachedAt = 0;

export async function getCloudinaryTimestamp() {
  const now = Date.now();

  if (cachedTimestamp && now - cachedAt < 5 * 60 * 1000) {
    return cachedTimestamp + Math.round((now - cachedAt) / 1000);
  }

  try {
    const response = await fetch("https://api.cloudinary.com", {
      method: "HEAD",
      cache: "no-store"
    });
    const dateHeader = response.headers.get("date");
    const serverTime = dateHeader ? Date.parse(dateHeader) : Number.NaN;

    if (Number.isFinite(serverTime)) {
      cachedAt = now;
      cachedTimestamp = Math.round(serverTime / 1000);
      return cachedTimestamp;
    }
  } catch {
    // Fall back to local time if Cloudinary time cannot be read.
  }

  return Math.round(now / 1000);
}
