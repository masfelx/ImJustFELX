"use client";

import { useEffect, useState } from "react";

type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  url: string;
  author: string;
};

export default function AdminSitePage() {
  const [config, setConfig] = useState<SiteConfig>({
    name: "",
    tagline: "",
    description: "",
    url: "",
    author: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/site")
      .then((res) => res.json())
      .then(setConfig)
      .catch(() => setMessage({ type: "error", text: "Gagal memuat konfigurasi." }))
      .finally(() => setLoading(false));
  }, []);

  function updateField(field: keyof SiteConfig, value: string) {
    setConfig({ ...config, [field]: value });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Konfigurasi berhasil disimpan!" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Gagal menyimpan." });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal terhubung ke server." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-neutral-500">Memuat konfigurasi...</div>;
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Site Config</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Edit nama, tagline, deskripsi, dan informasi umum website.
        </p>
      </div>

      {message && (
        <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
          message.type === "success" ? "border-green-800 bg-green-900/30 text-green-400" : "border-red-800 bg-red-900/30 text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-neutral-300">Nama Situs *</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-neutral-600">Tampil di navbar, footer, dan judul tab browser.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Tagline *</label>
          <input
            type="text"
            value={config.tagline}
            onChange={(e) => updateField("tagline", e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-neutral-600">Tampil di hero section beranda.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Deskripsi SEO *</label>
          <textarea
            value={config.description}
            onChange={(e) => updateField("description", e.target.value)}
            required
            rows={3}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500 resize-none"
          />
          <p className="mt-1 text-xs text-neutral-600">Untuk meta description & preview saat link dibagikan.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">URL Website *</label>
          <input
            type="url"
            value={config.url}
            onChange={(e) => updateField("url", e.target.value)}
            required
            placeholder="https://lux0ria.vercel.app"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-neutral-600">URL live website setelah deploy.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Nama Penulis *</label>
          <input
            type="text"
            value={config.author}
            onChange={(e) => updateField("author", e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
        </button>
      </form>
    </>
  );
}
