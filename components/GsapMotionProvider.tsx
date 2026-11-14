"use client";

import { useEffect } from "react";
import gsap from "gsap";

/**
 * GsapMotionProvider — Apple-Grade Interactive Motion Engine
 * Memberikan feedback haptik visual (spring bounce), liquid glass sheen (ripple halus),
 * dan magnetic hover mikro yang terinspirasi dari iOS, macOS Sonoma, dan VisionOS.
 */
export default function GsapMotionProvider() {
  useEffect(() => {
    // Hormati preferensi aksesibilitas pengguna
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let activePressedEl: HTMLElement | null = null;

    // Helper: cari elemen tombol / interaktif terdekat
    const getInteractiveTarget = (e: Event): HTMLElement | null => {
      const target = e.target as HTMLElement | null;
      if (!target) return null;
      return target.closest<HTMLElement>(
        "button, a.rounded-pill, [data-apple-btn], [role='button'], input[type='submit'], .btn-interactive"
      );
    };

    // ── 1. POINTER DOWN: Kompresi pegas taktil (Taptic Spring Press) ──
    const handlePointerDown = (e: PointerEvent) => {
      // Hanya tangkap tombol mouse utama (kiri) atau sentuhan
      if (e.button !== 0 && e.pointerType === "mouse") return;

      const el = getInteractiveTarget(e);
      if (!el) return;

      // Abaikan jika disabled
      if (
        el.hasAttribute("disabled") ||
        el.getAttribute("aria-disabled") === "true" ||
        el.classList.contains("disabled")
      ) {
        return;
      }

      activePressedEl = el;

      // Hitung skala berdasarkan dimensi tombol
      const rect = el.getBoundingClientRect();
      const isSmall = rect.height <= 38 || rect.width <= 38;
      const isLargeCard = rect.height > 120;
      const targetScale = isSmall ? 0.92 : isLargeCard ? 0.985 : 0.955;

      gsap.killTweensOf(el);
      gsap.to(el, {
        scale: targetScale,
        duration: 0.12,
        ease: "power2.out",
        overwrite: "auto",
      });

      // ── Liquid Glass Sheen Ripple ala Apple OLED ──
      try {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const maxDimension = Math.max(rect.width, rect.height);
        const sheenSize = Math.max(maxDimension * 1.8, 80);

        // Pastikan kontainer tombol memiliki overflow hidden dan posisi non-static
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.position === "static") {
          el.style.position = "relative";
        }
        if (computedStyle.overflow !== "hidden") {
          el.style.overflow = "hidden";
        }

        // Tentukan apakah tombol berwarna gelap atau terang
        const isDark =
          el.classList.contains("bg-primary") ||
          el.classList.contains("bg-black") ||
          el.classList.contains("text-white") ||
          computedStyle.backgroundColor.includes("rgb(0,") ||
          computedStyle.color === "rgb(255, 255, 255)";

        const sheen = document.createElement("span");
        sheen.className = isDark ? "apple-glass-sheen" : "apple-glass-sheen-dark";
        sheen.style.width = `${sheenSize}px`;
        sheen.style.height = `${sheenSize}px`;
        sheen.style.left = `${x}px`;
        sheen.style.top = `${y}px`;

        el.appendChild(sheen);

        gsap.fromTo(
          sheen,
          { scale: 0.1, opacity: isDark ? 0.45 : 0.25 },
          {
            scale: 2.2,
            opacity: 0,
            duration: 0.55,
            ease: "power2.out",
            onComplete: () => {
              if (sheen.parentNode) {
                sheen.remove();
              }
            },
          }
        );
      } catch {
        // Fallback aman jika manipulasi DOM lokal terkendala
      }
    };

    // ── 2. POINTER UP: Pantulan pegas responsif (Apple Elastic Rebound) ──
    const handlePointerUp = () => {
      if (!activePressedEl) return;
      const el = activePressedEl;
      activePressedEl = null;

      gsap.to(el, {
        scale: 1,
        duration: 0.4,
        ease: "back.out(2.4)",
        overwrite: "auto",
        clearProps: "transform",
      });
    };

    // ── 3. POINTER CANCEL / LEAVE: Kembali normal saat jari/kursor bergeser keluar ──
    const handlePointerCancel = () => {
      if (!activePressedEl) return;
      const el = activePressedEl;
      activePressedEl = null;

      gsap.to(el, {
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
        clearProps: "transform",
      });
    };

    // ── 4. REACTION POP: Animasi micro-bounce pada tombol Like / Emoji ──
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const likeBtn = target.closest<HTMLElement>(
        "button[aria-label*='suka' i], button[title*='suka' i], .reaction-btn, [data-reaction-pop]"
      );

      if (likeBtn) {
        const icon = likeBtn.querySelector("svg, span");
        if (icon) {
          gsap.timeline()
            .to(icon, {
              scale: 1.35,
              rotate: -8,
              duration: 0.12,
              ease: "power2.out",
            })
            .to(icon, {
              scale: 1,
              rotate: 0,
              duration: 0.42,
              ease: "back.out(3.2)",
              clearProps: "transform",
            });
        }
      }
    };

    // ── 5. MAGNETIC HOVER MIKRO (VisionOS / macOS style) ──
    // Hanya aktif untuk mouse desktop dengan pointer presisi
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    let magneticEl: HTMLElement | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!hasFinePointer) return;
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-magnetic='true'], a.rounded-pill, .btn-magnetic"
      );

      if (target !== magneticEl) {
        if (magneticEl) {
          // Reset elemen lama
          gsap.to(magneticEl, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.4)",
            clearProps: "transform",
          });
        }
        magneticEl = target ?? null;
      }

      if (magneticEl) {
        const rect = magneticEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // Jarak geser mikro maksimal 3.5px agar tetap elegan & mewah
        const deltaX = (e.clientX - centerX) * 0.12;
        const deltaY = (e.clientY - centerY) * 0.12;
        const clampedX = Math.max(Math.min(deltaX, 3.5), -3.5);
        const clampedY = Math.max(Math.min(deltaY, 3.5), -3.5);

        gsap.to(magneticEl, {
          x: clampedX,
          y: clampedY,
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    const handleMouseLeaveDoc = () => {
      if (magneticEl) {
        gsap.to(magneticEl, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.4)",
          clearProps: "transform",
        });
        magneticEl = null;
      }
    };

    // Pasang listener global
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("pointercancel", handlePointerCancel, { passive: true });
    document.addEventListener("click", handleClick, { passive: true });
    window.addEventListener("pointercancel", handlePointerCancel, { passive: true });

    if (hasFinePointer) {
      document.addEventListener("mousemove", handleMouseMove, { passive: true });
      document.addEventListener("mouseleave", handleMouseLeaveDoc, { passive: true });
    }

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
      document.removeEventListener("click", handleClick);
      window.removeEventListener("pointercancel", handlePointerCancel);
      if (hasFinePointer) {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseleave", handleMouseLeaveDoc);
      }
    };
  }, []);

  return null;
}
