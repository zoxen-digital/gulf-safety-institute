import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-4 text-center">
      <div>
        <p className="font-heading text-6xl font-extrabold text-gold">404</p>
        <h1 className="mt-3 font-heading text-2xl font-bold text-navy-dark">Page not found</h1>
        <p className="mt-2 text-muted">The page you are looking for does not exist or has moved.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-navy">Home</Link>
          <Link href="/verify" className="btn-outline">Verify a certificate</Link>
        </div>
      </div>
    </main>
  );
}
