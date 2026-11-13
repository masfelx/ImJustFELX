import type { Metadata } from "next";
import Link from "next/link";
import { getPostSummaries } from "@/lib/posts";
import SubNav from "@/components/SubNav";
import { PostCard } from "@/components/PostCard";
import { getSiteData } from "@/lib/site-data";
import RevealInit from "@/components/RevealInit";

export const metadata: Metadata = {
  title: "Blog",
  description: `Kumpulan tulisan dari ${getSiteData().name} — cerita, catatan, dan karya.`,
};

/** Halaman daftar tulisan — canvas parchment + kartu utilitas putih. */
export const instant = false;

export default async function BlogPage() {
  const posts = await getPostSummaries();

  return (
    <>
      <SubNav title="Blog">
        <Link
          href="/donasi"
          prefetch={true}
          className="text-caption text-ink transition-colors hover:text-primary"
        >
          Dukung
        </Link>
      </SubNav>

      <section className="bg-parchment py-16 md:py-20">
        <div className="mx-auto max-w-[980px] px-5">
          <h1 data-reveal-split className="text-hero text-ink">Tulisan.</h1>
          <p
            data-reveal
            data-reveal-delay="0.3"
            className="mt-4 max-w-xl text-lead text-ink-muted-80"
          >
            Semua catatan, cerita, dan karya — dari yang paling baru.
          </p>

          {posts.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {posts.map((post, i) => (
                <div
                  key={post.slug}
                  data-reveal
                  data-reveal-delay={String(0.06 + i * 0.08)}
                >
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-12 text-lead-airy text-ink-muted-80">
              Belum ada tulisan. Tambahkan file <code>.md</code> di folder{" "}
              <code>content/posts</code> untuk memulai.
            </p>
          )}
        </div>
      </section>

      {/* Mesin animasi GSAP halaman ini */}
      <RevealInit />
    </>
  );
}
