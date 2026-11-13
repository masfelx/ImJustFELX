import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import GlobalNav from "@/components/GlobalNav";
import Footer from "@/components/Footer";
import NavigationProgressBar from "@/components/NavigationProgressBar";
import { getSiteData } from "@/lib/site-data";

/* Inter = pengganti open-source terdekat untuk SF Pro di luar Apple.
   Stack font memprioritaskan SF Pro asli di platform Apple. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteData = getSiteData();

export const metadata: Metadata = {
  metadataBase: new URL(siteData.url),
  title: {
    default: `${siteData.name} — Blog Pribadi`,
    template: `%s — ${siteData.name}`,
  },
  description: siteData.description,
  openGraph: {
    title: `${siteData.name} — Blog Pribadi`,
    description: siteData.description,
    url: siteData.url,
    siteName: siteData.name,
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = getSiteData();

  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        {/* Jika JavaScript dimatikan, konten ber-animasi tetap terlihat */}
        <noscript>
          <style>{`[data-reveal],[data-reveal-split]{visibility:visible !important}`}</style>
        </noscript>
        <Suspense fallback={<header className="h-14 md:h-16" />}>
          <GlobalNav socials={site.socials} />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Suspense fallback={<footer className="bg-parchment py-16" />}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
