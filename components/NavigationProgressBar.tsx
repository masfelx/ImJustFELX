"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

/**
 * Top Navigation Progress Bar berbasis GSAP.
 * Memberikan feedback visual seketika (0ms) saat user mengklik tautan internal.
 * Animasi akselerasi fluida dengan glow laser Apple Action Blue (#0066cc).
 */
export default function NavigationProgressBar() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Selesai navigasi saat pathname berubah (halaman baru selesai dimuat)
  useEffect(() => {
    const bar = barRef.current;
    const container = containerRef.current;
    if (!bar || !container) return;

    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    // Meluncur mulus ke 100%, lalu fade-out lembut
    gsap.timeline()
      .to(bar, {
        width: "100%",
        duration: 0.22,
        ease: "power2.out",
      })
      .to(container, {
        opacity: 0,
        duration: 0.28,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(bar, { width: "0%" });
          gsap.set(container, { opacity: 0 });
        },
      });
  }, [pathname]);

  // Tangkap klik tautan internal untuk memicu progress bar seketika
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
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

      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl || href === window.location.pathname) {
        return;
      }

      const bar = barRef.current;
      const container = containerRef.current;
      if (!bar || !container) return;

      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      // Reset & tampilkan
      gsap.set(container, { opacity: 1 });
      gsap.set(bar, { width: "0%" });

      // Meluncur cepat ke 35%, lalu merayap halus ke 82% menunggu streaming RSC halaman baru
      const tl = gsap.timeline();
      tl.to(bar, {
        width: "35%",
        duration: 0.25,
        ease: "power2.out",
      }).to(bar, {
        width: "82%",
        duration: 2.4,
        ease: "power1.out",
      });

      timelineRef.current = tl;
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 h-[2.5px] pointer-events-none opacity-0 overflow-hidden"
    >
      <div
        ref={barRef}
        className="h-full w-0 bg-gradient-to-r from-[#0066cc] via-[#2997ff] to-[#60a5fa] shadow-[0_0_12px_#2997ff,0_0_4px_#60a5fa]"
      />
    </div>
  );
}
