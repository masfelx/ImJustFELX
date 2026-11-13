"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function loadPosts() {
    setLoading(true);
    fetch("/api/admin/blog")
      .then((res) => res.json())
      .then(setPosts)
      .catch(() => setMessage({ type: "error", text: "Gagal memuat data." }))
      .finally(() => setLoading(false));
  }

  useEffect(loadPosts, []);

  async function handleDelete(slug: string) {
    if (!confirm(`Yakin ingin menghapus artikel "${slug}"?`)) return;

    setDeleting(slug);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/blog/${slug}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "Artikel berhasil dihapus!" });
        loadPosts();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Gagal menghapus." });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal terhubung ke server." });
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-neutral-500">Memuat blog posts...</div>;
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Blog</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {posts.length} artikel
          </p>
        </div>
        <Link
          href="/admin/dashboard/blog/new"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          + Tulis Artikel Baru
        </Link>
      </div>

      {message && (
        <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
          message.type === "success" ? "border-green-800 bg-green-900/30 text-green-400" : "border-red-800 bg-red-900/30 text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 py-16 text-center">
          <p className="text-lg text-neutral-400">Belum ada artikel.</p>
          <Link
            href="/admin/dashboard/blog/new"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            Tulis yang pertama →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-5"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-white truncate">{post.title}</h3>
                <p className="mt-1 text-sm text-neutral-500 truncate">
                  {post.date} · {post.slug}
                </p>
                {post.excerpt && (
                  <p className="mt-1 text-sm text-neutral-600 truncate">{post.excerpt}</p>
                )}
              </div>

              <div className="ml-4 flex shrink-0 items-center gap-2">
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-neutral-700 p-2 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                  title="Lihat di website"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </a>
                <Link
                  href={`/admin/dashboard/blog/edit/${post.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>Edit</span>
                </Link>
                <button
                  onClick={() => handleDelete(post.slug)}
                  disabled={deleting === post.slug}
                  className="inline-flex items-center justify-center rounded-lg border border-red-900/60 p-2 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                  title="Hapus artikel"
                >
                  {deleting === post.slug ? (
                    <span className="w-3.5 text-center">...</span>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
