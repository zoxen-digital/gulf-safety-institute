import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";

export function Logo({ logoUrl, name, fullName, dark = false }: { logoUrl?: string; name: string; fullName: string; dark?: boolean }) {
  return (
    <Link href="/" className="block shrink-0" aria-label={`${name} home`}>
      <span className={`relative block ${dark ? "h-[100px] w-[196px] rounded-md bg-white p-2" : "h-[64px] w-[124px] sm:h-[76px] sm:w-[156px]"}`}>
        <SafeImage
          src={logoUrl || "/brand/gsi-logo.png"}
          alt={fullName || name}
          fill
          sizes={dark ? "196px" : "(min-width: 640px) 156px, 124px"}
          className={`object-contain ${dark ? "p-2" : ""}`}
          priority={!dark}
        />
      </span>
    </Link>
  );
}
