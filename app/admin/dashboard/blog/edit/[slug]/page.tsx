"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";

function EditForm() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [form, setForm] = useState({
    title: "",
    date: "",
    excerpt: "",
    cover: "",
    content: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/admin/blog/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Post tidak ditemukan");
        return res.json();
      })
      .then((data) => {
        setForm({
          title: data.title || "",
          date: data.date || "",
          excerpt: data.excerpt || "",
          cover: data.cover || "",
          content: data.content || "",
        });
      })
      .catch(() => setError("Artikel tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [slug]);

  function updateField(field: string, value: string) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/blog/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage("Artikel berhasil disimpan!");
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan.");
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-neutral-500">Memuat artikel...</div>;
  }

  if (error && !form.title) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => router.push("/admin/dashboard/blog")}
          className="mt-4 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800"
        >
          ← Kembali ke Blog
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Artikel</h1>
          <p className="mt-1 text-sm text-neutral-500 font-mono">/blog/{slug}</p>
        </div>
        <a
          href={`/blog/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Lihat di Website
        </a>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-6 rounded-lg border border-green-800 bg-green-900/30 px-4 py-3 text-sm text-green-400">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Judul *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300">Tanggal</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300">Excerpt</label>
            <input
              type="text"
              value={form.excerpt}
              onChange={(e) => updateField("excerpt", e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <ImageUploader
              value={form.cover}
              onChange={(url) => updateField("cover", url)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Konten (Markdown) *</label>
          <textarea
            value={form.content}
            onChange={(e) => updateField("content", e.target.value)}
            required
            rows={20}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500 font-mono text-sm resize-y"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/dashboard/blog")}
            className="rounded-lg border border-neutral-700 px-6 py-3 text-sm text-neutral-400 hover:bg-neutral-800 transition-colors"
          >
            ← Kembali
          </button>
        </div>
      </form>
    </>
  );
}

export default function EditBlogPostPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-neutral-500">Memuat...</div>}>
      <EditForm />
    </Suspense>
  );
}
