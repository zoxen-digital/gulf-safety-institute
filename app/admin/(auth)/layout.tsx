import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-navy-dark px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="rounded-lg bg-white px-4 py-3">
            <Image src="/brand/gsi-logo.png" alt="Gulf Safety Institute" width={220} height={118} className="h-auto w-[220px]" priority />
          </div>
          <p className="text-xs text-gold">Administration</p>
        </div>
        <div className="rounded-[10px] border-t-4 border-gold bg-white p-7 shadow-2xl sm:p-8">{children}</div>
      </div>
    </main>
  );
}
