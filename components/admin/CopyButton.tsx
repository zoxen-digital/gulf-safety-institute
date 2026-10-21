"use client";
import { Copy } from "lucide-react";
import { toast } from "./Toast";

export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      className="btn-outline btn-sm"
      onClick={() => navigator.clipboard.writeText(text).then(() => toast(true, "Copied to clipboard"), () => toast(false, "Could not copy"))}
    >
      <Copy className="h-3.5 w-3.5" aria-hidden /> {label}
    </button>
  );
}
