import { PillLink } from "@/components/PillLink";
import RevealInit from "@/components/RevealInit";

/** 404 — gaya Apple: tenang, satu CTA biru. */
export default function NotFound() {
  return (
    <>
      <section className="bg-canvas py-24 md:py-32">
      <div className="mx-auto max-w-[980px] px-5 text-center">
        <p data-reveal className="text-caption text-ink-muted-48">404</p>
        <h1 data-reveal-split data-reveal-delay="0.1" className="mt-4 text-hero text-ink">
          Halaman yang kamu cari
          <br />
          tidak ditemukan.
        </h1>
        <p
          data-reveal
          data-reveal-delay="0.35"
          className="mx-auto mt-5 max-w-md text-lead text-ink-muted-80"
        >
          Mungkin sudah dipindahkan, atau tautannya salah ketik.
        </p>
        <div
          data-reveal
          data-reveal-delay="0.5"
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <PillLink href="/">Kembali ke beranda</PillLink>
          <PillLink href="/blog" variant="ghost">
            Lihat blog
          </PillLink>
        </div>
      </div>
    </section>

    {/* Mesin animasi GSAP halaman ini */}
    <RevealInit />
    </>
  );
}
