"use client";
import Link from "next/link";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="section">
      <div className="container-x max-w-xl text-center">
        <h1 className="h2">Something went wrong</h1>
        <p className="mt-3 text-muted">This page could not be loaded. Please try again.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button type="button" onClick={reset} className="btn-navy">Try again</button>
          <Link href="/" className="btn-outline">Home</Link>
        </div>
      </div>
    </section>
  );
}
