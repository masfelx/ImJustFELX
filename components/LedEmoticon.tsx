"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MOODS, MoodInfo, MoodType } from "@/lib/sentiment";

interface LedEmoticonProps {
  /** Mode tampilan: 'header' untuk navbar, 'compact' untuk timeline/composer */
  variant?: "header" | "badge" | "compact";
  /** Override mood manual jika ingin statis */
  currentMood?: MoodInfo;
  /** Tampilkan label teks suasana */
  showLabel?: boolean;
}

/* ── 16 x 9 Matrix Diode Pixel Art Data ─────────────────────── */
const COLS = 16;
const ROWS = 9;

// Helper: Ubah array koordinat [col, row] menjadi Set string "c,r"
function toPixelSet(coords: [number, number][]): Set<string> {
  return new Set(coords.map(([c, r]) => `${c},${r}`));
}

// 1. LOVE — Dua Mata Hati Berdetak + Senyuman
const PIXELS_LOVE = toPixelSet([
  // Mata Hati Kiri
  [2, 1], [4, 1],
  [1, 2], [2, 2], [3, 2], [4, 2], [5, 2],
  [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
  [2, 4], [3, 4], [4, 4],
  [3, 5],
  // Mata Hati Kanan
  [11, 1], [13, 1],
  [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],
  [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],
  [11, 4], [12, 4], [13, 4],
  [12, 5],
  // Senyuman
  [5, 6], [10, 6],
  [6, 7], [7, 7], [8, 7], [9, 7],
]);

// 2. HEARTBREAK — Hati Retak / Patah Besar di Tengah + Air Mata
const PIXELS_HEARTBREAK = toPixelSet([
  // Belahan Kiri Hati
  [4, 1], [5, 1],
  [3, 2], [4, 2], [5, 2],
  [2, 3], [3, 3], [4, 3],
  [2, 4], [3, 4],
  [3, 5], [4, 5],
  [5, 6],
  // Belahan Kanan Hati (Terpisah & Retak)
  [10, 1], [11, 1],
  [10, 2], [11, 2], [12, 2],
  [11, 3], [12, 3], [13, 3],
  [12, 4], [13, 4],
  [11, 5], [12, 5],
  [10, 6],
  // Garis Retakan & Pecahan
  [7, 1], [8, 3], [6, 4], [8, 5], [7, 7],
  // Titik Air Mata
  [1, 6], [1, 7], [14, 6], [14, 7],
]);

// 3. HAPPY / CERIA — Mata Lengkung Ceria (^^) + Pipi Merona + Mulut Tertawa
const PIXELS_HAPPY = toPixelSet([
  // Mata Kiri Lengkung ^
  [2, 3], [3, 2], [4, 2], [5, 3],
  // Mata Kanan Lengkung ^
  [10, 3], [11, 2], [12, 2], [13, 3],
  // Pipi Merona (Blush)
  [1, 4], [2, 4],
  [13, 4], [14, 4],
  // Mulut Tertawa Lebar
  [6, 5], [9, 5],
  [6, 6], [7, 6], [8, 6], [9, 6],
  [7, 7], [8, 7],
]);

// 4. SAD / SEDIH — Mata Sayu + Tetesan Air Mata LED Jatuh
const PIXELS_SAD = toPixelSet([
  // Mata Kiri Sayu Turun
  [2, 2], [3, 2], [4, 3], [5, 4],
  // Mata Kanan Sayu Turun
  [13, 2], [12, 2], [11, 3], [10, 4],
  // Tetesan Air Mata Mengalir di Kiri
  [3, 4], [3, 5], [3, 6], [3, 7],
  // Mulut Melengkung Sedih
  [7, 6], [8, 6],
  [6, 7], [9, 7],
]);

// 5. ANGRY / KESAL — Mata Miring Tajam (\ /) + Mulut Menggeram
const PIXELS_ANGRY = toPixelSet([
  // Alis / Mata Kiri Miring Tajam
  [2, 1], [3, 2], [4, 3], [5, 4],
  [3, 3], [4, 4],
  // Alis / Mata Kanan Miring Tajam
  [13, 1], [12, 2], [11, 3], [10, 4],
  [12, 3], [11, 4],
  // Mulut Geram Zig-zag
  [5, 7], [7, 7], [9, 7],
  [6, 6], [8, 6], [10, 6],
]);

// 6. NEUTRAL / SANTAI — Mata Bulat Cyber Anime Besar
const PIXELS_NEUTRAL = toPixelSet([
  // Mata Bulat Kiri
  [3, 2], [4, 2],
  [2, 3], [3, 3], [4, 3], [5, 3],
  [2, 4], [3, 4], [4, 4], [5, 4],
  [3, 5], [4, 5],
  // Mata Bulat Kanan
  [11, 2], [12, 2],
  [10, 3], [11, 3], [12, 3], [13, 3],
  [10, 4], [11, 4], [12, 4], [13, 4],
  [11, 5], [12, 5],
  // Senyum Kalem
  [7, 7], [8, 7],
]);

// Mata Saat Kedip (Blinking)
const PIXELS_BLINK = toPixelSet([
  [2, 4], [3, 4], [4, 4], [5, 4],
  [10, 4], [11, 4], [12, 4], [13, 4],
  [7, 7], [8, 7],
]);

// Palet warna kontras tinggi khusus latar belakang terang (agar tajam, pekat, & tidak samar)
const MOOD_COLORS_LIGHT: Record<MoodType, string> = {
  neutral: "#0284c7",    // Sky blue segar pekat
  love: "#e11d48",       // Rose pink pekat
  heartbreak: "#7c3aed", // Violet purple pekat
  happy: "#059669",      // Emerald green pekat
  sad: "#2563eb",        // Royal blue pekat
  angry: "#dc2626",      // Crimson red pekat
};

/**
 * Komponen Layar LED Matrix Dioda Berpendar (SVG Based)
 * - 100% Bersih: Tanpa titik-titik hitam unlit yang mengotori background putih
 * - Adaptif: Di layar gelap (navbar) bernuansa neon glowing, di kartu putih bersinar pekat & tajam
 */
function PixelMatrixScreen({
  mood,
  isBlinking,
  size = "normal",
  isDark = false,
}: {
  mood: MoodInfo;
  isBlinking: boolean;
  size?: "normal" | "compact";
  isDark?: boolean;
}) {
  // Pilih matriks piksel sesuai mood
  let activePixels = PIXELS_NEUTRAL;

  if (isBlinking && (mood.type === "neutral" || mood.type === "happy")) {
    activePixels = PIXELS_BLINK;
  } else {
    switch (mood.type) {
      case "love":
        activePixels = PIXELS_LOVE;
        break;
      case "heartbreak":
        activePixels = PIXELS_HEARTBREAK;
        break;
      case "happy":
        activePixels = PIXELS_HAPPY;
        break;
      case "sad":
        activePixels = PIXELS_SAD;
        break;
      case "angry":
        activePixels = PIXELS_ANGRY;
        break;
      case "neutral":
      default:
        activePixels = PIXELS_NEUTRAL;
        break;
    }
  }

  const width = size === "compact" ? 48 : 76;
  const height = size === "compact" ? 28 : 44;
  const lightColor = MOOD_COLORS_LIGHT[mood.type] || "#0284c7";

  return (
    <svg
      viewBox="0 0 84 48"
      width={width}
      height={height}
      className="transition-transform duration-300"
    >
      {isDark && (
        <defs>
          {/* Filter Neon Bloom Glow khusus latar gelap */}
          <filter id={`neon-glow-${mood.type}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      {/* Dioda LED yang MENYALA — 100% Bersih (Tanpa Titik Hitam Kotor) */}
      {isDark ? (
        <g filter={`url(#neon-glow-${mood.type})`}>
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => {
              const isLit = activePixels.has(`${c},${r}`);
              if (!isLit) return null;

              const cx = 5 + c * 4.95;
              const cy = 4.8 + r * 4.8;

              return (
                <g key={`lit-${c}-${r}`}>
                  {/* Pendaran Lingkaran Luar */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="2.2"
                    fill={mood.glowColor}
                    opacity="0.95"
                  />
                  {/* Inti Cahaya Terang di Tengah */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="1.1"
                    fill="#ffffff"
                    opacity="0.95"
                  />
                </g>
              );
            })
          )}
        </g>
      ) : (
        <g>
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => {
              const isLit = activePixels.has(`${c},${r}`);
              if (!isLit) return null;

              const cx = 5 + c * 4.95;
              const cy = 4.8 + r * 4.8;

              return (
                <circle
                  key={`lit-${c}-${r}`}
                  cx={cx}
                  cy={cy}
                  r="2.2"
                  fill={lightColor}
                  className="transition-colors duration-200"
                />
              );
            })
          )}
        </g>
      )}
    </svg>
  );
}

/* ── Main Component ────────────────────────────────────────── */
export default function LedEmoticon({
  variant = "header",
  currentMood,
  showLabel = false,
}: LedEmoticonProps) {
  const [mood, setMood] = useState<MoodInfo>(() => currentMood || MOODS.neutral);
  const effectiveMood = currentMood ?? mood;
  const [isBlinking, setIsBlinking] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Dengarkan event real-time dari input form cerita
  useEffect(() => {
    if (currentMood) return;

    const handleMoodChange = (e: Event) => {
      const customEvent = e as CustomEvent<MoodInfo>;
      if (customEvent.detail) {
        setMood(customEvent.detail);
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 600);
      }
    };

    window.addEventListener("lux0ria:mood", handleMoodChange);
    return () => {
      window.removeEventListener("lux0ria:mood", handleMoodChange);
    };
  }, [currentMood]);

  // Efek kedip LED otomatis setiap 3.8 detik
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3800);

    return () => clearInterval(blinkInterval);
  }, []);

  // ── Varian COMPACT / BADGE (untuk di dalam timeline atau composer pada latar putih) ──
  if (variant === "badge" || variant === "compact") {
    const lightColor = MOOD_COLORS_LIGHT[effectiveMood.type] || "#0284c7";
    return (
      <div className="inline-flex items-center gap-1.5 transition-all duration-300">
        <PixelMatrixScreen
          mood={effectiveMood}
          isBlinking={isBlinking}
          size="compact"
          isDark={false}
        />

        {showLabel && (
          <span
            className="text-[11px] font-mono font-bold tracking-wider transition-colors duration-300 pr-1"
            style={{ color: lightColor }}
          >
            {effectiveMood.label}
          </span>
        )}
      </div>
    );
  }

  // ── Varian HEADER (Layar Gadget LED Bersih Tanpa Border di Navbar Hitam) ──
  return (
    <Link
      href="/"
      className="group relative flex items-center gap-2.5 transition-transform active:scale-95"
      title={`MOOD — Suasana Hati: ${effectiveMood.label}`}
    >
      {/* ── Layar LED Matrix Dioda (Tanpa Border, 100% Bersih & Glowing) ── */}
      <div
        className={`relative flex items-center justify-center transition-all duration-500 ${
          isPulsing ? "scale-105" : ""
        }`}
      >
        <PixelMatrixScreen
          mood={effectiveMood}
          isBlinking={isBlinking}
          size="normal"
          isDark={true}
        />
      </div>

      {/* ── Teks MOOD & Subtitle Suasana ── */}
      <div className="flex flex-col">
        <span className="text-base sm:text-lg font-bold tracking-[0.18em] text-white transition-colors group-hover:text-white/90">
          MOOD
        </span>
        <span
          className="text-[10px] font-mono tracking-widest uppercase transition-colors duration-300"
          style={{ color: effectiveMood.glowColor }}
        >
          {effectiveMood.label}
        </span>
      </div>
    </Link>
  );
}
