"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import type { LinkItem } from "@/lib/site";
import { SiteIcon } from "@/components/icons";
import LedEmoticon from "@/components/LedEmoticon";

let cachedGlobalSocials: LinkItem[] | null = null;

function GlobalNavInner({ socials }: { socials: LinkItem[] }) {
  const [open, setOpen] = useState(false);
  const [liveSocials, setLiveSocials] = useState<LinkItem[]>(cachedGlobalSocials || socials || []);
  const pathname = usePathname();

  // Fetch live socials dari Supabase / API hanya sekali per sesi
  useEffect(() => {
    if (cachedGlobalSocials) return;
    fetch("/api/terhubung")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.socials) && data.socials.length > 0) {
          cachedGlobalSocials = data.socials;
          setLiveSocials(data.socials);
        }
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/donasi", label: "Donasi" },
    { href: "/terhubung", label: "Terhubung" },
    { href: "/tentang", label: "Tentang" },
    { href: "/blog", label: "Blog" },
    { href: "/cerita", label: "Cerita" },
  ];

  // Helper status halaman aktif
  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Tutup menu otomatis jika rute berpindah
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Kunci scroll halaman saat mobile drawer aktif
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Tutup drawer jika tombol Escape ditekan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Tampilkan maksimal 3 ikon sosial di kanan (desktop)
  const quickSocials = liveSocials.slice(0, 3);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-md text-white transition-all">
        <nav className="mx-auto flex h-14 md:h-16 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
          {/* Wordmark & Emoticon LED Interaktif */}
          <div onClick={() => setOpen(false)}>
            <LedEmoticon variant="header" />
          </div>

          {/* Link Navigasi Utama — Desktop & Tablet */}
          <div className="hidden items-center gap-7 lg:gap-9 md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={`text-sm md:text-[15px] font-medium transition-colors ${
                    active
                      ? "text-white font-semibold"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Ikon Sosial Media — Desktop */}
          <div className="hidden items-center gap-4 lg:gap-5 md:flex">
            {quickSocials.map((social) => (
              <a
                key={social.url}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                title={social.name}
                className="p-1.5 text-white/80 transition-all hover:scale-110 hover:text-white"
              >
                <SiteIcon name={social.icon} width={19} height={19} />
              </a>
            ))}
          </div>

          {/* Tombol Hamburger — Mobile (3 Garis) */}
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/90 hover:bg-white/10 md:hidden transition-colors"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>
        </nav>
      </header>

      {/* ── Mobile Navigation Drawer (Slide ke samping dari kanan) ── */}
      {/* Backdrop Gelap Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel — Slide Horizontal dari Kanan */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 flex h-full w-[290px] sm:w-[320px] max-w-[85vw] flex-col justify-between border-l border-white/10 bg-[#0a0a0e]/95 backdrop-blur-2xl shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
          open ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu Navigasi Mobile"
      >
        {/* Header Drawer */}
        <div className="flex h-14 sm:h-16 items-center justify-between border-b border-white/10 px-5">
          <div onClick={() => setOpen(false)} className="scale-90 origin-left">
            <LedEmoticon variant="header" />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all active:scale-95"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Daftar Link Menu Navigasi */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-white/40">
            Navigasi
          </div>
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={() => setOpen(false)}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-[15px] font-medium transition-all ${
                  active
                    ? "bg-white/10 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0066cc] shadow-[0_0_8px_#2997ff]" />
                  )}
                  {link.label}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${
                    active
                      ? "text-white translate-x-0.5"
                      : "text-white/25 group-hover:text-white/60 group-hover:translate-x-0.5"
                  }`}
                  aria-hidden
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            );
          })}
        </div>

        {/* Footer Drawer: Social Links & Brand Info */}
        <div className="border-t border-white/10 p-5 space-y-3.5">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-white/40">
            Terhubung
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {liveSocials.map((social) => (
              <a
                key={social.url}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                title={social.name}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition-all hover:border-white/25 hover:bg-white/15 hover:text-white active:scale-95"
              >
                <SiteIcon name={social.icon} width={18} height={18} />
              </a>
            ))}
          </div>
          <div className="pt-1 text-[11px] font-mono text-white/35">
            LUX0RIA &copy; 2026 &middot; Blog &amp; Portfolio
          </div>
        </div>
      </aside>
    </>
  );
}

/**
 * Wrapper Suspense agar hook usePathname() tidak memblokir proses prerendering static pages pada Next.js 16.
 */
export default function GlobalNav({ socials }: { socials: LinkItem[] }) {
  return (
    <Suspense
      fallback={
        <header className="fixed top-0 z-50 w-full border-b border-hairline bg-canvas/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-[980px] items-center justify-between px-5 md:h-16" />
        </header>
      }
    >
      <GlobalNavInner socials={socials} />
    </Suspense>
  );
}
