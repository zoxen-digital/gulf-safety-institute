"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, ShieldCheck, X } from "lucide-react";

type NavCat = { code: string; shortName: string; slug: string };

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services", dropdown: true },
  { href: "/locations", label: "Locations" },
  { href: "/contact", label: "Contact Us" },
];

export function Header({ logo, categories }: { logo: React.ReactNode; categories: NavCat[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [svc, setSvc] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ddRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    setOpen(false);
    setSvc(false);
  }, [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), setSvc(false));
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);
  useEffect(() => {
    const click = (e: MouseEvent) => ddRef.current && !ddRef.current.contains(e.target as Node) && setSvc(false);
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? "shadow-[0_6px_24px_-12px_rgba(11,26,51,.25)]" : "border-b border-black/5"}`}>
      <div className="container-x flex h-[76px] items-center justify-between gap-4 sm:h-[84px]">
        {logo}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) =>
              n.dropdown ? (
                <li key={n.href} className="relative" ref={ddRef} onMouseEnter={() => setSvc(true)} onMouseLeave={() => setSvc(false)}>
                  <button
                    type="button"
                    aria-expanded={svc}
                    aria-controls="svc-menu"
                    onClick={() => setSvc((v) => !v)}
                    className={`relative flex items-center gap-1 px-4 py-7 text-[14px] font-medium transition hover:text-gold ${active(n.href) ? "text-gold" : "text-navy"}`}
                  >
                    {n.label}
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    {active(n.href) && <span className="absolute inset-x-4 bottom-5 h-[2px] bg-gold" />}
                  </button>
                  <div id="svc-menu" hidden={!svc} className="absolute left-1/2 top-full w-[330px] -translate-x-1/2 pt-0">
                    <ul className="card overflow-hidden py-2">
                      {categories.map((c) => (
                        <li key={c.slug}>
                          <Link href={`/services/${c.slug}`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-cream">
                            <span className="font-heading text-base font-extrabold text-gold">{c.code}</span>
                            {c.shortName}
                          </Link>
                        </li>
                      ))}
                      <li className="mt-1 border-t border-black/5">
                        <Link href="/services" className="block px-4 py-2.5 text-sm font-semibold text-navy hover:bg-cream">
                          View all courses
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active(n.href) ? "page" : undefined}
                    className={`relative block px-4 py-7 text-[14px] font-medium transition hover:text-gold ${active(n.href) ? "text-gold" : "text-navy"}`}
                  >
                    {n.label}
                    {active(n.href) && <span className="absolute inset-x-4 bottom-5 h-[2px] bg-gold" />}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/verify" className="btn-gold hidden px-5 py-2.5 sm:inline-flex">
            <ShieldCheck className="h-4 w-4" aria-hidden /> Verify Certificate
          </Link>
          <Link href="/verify" className="btn-gold px-3 py-2.5 sm:hidden" aria-label="Verify certificate">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </Link>
          <button type="button" className="btn-outline px-3 py-2.5 lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-navy-dark/60" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <span className="font-heading text-lg font-extrabold text-navy">Menu</span>
              <button type="button" className="rounded-md p-2 text-navy hover:bg-cream" aria-label="Close menu" onClick={() => setOpen(false)} autoFocus>
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 px-3 py-3">
              {NAV.map((n) => (
                <div key={n.href}>
                  <Link href={n.href} className={`block rounded-md px-3 py-3 text-base font-medium ${active(n.href) ? "bg-cream text-navy" : "text-ink"}`}>
                    {n.label}
                  </Link>
                  {n.dropdown && (
                    <ul className="mb-2 ml-3 border-l-2 border-gold/40 pl-3">
                      {categories.map((c) => (
                        <li key={c.slug}>
                          <Link href={`/services/${c.slug}`} className="block py-2 text-sm text-muted hover:text-navy">
                            <span className="mr-2 font-bold text-gold">{c.code}</span>
                            {c.shortName}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </nav>
            <div className="border-t border-black/5 p-5">
              <Link href="/verify" className="btn-gold w-full">
                <ShieldCheck className="h-4 w-4" aria-hidden /> Verify Certificate
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
