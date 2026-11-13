import Link from "next/link";
import { getSiteData } from "@/lib/site-data";
import { getBerandaAsync } from "@/lib/admin-data";
import { getPostSummaries } from "@/lib/posts";
import { PillLink } from "@/components/PillLink";
import { PostRowDark } from "@/components/PostCard";
import { SiteIcon } from "@/components/icons";
import RevealInit from "@/components/RevealInit";

/**
 * BERANDA — tile edge-to-edge ala apple.com:
 * hero putih → tile gelap (tulisan terbaru) → parchment (jelajahi halaman).
 * Data hero, CTA, dan jelajahi terintegrasi dengan Admin Panel & Supabase.
 */
export const instant = false;

export default async function HomePage() {
  const site = getSiteData();
  const beranda = await getBerandaAsync();
  const posts = (await getPostSummaries()).slice(0, 3);
  const explore = beranda.explore_items || [];

  return (
    <>
      {/* ============ HERO — tile putih ============ */}
      <section className="bg-canvas py-24 md:py-32">
        <div className="mx-auto max-w-[980px] px-5 text-center">
          <p
            data-reveal
            className="text-caption text-ink-muted-48"
          >
            {beranda.hero_badge || `Blog pribadi · ${site.name}`}
          </p>
          <h1
            data-reveal-split
            data-reveal-delay="0.1"
            className="mt-4 text-hero text-ink whitespace-pre-line"
          >
            {beranda.hero_title || "Cerita, catatan,\ndan karya."}
          </h1>
          <p
            data-reveal
            data-reveal-delay="0.4"
            className="mx-auto mt-5 max-w-xl text-lead text-ink-muted-80"
          >
            {beranda.hero_subtitle || site.tagline}
          </p>
          <div
            data-reveal
            data-reveal-delay="0.55"
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            {beranda.cta_primary_text && beranda.cta_primary_url && (
              <PillLink href={beranda.cta_primary_url}>
                {beranda.cta_primary_text}
              </PillLink>
            )}
            {beranda.cta_secondary_text && beranda.cta_secondary_url && (
              <PillLink href={beranda.cta_secondary_url} variant="ghost">
                {beranda.cta_secondary_text}
              </PillLink>
            )}
            {beranda.cta_tertiary_text && beranda.cta_tertiary_url && (
              <PillLink href={beranda.cta_tertiary_url} variant="ghost">
                {beranda.cta_tertiary_text}
              </PillLink>
            )}
          </div>
        </div>
      </section>

      {/* ============ TULISAN TERBARU — tile gelap ============ */}
      <section className="bg-tile-1 py-20 text-white md:py-24">
        <div className="mx-auto max-w-[980px] px-5">
          <div
            data-reveal
            className="flex flex-wrap items-end justify-between gap-4"
          >
            <h2 className="text-display text-white">
              {beranda.posts_heading || "Tulisan terbaru."}
            </h2>
            <Link
              href="/blog"
              prefetch={true}
              className="text-body text-primary-on-dark hover:underline"
            >
              Lihat semua
            </Link>
          </div>

          {posts.length > 0 ? (
            <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-8">
              {posts.map((post, i) => (
                <div key={post.slug} data-reveal data-reveal-delay={String(i * 0.12)}>
                  <PostRowDark post={post} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-lead-airy text-body-muted">
              Belum ada tulisan.
            </p>
          )}
        </div>
      </section>

      {/* ============ JELAJAHI — tile parchment ============ */}
      <section className="bg-parchment py-20 md:py-24">
        <div className="mx-auto max-w-[980px] px-5">
          <h2 data-reveal className="text-display text-ink">
            {beranda.explore_heading || "Jelajahi"}<span className="text-ink-muted-48">.</span>
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {explore.map((item, i) => (
              <div key={item.href + i} data-reveal data-reveal-delay={String(i * 0.12)}>
                <Link
                  href={item.href}
                  prefetch={true}
                  className="group flex h-full flex-col rounded-lg border border-hairline bg-canvas p-6 transition-colors hover:border-ink-muted-48"
                >
                  <SiteIcon
                    name={item.icon}
                    width={28}
                    height={28}
                    className="text-ink"
                  />
                  <h3 className="mt-4 text-body-strong text-ink">{item.name}</h3>
                  <p className="mt-2 text-caption text-ink-muted-80">
                    {item.description}
                  </p>
                  <span className="mt-6 text-body text-primary">
                    Kunjungi
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mesin animasi GSAP halaman ini */}
      <RevealInit />
    </>
  );
}
