import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/site-data";
import { siteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-montserrat", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: s.seoTitle, template: `%s | ${s.instituteName}` },
    description: s.seoDescription,
    icons: { icon: s.faviconUrl || "/brand/gsi-icon.png" },
    verification: { google: "iM3trziljqta0EgqH1pXoXzta6VlgNrhoY6tgQYcSxc" },
    openGraph: { type: "website", siteName: s.instituteName, title: s.seoTitle, description: s.seoDescription, images: [s.home.heroImage] },
  };
}

export const viewport: Viewport = { themeColor: "#14294F", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // dir/lang are kept here so an Arabic (RTL) locale can be introduced by switching these values.
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
