import type { Metadata } from "next";
import Link from "next/link";
import { getMarkdownPage } from "@/lib/posts";
import { getSiteData } from "@/lib/site-data";
import SubNav from "@/components/SubNav";
import { PillLink } from "@/components/PillLink";
import RevealInit from "@/components/RevealInit";

const siteData = getSiteData();

export const instant = false;

export const metadata: Metadata = {
  title: "Tentang",
  description: `Kenalan dengan orang di balik ${siteData.name}.`,
};

/**
 * HALAMAN TENTANG — isi teksnya di-edit lewat file markdown:
 * content/pages/tentang.md (pola yang sama dengan post blog).
 */
export default async function TentangPage() {
  const page = await getMarkdownPage("tentang");

  return (
    <>
      <SubNav title="Tentang">
        <Link
          href="/terhubung"
          prefetch={true}
          className="text-caption text-ink transition-colors hover:text-primary"
        >
          Terhubung
        </Link>
      </SubNav>

      <section className="bg-parchment py-16 md:py-20">
        <div className="mx-auto max-w-[980px] px-5">
          <h1 data-reveal-split className="text-hero text-ink">
            {page?.title ?? "Tentang"}
            <span className="text-ink-muted-48">.</span>
          </h1>
          <p
            data-reveal
            data-reveal-delay="0.3"
            className="mt-5 max-w-xl text-lead text-ink-muted-80"
          >
            {page?.excerpt ||
              "Kenalan dengan orang di balik LUX0RIA — cerita, motivasi, dan hal-hal di balik layar."}
          </p>

          {page ? (
            <div className="mx-auto max-w-[720px]">
              <div
                data-reveal
                data-reveal-delay="0.5"
                className="article mt-12"
                dangerouslySetInnerHTML={{ __html: page.contentHtml }}
              />
            </div>
          ) : (
            <p className="mt-8 text-lead-airy text-ink-muted-80">
              Belum ada konten. Buat file{" "}
              <code>content/pages/tentang.md</code> untuk mengisinya.
            </p>
          )}

          {/* CTA penutup */}
          <div
            data-reveal
            className="mt-16 rounded-lg bg-canvas p-8 text-center"
          >
            <p className="text-tagline text-ink">Ngobrol atau dukung?</p>
            <p className="mt-2 text-body text-ink-muted-80">
              Semua link-ku ada di satu tempat — dan traktir kopi selalu
              diterima dengan senang hati.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <PillLink href="/terhubung">Terhubung denganku</PillLink>
              <PillLink href="/donasi" variant="ghost">
                Donasi
              </PillLink>
            </div>
          </div>
        </div>
      </section>

      {/* Mesin animasi GSAP halaman ini */}
      <RevealInit />
    </>
  );
}
