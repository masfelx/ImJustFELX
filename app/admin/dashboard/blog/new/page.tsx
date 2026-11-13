"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    date: "",
    excerpt: "",
    cover: "",
    content: "",
  });

  // Set date client-side to avoid prerender issues
  useEffect(() => {
    setForm((f) => ({ ...f, date: new Date().toISOString().split("T")[0] }));
  }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: string, value: string) {
    setForm({ ...form, [field]: value });
  }

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleTitleChange(value: string) {
    setForm({ ...form, title: value, slug: autoSlug(value) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/admin/dashboard/blog");
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan artikel.");
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Tulis Artikel Baru</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tulis konten dalam format Markdown.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Judul *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="Judul artikel..."
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300">Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              required
              pattern="[a-z0-9-]+"
              placeholder="judul-artikel"
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-neutral-600">URL: /blog/{form.slug || "..."}</p>
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

          <div className="sm:col-span-2">
            <ImageUploader
              value={form.cover}
              onChange={(url) => updateField("cover", url)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Excerpt</label>
          <input
            type="text"
            value={form.excerpt}
            onChange={(e) => updateField("excerpt", e.target.value)}
            placeholder="Ringkasan singkat untuk preview..."
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Konten (Markdown) *</label>
          <textarea
            value={form.content}
            onChange={(e) => updateField("content", e.target.value)}
            required
            rows={20}
            placeholder="Tulis artikel di sini dalam format Markdown...

# Heading 1
## Heading 2

Paragraf biasa **bold** dan *italic*.

- List item 1
- List item 2

> Blockquote"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500 font-mono text-sm resize-y"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {saving ? "Menyimpan..." : "Publish Artikel"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-neutral-700 px-6 py-3 text-sm text-neutral-400 hover:bg-neutral-800 transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </>
  );
}
