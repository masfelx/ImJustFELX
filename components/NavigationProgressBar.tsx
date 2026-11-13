"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";

/**
 * Top Navigation Progress Bar ala Apple & GitHub.
 * Memberikan feedback visual seketika (instant feedback 0ms) saat user
 * mengklik link ke halaman lain, sehingga website terasa sangat cepat dan responsif.
 */
export default function NavigationProgressBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Selesai loading saat pathname berubah (halaman baru selesai dimuat)
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Pasang listener pada klik tautan internal
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      // Hanya tangkap link internal
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Jika url sama persis dengan halaman saat ini, abaikan
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl || href === window.location.pathname) {
        return;
      }

      // Mulai progress bar seketika
      setLoading(true);
      setProgress(25);

      setTimeout(() => {
        setProgress((prev) => (prev >= 25 && prev < 75 ? 70 : prev));
      }, 100);
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 h-[2.5px] pointer-events-none overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-[#0066cc] via-[#2997ff] to-[#60a5fa] transition-all ease-out shadow-[0_0_8px_#2997ff]"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "150ms" : "300ms",
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
