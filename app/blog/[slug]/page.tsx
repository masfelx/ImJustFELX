import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  formatDate,
  getPostBySlug,
  getPostSummaries,
  type Post,
} from "@/lib/posts";
import { getSiteData } from "@/lib/site-data";
import SubNav from "@/components/SubNav";
import { PillLink } from "@/components/PillLink";
import RevealInit from "@/components/RevealInit";

/* Dipakai oleh generateMetadata & page — biar file hanya dibaca sekali */
const getPost = cache(async (slug: string) => getPostBySlug(slug));

export const instant = false;

export async function generateStaticParams() {
  const posts = await getPostSummaries();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt || getSiteData().description,
    openGraph: {
      title: post.title,
      description: post.excerpt || getSiteData().description,
      type: "article",
      publishedTime: post.date,
    },
  };
}

/** Halaman baca post — satu kolom teks di canvas putih. */
export default async function BlogPostPage({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post: Post | null = await getPost(slug);
  if (!post) notFound();

  return (
    <>
      <SubNav title="Blog">
        <Link
          href="/blog"
          prefetch={true}
          className="text-caption text-ink transition-colors hover:text-primary"
        >
          Semua tulisan
        </Link>
      </SubNav>

      <article className="bg-canvas py-16 md:py-20">
        <div className="mx-auto max-w-[720px] px-5">
          {/* Kepala artikel */}
          <header>
            <p data-reveal className="text-caption text-ink-muted-48">
              {formatDate(post.date)} · {post.readingTime} · {getSiteData().author}
            </p>
            <h1 data-reveal-split data-reveal-delay="0.1" className="mt-4 text-display text-ink">
              {post.title}
            </h1>
            {post.excerpt && (
              <p
                data-reveal
                data-reveal-delay="0.35"
                className="mt-5 text-lead-airy text-ink-muted-80"
              >
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Cover (opsional — tambahkan `cover` di frontmatter) */}
          {post.cover && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.cover}
              alt=""
              className="mt-10 rounded-sm shadow-product"
            />
          )}

          {/* Isi — markdown dirender server-side */}
          <div
            data-reveal
            data-reveal-delay="0.3"
            className="article mt-10"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          {/* Penutup — ajakan dukung */}
          <footer
            data-reveal
            className="mt-16 rounded-lg bg-parchment p-8 text-center"
          >
            <p className="text-tagline text-ink">
              Tulisan ini bermanfaat?
            </p>
            <p className="mt-2 text-body text-ink-muted-80">
              Dukung {getSiteData().name} lewat Saweria, Sociabuzz, atau Sibagi —
              sekecil apa pun sangat berarti.
            </p>
            <div className="mt-6">
              <PillLink href="/donasi">Halaman donasi</PillLink>
            </div>
          </footer>

          <div className="mt-10">
            <Link
              href="/blog"
              prefetch={true}
              className="text-body text-primary hover:underline"
            >
              ← Semua tulisan
            </Link>
          </div>
        </div>
      </article>

      {/* Mesin animasi GSAP halaman ini */}
      <RevealInit />
    </>
  );
}
