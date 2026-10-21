"use client";
import { useState } from "react";
import { Mail, MapPin, Navigation, Phone, Star } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import type { PubLocation } from "@/lib/site-data";

export function LocationsList({ locations }: { locations: PubLocation[] }) {
  const countries = Array.from(new Set(locations.map((l) => l.country)));
  const [country, setCountry] = useState("All");
  const list = country === "All" ? locations : locations.filter((l) => l.country === country);
  if (!locations.length) return <p className="rounded-md bg-cream p-8 text-center text-muted">Our training locations will be published here soon.</p>;
  return (
    <div>
      {countries.length > 1 && (
        <div role="group" aria-label="Filter by country" className="mb-8 flex flex-wrap gap-2">
          {["All", ...countries].map((c) => (
            <button key={c} type="button" aria-pressed={country === c} onClick={() => setCountry(c)} className={`btn btn-sm border ${country === c ? "border-navy bg-navy text-white" : "border-black/10 bg-white text-navy hover:border-navy"}`}>
              {c}
            </button>
          ))}
        </div>
      )}
      <ul className="grid gap-6 md:grid-cols-2">
        {list.map((l) => (
          <li key={l.id} className="card flex flex-col overflow-hidden">
            <div className="relative aspect-[16/8]">
              <SafeImage src={l.imageUrl} alt={`${l.city}, ${l.country}`} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
              {l.isHeadOffice && (
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded bg-gold px-2.5 py-1 text-xs font-bold text-navy-dark">
                  <Star className="h-3.5 w-3.5" aria-hidden /> Head Office
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h2 className="font-heading text-xl font-bold text-navy-dark">{l.name}</h2>
              <p className="text-sm text-muted">{[l.label, l.city !== l.name ? l.city : "", l.country].filter(Boolean).join(" · ")}</p>
              {l.description && <p className="mt-3 text-sm text-ink/85">{l.description}</p>}
              <ul className="mt-4 space-y-2 text-sm">
                {l.address && <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />{l.address}</li>}
                {l.phone && <li><a className="flex gap-2 hover:text-gold" href={`tel:${l.phone.replace(/\s/g, "")}`}><Phone className="h-4 w-4 text-gold" aria-hidden />{l.phone}</a></li>}
                {l.email && <li><a className="flex gap-2 hover:text-gold" href={`mailto:${l.email}`}><Mail className="h-4 w-4 text-gold" aria-hidden />{l.email}</a></li>}
              </ul>
              {l.mapUrl && (
                <a href={l.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-outline mt-5 self-start">
                  <Navigation className="h-4 w-4" aria-hidden /> Open in Maps
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
