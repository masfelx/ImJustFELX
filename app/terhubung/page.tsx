import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSiteData } from "@/lib/site-data";
import { getTerhubungAsync } from "@/lib/admin-data";
import { safeUrl } from "@/lib/site";
import SubNav from "@/components/SubNav";
import { PillLink } from "@/components/PillLink";
import { SiteIcon } from "@/components/icons";
import RevealInit from "@/components/RevealInit";
import OtherLinksGrid from "@/components/OtherLinksGrid";

const siteData = getSiteData();

export const instant = false;

export const metadata: Metadata = {
  title: "Terhubung",
  description: `Temukan ${siteData.name} di semua platform sosial media dan website lainnya.`,
};

/**
 * HALAMAN TERHUBUNG — semua sosial media & website lain dalam satu tempat.
 * Sinkron langsung dengan database Supabase Cloud.
 */
export default async function TerhubungPage() {
  const terhubung = await getTerhubungAsync();
  const socials = terhubung.socials || [];
  const otherLinks = terhubung.otherLinks || [];

  return (
    <>
      <SubNav title="Terhubung">
        <Link
          href="/donasi"
          prefetch={true}
          className="text-caption text-ink transition-colors hover:text-primary"
        >
          Dukung
        </Link>
      </SubNav>

      <section className="bg-canvas py-16 md:py-20">
        <div className="mx-auto max-w-[980px] px-5">
          <h1 data-reveal-split className="text-hero text-ink">
            Terhubung<span className="text-ink-muted-48">.</span>
          </h1>
          <p
            data-reveal
            data-reveal-delay="0.3"
            className="mt-5 max-w-xl text-lead text-ink-muted-80"
          >
            Temukan aku di platform sosial, dan lihat website lain yang kubuat
            atau kubawakan.
          </p>

          {/* Sosial media — chip pill hairline ala configurator Apple */}
          {socials.length > 0 && (
            <div className="mt-14">
              <h2 data-reveal className="text-tagline text-ink">
                Sosial media
              </h2>
              <div className="mt-6 flex flex-wrap gap-3">
                {socials.map((social, i) => (
                  <a
                    key={social.url + i}
                    href={safeUrl(social.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-reveal
                    data-reveal-delay={String(0.08 + i * 0.07)}
                    className="inline-flex items-center gap-3 rounded-pill border border-hairline bg-canvas px-4 py-3 text-caption text-ink transition-colors hover:border-ink-muted-48"
                  >
                    <SiteIcon name={social.icon} width={18} height={18} />
                    <span>{social.name}</span>
                    {social.handle && (
                      <span className="text-ink-muted-48">{social.handle}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Website & link lainnya */}
          <div className="mt-14">
            <div className="flex items-center justify-between">
              <h2 data-reveal className="text-tagline text-ink">
                Website lainnya
              </h2>
              <span className="text-caption text-ink-muted-48 font-mono">
                Slot Partner Aktif
              </span>
            </div>

            <Suspense fallback={<div className="mt-6 h-32 rounded-lg bg-canvas/40 animate-pulse" />}>
              <OtherLinksGrid links={otherLinks} />
            </Suspense>
          </div>

          {/* CTA penutup */}
          <div
            data-reveal
            className="mt-16 rounded-lg bg-parchment p-8 text-center"
          >
            <p className="text-tagline text-ink">Mau dukung tulisannya?</p>
            <p className="mt-2 text-body text-ink-muted-80">
              Ada halaman khusus untuk itu — pilih platform favoritmu.
            </p>
            <div className="mt-6">
              <PillLink href="/donasi">Halaman donasi</PillLink>
            </div>
          </div>
        </div>
      </section>

      {/* Mesin animasi GSAP halaman ini */}
      <RevealInit />
    </>
  );
}
