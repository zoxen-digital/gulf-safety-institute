import { Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { SiteData } from "@/lib/site-data";
import { InquiryForm } from "./InquiryForm";

/** Shared body for /contact and /request-quote; each route keeps its own page file and metadata. */
export function ContactBody({ data, defaultType, defaultCourse }: { data: SiteData; defaultType: string; defaultCourse?: string }) {
  const s = data.settings;
  const courses = data.categories.flatMap((c) => c.courses.map((k) => ({ slug: k.slug, name: k.name, group: `${c.code}. ${c.shortName}` })));
  const head = data.locations.find((l) => l.isHeadOffice) || data.locations[0];
  const wa = s.whatsapp.replace(/[^\d]/g, "");
  const hasContact = s.phone || s.email || wa || s.address;
  return (
    <section className="section bg-cream">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_360px]">
        <InquiryForm courses={courses} defaultType={defaultType} defaultCourse={defaultCourse} />
        <aside className="space-y-5">
          {hasContact && (
            <div className="card p-6">
              <h2 className="font-heading text-lg font-bold text-navy-dark">Contact details</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {s.address && <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-gold" aria-hidden />{s.address}</li>}
                {s.phone && <li><a href={`tel:${s.phone.replace(/\s/g, "")}`} className="flex gap-3 hover:text-gold"><Phone className="h-5 w-5 text-gold" aria-hidden />{s.phone}</a></li>}
                {s.email && <li><a href={`mailto:${s.email}`} className="flex gap-3 hover:text-gold"><Mail className="h-5 w-5 text-gold" aria-hidden />{s.email}</a></li>}
              </ul>
              {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn mt-5 w-full bg-[#1f8f4e] text-white hover:bg-[#177540]"><MessageCircle className="h-4 w-4" aria-hidden /> Chat on WhatsApp</a>}
            </div>
          )}
          {head && (
            <div className="card p-6">
              <h2 className="font-heading text-lg font-bold text-navy-dark">{head.isHeadOffice ? "Head office" : "Our location"}</h2>
              <p className="mt-2 text-sm text-ink">{head.name} · {head.country}</p>
              {head.address && <p className="mt-1 text-sm text-muted">{head.address}</p>}
              {head.mapUrl ? (
                <a href={head.mapUrl} target="_blank" rel="noopener noreferrer" className="link-gold mt-4">Open in Maps</a>
              ) : (
                <Link href="/locations" className="link-gold mt-4">All locations</Link>
              )}
            </div>
          )}
          <div className="card bg-navy p-6 text-white">
            <ShieldCheck className="h-8 w-8 text-gold" aria-hidden />
            <h2 className="mt-3 font-heading text-lg font-bold">Checking a certificate?</h2>
            <p className="mt-1 text-sm text-white/75">Verify any GSI certificate instantly, 24/7.</p>
            <Link href="/verify" className="btn-gold mt-4 w-full">Verify Certificate</Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
