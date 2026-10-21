// Pure upload validation helpers (unit tested).

export const UPLOAD_FOLDERS = ["products", "gallery", "pages", "misc"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
/** Vercel rejects request bodies above ~4.5MB; larger files go through the chunked endpoint. */
export const SINGLE_REQUEST_LIMIT = 4 * 1024 * 1024;
export const CHUNK_SIZE = 3 * 1024 * 1024;

export type ImageKind = { mime: "image/png" | "image/jpeg" | "image/webp" | "image/gif"; ext: "png" | "jpg" | "webp" | "gif" };

export function isUploadFolder(v: unknown): v is UploadFolder {
  return typeof v === "string" && (UPLOAD_FOLDERS as readonly string[]).includes(v);
}

/** Detects the image type from magic bytes; never trusts the client MIME type. */
export function sniffImage(buf: Uint8Array): ImageKind | null {
  const b = buf;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a)
    return { mime: "image/png", ext: "png" };
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length >= 6) {
    const sig = String.fromCharCode(...b.slice(0, 6));
    if (sig === "GIF87a" || sig === "GIF89a") return { mime: "image/gif", ext: "gif" };
  }
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP")
    return { mime: "image/webp", ext: "webp" };
  return null;
}

const EXT_MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

export type ValidationResult = { ok: true; kind: ImageKind } | { ok: false; status: number; error: string };

export function validateImage(buf: Uint8Array, claimedName: string, claimedMime: string): ValidationResult {
  if (!buf.length) return { ok: false, status: 400, error: "File is empty" };
  if (buf.length > MAX_UPLOAD_BYTES) return { ok: false, status: 413, error: "Image exceeds the 8MB limit" };
  const kind = sniffImage(buf);
  if (!kind) return { ok: false, status: 415, error: "Only PNG, JPEG, WebP and GIF images are allowed" };
  const ext = (claimedName.split(".").pop() || "").toLowerCase();
  if (ext && EXT_MIME[ext] && EXT_MIME[ext] !== kind.mime) return { ok: false, status: 415, error: "File extension does not match its content" };
  if (claimedMime && claimedMime !== "application/octet-stream" && claimedMime !== kind.mime) return { ok: false, status: 415, error: "File type does not match its content" };
  return { ok: true, kind };
}

const FILENAME_RE = /^\d{10,16}-[a-f0-9]{16,64}\.(png|jpg|webp|gif)$/;

export function isSafeFilename(name: string) {
  return typeof name === "string" && !name.includes("..") && !/[\/\\\0]/.test(name) && FILENAME_RE.test(name);
}

/** Parses "/api/uploads/<folder>/<filename>" safely. Returns null for anything else (including legacy /uploads paths). */
export function parseUploadUrl(url: string | null | undefined): { folder: UploadFolder; filename: string } | null {
  if (!url || typeof url !== "string" || !url.startsWith("/api/uploads/")) return null;
  const parts = url.slice("/api/uploads/".length).split("?")[0].split("/");
  if (parts.length !== 2) return null;
  const [folder, filename] = parts;
  if (!isUploadFolder(folder) || !isSafeFilename(filename)) return null;
  return { folder, filename };
}

/** Mongoose .lean() returns BSON Binary for Buffer fields; normalise to a Node Buffer. */
export function binaryToBuffer(x: unknown): Buffer {
  if (Buffer.isBuffer(x)) return x;
  if (x instanceof Uint8Array) return Buffer.from(x);
  const inner = (x as { buffer?: unknown })?.buffer;
  if (inner instanceof Uint8Array) return Buffer.from(inner);
  if (inner instanceof ArrayBuffer) return Buffer.from(new Uint8Array(inner));
  return Buffer.alloc(0);
}
