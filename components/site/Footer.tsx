import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { SiteData } from "@/lib/site-data";
import { Logo } from "./Logo";

const SOCIAL_LABEL: Record<string, string> = { linkedin: "LinkedIn", facebook: "Facebook", instagram: "Instagram", x: "X", youtube: "YouTube" };

export function Footer({ data }: { data: SiteData }) {
  const s = data.settings;
  const socials = Object.entries(s.social).filter(([, v]) => v);
  const wa = s.whatsapp.replace(/[^\d]/g, "");
  return (
    <footer className="border-t-2 border-gold bg-navy-dark text-white/80">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_1fr_1.1fr]">
        <div>
          <Logo logoUrl={s.logoUrl} name={s.instituteName} fullName={s.instituteFullName} dark />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">{s.footerText}</p>
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-3 text-sm">
              {socials.map(([k, v]) => (
                <li key={k}>
                  <a href={v} target="_blank" rel="noopener noreferrer" className="rounded border border-white/15 px-3 py-1.5 hover:border-gold hover:text-gold">
                    {SOCIAL_LABEL[k] || k}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <FooterCol title="Explore">
          {[["/", "Home"], ["/about", "About Us"], ["/services", "Services"], ["/locations", "Locations"], ["/contact", "Contact Us"], ["/verify", "Verify Certificate"]].map(([h, l]) => (
            <li key={h}><Link href={h} className="hover:text-gold">{l}</Link></li>
          ))}
        </FooterCol>
        <FooterCol title="Training">
          <li><Link href="/services" className="hover:text-gold">All Courses</Link></li>
          {data.categories.map((c) => (
            <li key={c.slug}><Link href={`/services/${c.slug}`} className="hover:text-gold">{c.shortName}</Link></li>
          ))}
        </FooterCol>
        <FooterCol title="Get in touch">
          <li>{s.utilityText}</li>
          <li>Saudi Arabia · UAE · Qatar · Kuwait · Oman · Bahrain</li>
          {s.address && <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />{s.address}</li>}
          {s.phone && <li><a href={`tel:${s.phone.replace(/\s/g, "")}`} className="flex gap-2 hover:text-gold"><Phone className="h-4 w-4 text-gold" aria-hidden />{s.phone}</a></li>}
          {wa && <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex gap-2 hover:text-gold"><MessageCircle className="h-4 w-4 text-gold" aria-hidden />WhatsApp</a></li>}
          {s.email && <li><a href={`mailto:${s.email}`} className="flex gap-2 hover:text-gold"><Mail className="h-4 w-4 text-gold" aria-hidden />{s.email}</a></li>}
          <li><span className="mt-2 block h-[2px] w-10 bg-gold" /></li>
        </FooterCol>
      </div>
      <div className="container-x">
        <div className="flex flex-col gap-3 border-t border-gold/40 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {s.instituteName}. All rights reserved.</p>
          <ul className="flex gap-5">
            <li><Link href="/privacy-policy" className="hover:text-gold">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-gold">Terms of Use</Link></li>
            <li><Link href="/admin/login" className="hover:text-gold" rel="nofollow">Staff Login</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-heading text-sm font-bold text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}
