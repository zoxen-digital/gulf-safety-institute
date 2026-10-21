"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

type C = { name: string; slug: string; shortDescription: string; href: string; tag?: string };

export function CourseSearch({ courses, label = "Search courses" }: { courses: C[]; label?: string }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? courses.filter((c) => (c.name + " " + (c.tag || "")).toLowerCase().includes(t)) : courses;
  }, [q, courses]);
  return (
    <div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <label htmlFor="course-q" className="sr-only">{label}</label>
        <input id="course-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={label} className="input pl-10" />
      </div>
      <p className="mt-3 text-xs text-muted" aria-live="polite">{list.length} course{list.length === 1 ? "" : "s"}</p>
      {list.length === 0 ? (
        <p className="mt-6 rounded-md bg-cream p-6 text-sm text-muted">No courses match &ldquo;{q}&rdquo;. Try a different keyword or <Link href="/contact" className="font-semibold text-navy underline">ask our team</Link>.</p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {list.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="card group flex h-full items-start justify-between gap-4 p-5 transition hover:border-gold/60">
                <div>
                  {c.tag && <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">{c.tag}</p>}
                  <h3 className="font-heading text-[15px] font-bold leading-snug text-navy-dark">{c.name}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted">{c.shortDescription}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gold transition group-hover:translate-x-1" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
