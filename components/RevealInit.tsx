"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Mesin animasi GSAP untuk satu halaman.
 *
 * Diletakkan sebagai elemen TERAKHIR di tiap halaman — dengan begitu
 * efeknya hanya berjalan SETELAH seluruh konten halaman selesai
 * di-hydrate React (aman dari hydration mismatch + streaming SSR).
 *
 * Cara pakai — cukup atribut di elemen HTML (lihat app/globals.css):
 *   data-reveal             → fade + naik saat masuk viewport
 *   data-reveal-delay="0.2" → jeda sebelum animasi (detik)
 *   data-reveal-y="40"      → jarak naik awal (px)
 *   data-reveal-split       → tiap KATA judul naik dari balik masker
 */
export default function RevealInit() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marker = ref.current;
    if (!marker) return;
    const scope =
      (marker.closest("main") as HTMLElement | null) ?? document.body;

    // Hormati preferensi pengguna yang mematikan animasi
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const showAll = () => {
      scope
        .querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-split]")
        .forEach((el) => {
          el.style.visibility = "visible";
          el.style.opacity = "1";
        });
    };

    if (prefersReducedMotion) {
      showAll();
      return;
    }

    const splits: SplitText[] = [];

    try {
      const ctx = gsap.context(() => {
        // 1) Elemen biasa — fade + slide-up saat masuk viewport (responsif & cepat)
        scope.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
          const rawDelay = parseFloat(el.dataset.revealDelay ?? "0") || 0;
          const delay = Math.min(rawDelay, 0.15);
          const y = parseFloat(el.dataset.revealY ?? "18") || 18;
          gsap.fromTo(
            el,
            { autoAlpha: 0, y },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.35,
              delay,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            },
          );
        });

        // 2) Judul — kata demi kata naik dari balik masker (gesit & mulus)
        scope
          .querySelectorAll<HTMLElement>("[data-reveal-split]")
          .forEach((el) => {
            const rawDelay = parseFloat(el.dataset.revealDelay ?? "0") || 0;
            const delay = Math.min(rawDelay, 0.1);
            const split = new SplitText(el, { type: "words", mask: "words" });
            splits.push(split);
            gsap.set(el, { visibility: "visible" });
            gsap.from(split.words, {
              yPercent: 110,
              duration: 0.45,
              ease: "power3.out",
              stagger: 0.025,
              delay,
              scrollTrigger: { trigger: el, start: "top 94%", once: true },
            });
          });
      }, scope);

      // Bersihkan timeline, trigger, dan split DOM saat halaman dilepas
      return () => {
        ctx.revert();
        splits.forEach((s) => s.revert());
      };
    } catch {
      // Kalau GSAP gagal — pastikan konten tetap terlihat
      showAll();
    }
  }, []);

  // Marker tersembunyi — hanya penanda posisi akhir halaman
  return <div ref={ref} aria-hidden="true" className="hidden" />;
}
