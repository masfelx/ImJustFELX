import type { Metadata } from "next";
import Link from "next/link";
import { getSiteData } from "@/lib/site-data";
import { getDonasiAsync, getSiteConfigAsync } from "@/lib/admin-data";
import { safeHostname, safeUrl } from "@/lib/site";
import SubNav from "@/components/SubNav";
import { PillExternalLink, PillLink } from "@/components/PillLink";
import { SiteIcon } from "@/components/icons";
import RevealInit from "@/components/RevealInit";

const siteData = getSiteData();

export const instant = false;

export const metadata: Metadata = {
  title: "Donasi",
  description: `Dukung ${siteData.name} lewat Saweria, Sociabuzz, atau Sibagi — traktir kopi untuk tulisan-tulisan berikutnya.`,
};

/**
 * HALAMAN DONASI — canvas parchment, kartu utilitas putih per platform.
 * Mengambil data live real-time dari Supabase Cloud.
 */
export default async function DonasiPage() {
  const [config, donation] = await Promise.all([
    getSiteConfigAsync(),
    getDonasiAsync(),
  ]);

  return (
    <>
      <SubNav title="Donasi">
        <Link
          href="/cerita"
          prefetch={true}
          className="text-caption text-ink transition-colors hover:text-primary"
        >
          Cerita
        </Link>
      </SubNav>

      <section className="bg-parchment py-16 md:py-20">
        <div className="mx-auto max-w-[980px] px-5">
          <h1 data-reveal-split className="text-hero text-ink">
            Dukung {config.name}
            <span className="text-ink-muted-48">.</span>
          </h1>
          <p
            data-reveal
            data-reveal-delay="0.3"
            className="mt-5 max-w-xl text-lead text-ink-muted-80"
          >
            Kalau tulisan-tulisan di sini bermanfaat buatmu, kamu bisa traktir
            kopi atau dukung lewat platform favoritmu. Sekecil apa pun, sangat
            berarti.
          </p>

          {/* Kartu platform donasi */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {donation.map((item, i) => (
              <div
                key={item.url + i}
                data-reveal
                data-reveal-delay={String(i * 0.12)}
                className="flex flex-col rounded-lg border border-hairline bg-canvas p-6"
              >
                <SiteIcon
                  name={item.icon}
                  width={28}
                  height={28}
                  className="text-ink"
                />
                <h2 className="mt-4 text-body-strong text-ink">{item.name}</h2>
                {item.description && (
                  <p className="mt-2 text-caption text-ink-muted-80">
                    {item.description}
                  </p>
                )}
                <p className="mt-3 text-caption text-ink-muted-48">
                  {safeHostname(item.url)}
                </p>
                <div className="mt-6">
                  <PillExternalLink href={safeUrl(item.url)}>Donasi</PillExternalLink>
                </div>
              </div>
            ))}
          </div>

          {/* Tidak bisa donasi? */}
          <div
            data-reveal
            className="mt-12 rounded-lg border border-hairline bg-canvas p-8 text-center"
          >
            <p className="text-tagline text-ink">Tidak bisa donasi?</p>
            <p className="mt-2 text-body text-ink-muted-80">
              Tenang — membagikan tulisan yang kamu suka juga sudah sangat
              membantu.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <PillLink href="/cerita">Cerita</PillLink>
              <PillLink href="/terhubung" variant="ghost">
                Terhubung
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
