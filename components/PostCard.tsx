import Link from "next/link";
import { formatDate, type PostSummary } from "@/lib/posts";

/**
 * Kartu utilitas putih ala Apple Store — border hairline, radius 18px,
 * tanpa shadow. Judul + tanggal + ringkasan + link "Baca".
 */
export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="flex flex-col rounded-lg border border-hairline bg-canvas p-6">
      <p className="text-caption text-ink-muted-48">
        {formatDate(post.date)} · {post.readingTime}
      </p>
      <h2 className="mt-2 text-tagline text-ink">
        <Link href={`/blog/${post.slug}`} prefetch={true} className="transition-colors hover:text-primary">
          {post.title}
        </Link>
      </h2>
      {post.excerpt && (
        <p className="mt-3 text-body text-ink-muted-80">{post.excerpt}</p>
      )}
      <div className="mt-5">
        <Link
          href={`/blog/${post.slug}`}
          prefetch={true}
          className="text-body text-primary transition-colors hover:underline"
        >
          Baca
        </Link>
      </div>
    </article>
  );
}

/**
 * Baris post di tile gelap beranda — putih untuk judul,
 * abu muted (#ccc) untuk copy, link biru langit (#2997ff).
 */
export function PostRowDark({ post }: { post: PostSummary }) {
  return (
    <article>
      <p className="text-caption text-body-muted">
        {formatDate(post.date)} · {post.readingTime}
      </p>
      <h3 className="mt-2 text-tagline text-white">
        <Link
          href={`/blog/${post.slug}`}
          prefetch={true}
          className="transition-colors hover:text-primary-on-dark"
        >
          {post.title}
        </Link>
      </h3>
      {post.excerpt && (
        <p className="mt-2 max-w-xl text-body text-body-muted">{post.excerpt}</p>
      )}
      <div className="mt-4">
        <Link
          href={`/blog/${post.slug}`}
          prefetch={true}
          className="text-body text-primary-on-dark hover:underline"
        >
          Baca
        </Link>
      </div>
    </article>
  );
}
