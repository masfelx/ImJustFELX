"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * RevealInit — Mesin Animasi Scroll & Heading Reveal ala Apple Keynote.
 *
 * Menggunakan GSAP ScrollTrigger dan SplitText untuk menampilkan elemen
 * secara bertingkat (staggered cascade) dengan kurva momentum fluida (power3.out)
 * dan efek dissolve blur lembut khas presentasi Apple.
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
          el.style.filter = "none";
        });
    };

    if (prefersReducedMotion) {
      showAll();
      return;
    }

    const splits: SplitText[] = [];

    try {
      const ctx = gsap.context(() => {
        // 1) Elemen biasa — fade + slide-up + dissolve blur saat masuk viewport
        scope.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
          const rawDelay = parseFloat(el.dataset.revealDelay ?? "0") || 0;
          // Skala delay proporsional agar cascading berurutan terasa alami
          const delay = Math.min(rawDelay * 0.7, 0.35);
          const y = parseFloat(el.dataset.revealY ?? "22") || 22;

          gsap.fromTo(
            el,
            {
              autoAlpha: 0,
              y,
              filter: "blur(6px)",
            },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.65,
              delay,
              ease: "power3.out",
              clearProps: "filter", // Pastikan render font kembali 100% tajam
              scrollTrigger: {
                trigger: el,
                start: "top 92%",
                once: true,
              },
            },
          );
        });

        // 2) Judul — kata demi kata naik secara teatrikal dari balik masker
        scope
          .querySelectorAll<HTMLElement>("[data-reveal-split]")
          .forEach((el) => {
            const rawDelay = parseFloat(el.dataset.revealDelay ?? "0") || 0;
            const delay = Math.min(rawDelay * 0.6, 0.25);
            const split = new SplitText(el, { type: "words", mask: "words" });
            splits.push(split);

            gsap.set(el, { visibility: "visible" });
            gsap.from(split.words, {
              yPercent: 115,
              opacity: 0,
              duration: 0.68,
              ease: "power3.out",
              stagger: 0.035,
              delay,
              scrollTrigger: {
                trigger: el,
                start: "top 94%",
                once: true,
              },
            });
          });
      }, scope);

      // Bersihkan timeline, trigger, dan split DOM saat komponen unmount
      return () => {
        ctx.revert();
        splits.forEach((s) => s.revert());
      };
    } catch {
      // Fallback aman jika browser memblokir atau terjadi kendala plugin
      showAll();
    }
  }, []);

  // Marker tersembunyi — penanda akhir halaman
  return <div ref={ref} aria-hidden="true" className="hidden" />;
}
