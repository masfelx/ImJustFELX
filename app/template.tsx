"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Next.js Template — Berjalan pada setiap perpindahan halaman (route transition).
 * Memberikan animasi transisi masuk (page enter) yang sangat halus dengan
 * kurva perlambatan khas Apple (power3.out) dan efek dissolve blur lembut.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Hormati preferensi pengguna untuk reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    // Animasi masuk halaman baru: dissolve blur + float-up mikro
    gsap.fromTo(
      el,
      {
        opacity: 0,
        y: 12,
        filter: "blur(6px)",
      },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.45,
        ease: "power3.out",
        clearProps: "transform,filter", // Pastikan tidak mengganggu koordinat sticky/fixed setelah selesai
      }
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full flex-1 flex flex-col will-change-[opacity,transform,filter]"
    >
      {children}
    </div>
  );
}
