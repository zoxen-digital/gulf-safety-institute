"use client";
import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { CHUNK_SIZE, MAX_UPLOAD_BYTES, SINGLE_REQUEST_LIMIT, type UploadFolder } from "@/lib/upload-core";
import { toast } from "./Toast";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif"];

async function uploadChunked(file: File, folder: UploadFolder) {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const uploadId = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const total = Math.ceil(file.size / CHUNK_SIZE);
  let last: { success: boolean; url?: string; error?: string } = { success: false };
  for (let i = 0; i < total; i++) {
    const fd = new FormData();
    fd.set("folder", folder);
    fd.set("uploadId", uploadId);
    fd.set("index", String(i));
    fd.set("total", String(total));
    fd.set("name", file.name);
    fd.set("mime", file.type);
    fd.set("chunk", file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    const res = await fetch("/api/upload/chunk", { method: "POST", body: fd });
    last = await res.json().catch(() => ({ success: false, error: "Upload failed" }));
    if (!res.ok || !last.success) throw new Error(last.error || "Upload failed");
  }
  return last.url!;
}

/**
 * Reusable admin image picker. Uploads to MongoDB via /api/upload and keeps the returned URL
 * in a hidden input named `name`, so the surrounding form saves only the URL string.
 */
export function AdminImageField({
  name, label, folder, defaultValue = "", help, onChange, aspect = "aspect-[4/3]", fit = "cover",
}: {
  name: string; label: string; folder: UploadFolder; defaultValue?: string; help?: string; onChange?: (url: string) => void; aspect?: string; fit?: "cover" | "contain";
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const set = (u: string) => {
    setUrl(u);
    onChange?.(u);
  };

  async function pick(file: File) {
    if (!ACCEPT.includes(file.type)) return toast(false, "Choose a PNG, JPEG, WebP or GIF image.");
    if (file.size > MAX_UPLOAD_BYTES) return toast(false, `Image is ${(file.size / 1048576).toFixed(1)}MB. The limit is 8MB.`);
    setBusy(true);
    try {
      let newUrl: string;
      if (file.size <= SINGLE_REQUEST_LIMIT) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("folder", folder);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await res.json().catch(() => ({ success: false, error: "Upload failed" }));
        if (!res.ok || !j.success) throw new Error(j.error || "Upload failed");
        newUrl = j.url;
      } else newUrl = await uploadChunked(file, folder);
      set(newUrl);
      toast(true, "Image uploaded. Save the form to apply it.");
    } catch (e) {
      toast(false, (e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <p id={`${id}-l`} className="label">{label}</p>
      <input type="hidden" name={name} value={url} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className={`relative w-full max-w-[220px] overflow-hidden rounded-md border border-slate-200 bg-slate-50 ${aspect}`}>
          {url ? (
            <SafeImage src={url} alt={`${label} preview`} fill sizes="220px" className={fit === "contain" ? "object-contain p-2" : "object-cover"} />
          ) : (
            <div className="grid h-full place-items-center text-xs text-muted">No image</div>
          )}
          {busy && <div className="absolute inset-0 grid place-items-center bg-white/70"><Loader2 className="h-6 w-6 animate-spin text-navy" aria-label="Uploading" /></div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            id={`${id}-f`}
            type="file"
            accept={ACCEPT.join(",")}
            className="sr-only"
            aria-labelledby={`${id}-l`}
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
          />
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="btn-outline btn-sm">
            {url ? <RefreshCw className="h-4 w-4" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />} {url ? "Replace" : "Upload"}
          </button>
          {url && (
            <button type="button" disabled={busy} onClick={() => set("")} className="btn-outline btn-sm text-danger">
              <Trash2 className="h-4 w-4" aria-hidden /> Remove
            </button>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-muted">{help || "PNG, JPEG, WebP or GIF, up to 8MB."}</p>
    </div>
  );
}
