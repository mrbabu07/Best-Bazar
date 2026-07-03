import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const mimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime"
};

function resolveUploadPath(segments: string[]) {
  if (!segments.length || segments.some((segment) => !segment || segment === "." || segment === ".." || /[\\/\0]/.test(segment))) {
    return null;
  }

  const uploadRoot = path.resolve(process.cwd(), "uploads");
  const filePath = path.resolve(uploadRoot, ...segments);

  return filePath.startsWith(`${uploadRoot}${path.sep}`) ? filePath : null;
}

function parseRange(value: string | null, size: number) {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match) return false;

  let start = match[1] ? Number(match[1]) : Number.NaN;
  let end = match[2] ? Number(match[2]) : Number.NaN;

  if (Number.isNaN(start) && !Number.isNaN(end)) {
    start = Math.max(size - end, 0);
    end = size - 1;
  } else {
    end = Number.isNaN(end) ? size - 1 : Math.min(end, size - 1);
  }

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= size) {
    return false;
  }

  return { start, end };
}

async function serve(request: Request, segments: string[], headOnly = false) {
  const filePath = resolveUploadPath(segments);
  if (!filePath) return new Response("Not found", { status: 404 });

  try {
    const file = await stat(filePath);
    if (!file.isFile()) return new Response("Not found", { status: 404 });

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()];
    if (!contentType) return new Response("Unsupported media type", { status: 415 });

    const range = parseRange(request.headers.get("range"), file.size);
    if (range === false) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${file.size}` } });
    }

    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff"
    });
    const start = range?.start ?? 0;
    const end = range?.end ?? file.size - 1;
    headers.set("Content-Length", String(end - start + 1));

    if (range) headers.set("Content-Range", `bytes ${start}-${end}/${file.size}`);
    if (headOnly) return new Response(null, { status: range ? 206 : 200, headers });

    const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream<Uint8Array>;
    return new Response(stream, { status: range ? 206 : 200, headers });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    return new Response(code === "ENOENT" ? "Not found" : "Unable to read media", { status: code === "ENOENT" ? 404 : 500 });
  }
}

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  return serve(request, params.path);
}

export async function HEAD(request: Request, { params }: { params: { path: string[] } }) {
  return serve(request, params.path, true);
}
