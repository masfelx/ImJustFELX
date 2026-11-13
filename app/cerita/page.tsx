import type { Metadata } from "next";
import Link from "next/link";
import SubNav from "@/components/SubNav";
import CeritaFeed from "@/components/CeritaFeed";
import RevealInit from "@/components/RevealInit";

export const metadata: Metadata = {
  title: "Cerita",
  description:
    "Bagikan cerita, curhat, dan pikiran kamu secara anonim. Semua orang punya cerita.",
};

/** Halaman Cerita — X/Twitter-like public feed */
export default function CeritaPage() {
  return (
    <>
      <SubNav title="Cerita">
        <Link
          href="/blog"
          prefetch={true}
          className="text-caption text-ink transition-colors hover:text-primary"
        >
          Lihat blog
        </Link>
      </SubNav>

      <section className="bg-parchment py-16 md:py-20">
        <div className="mx-auto max-w-[980px] px-5">
          <h1 data-reveal-split className="text-hero text-ink">
            Cerita<span className="text-ink-muted-48">.</span>
          </h1>
          <p
            data-reveal
            data-reveal-delay="0.3"
            className="mt-5 max-w-xl text-lead text-ink-muted-80"
          >
            Punya cerita? Tulis di sini. Anonim, bebas, tanpa akun —
            semua orang punya cerita yang layak didengar.
          </p>

          {/* Feed + Composer (Client Component) */}
          <div>
            <CeritaFeed />
          </div>
        </div>
      </section>

      {/* Mesin animasi GSAP halaman ini */}
      <RevealInit />
    </>
  );
}
