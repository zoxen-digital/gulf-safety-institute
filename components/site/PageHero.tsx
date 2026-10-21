import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";

export type Crumb = { href?: string; label: string };

export function Breadcrumbs({ items, light = false }: { items: Crumb[]; light?: boolean }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className={`flex flex-wrap items-center gap-1.5 text-xs ${light ? "text-white/70" : "text-muted"}`}>
        {[{ href: "/", label: "Home" }, ...items].map((c, i, a) => (
          <li key={i} className="flex items-center gap-1.5">
            {c.href && i < a.length - 1 ? (
              <Link href={c.href} className="hover:text-gold">{c.label}</Link>
            ) : (
              <span aria-current="page" className={light ? "text-white" : "text-ink"}>{c.label}</span>
            )}
            {i < a.length - 1 && <ChevronRight className="h-3 w-3" aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({ eyebrow, title, text, image, crumbs, children }: { eyebrow: string; title: string; text?: string; image?: string; crumbs: Crumb[]; children?: React.ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-dark text-white">
      {image && (
        <SafeImage src={image} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-dark via-navy-dark/85 to-navy-dark/40" />
      <div className="container-x py-14 sm:py-20">
        <Breadcrumbs items={crumbs} light />
        <p className="eyebrow mt-6 reveal">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-[30px] font-extrabold leading-[1.1] sm:text-[44px] reveal reveal-delay-1">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg reveal reveal-delay-2">{text}</p>}
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, className = "" }: { eyebrow: string; title: string; className?: string }) {
  return (
    <div className={className}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h2 mt-3">{title}</h2>
    </div>
  );
}
