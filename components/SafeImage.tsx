"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { resolveThemeImage } from "@/lib/image-assets";

export const PLACEHOLDER = "/images/placeholder.svg";

function usable(src: unknown): src is string {
  if (typeof src !== "string" || !src.trim()) return false;
  if (src.startsWith("/uploads/")) return false; // legacy filesystem uploads no longer exist
  return src.startsWith("/") || src.startsWith("https://images.unsplash.com/");
}

/** next/image with a bundled fallback for missing, legacy or broken sources. Falls back once only. */
export function SafeImage({ src, alt, ...rest }: Omit<ImageProps, "src"> & { src?: string | null }) {
  const initial = usable(src) ? resolveThemeImage(src) : PLACEHOLDER;
  const [current, setCurrent] = useState(initial);
  const [failed, setFailed] = useState(false);
  if (!failed && current !== initial) setCurrent(initial);
  return (
    <Image
      {...rest}
      src={current}
      alt={alt}
      unoptimized={current.endsWith(".svg") || current.startsWith("/api/uploads/") ? true : rest.unoptimized}
      onError={() => {
        if (!failed) {
          setFailed(true);
          setCurrent(PLACEHOLDER);
        }
      }}
    />
  );
}
