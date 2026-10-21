import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container-x max-w-xl text-center">
        <p className="eyebrow justify-center">404</p>
        <h1 className="h2 mt-3">Page not found</h1>
        <p className="mt-3 text-muted">The page you are looking for does not exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn-navy">Back to home</Link>
          <Link href="/services" className="btn-outline">Browse courses</Link>
        </div>
      </div>
    </section>
  );
}
