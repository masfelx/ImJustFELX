"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BerandaData, BerandaCard } from "@/lib/admin-data";

const CARD_ICONS = ["heart", "coffee", "instagram", "user", "globe", "spark", "gift"];

export default function AdminBerandaPage() {
  const [form, setForm] = useState<BerandaData>({
    hero_badge: "",
    hero_title: "",
    hero_subtitle: "",
    cta_primary_text: "",
    cta_primary_url: "",
    cta_secondary_text: "",
    cta_secondary_url: "",
    cta_tertiary_text: "",
    cta_tertiary_url: "",
    posts_heading: "",
    explore_heading: "",
    explore_items: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/beranda")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data");
        return res.json();
      })
      .then((data: BerandaData) => {
        setForm(data);
      })
      .catch(() => setMessage({ type: "error", text: "Gagal memuat pengaturan Beranda." }))
      .finally(() => setLoading(false));
  }, []);

  function updateField<K extends keyof BerandaData>(field: K, value: BerandaData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateCard(index: number, field: keyof BerandaCard, value: string) {
    const updated = [...(form.explore_items || [])];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      updateField("explore_items", updated);
    }
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/beranda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Pengaturan Beranda berhasil disimpan dan langsung aktif!" });
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
    return <div className="py-20 text-center text-neutral-500">Memuat editor Beranda...</div>;
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">Kelola Konten Beranda</h1>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              Live Real-Time
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            Atur teks hero utama, tombol aksi (CTA), dan kartu navigasi jelajahi di halaman depan website.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Lihat di Website</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* Alert status */}
      {message && (
        <div
          className={`mb-6 rounded-xl border p-4 text-sm transition-all ${
            message.type === "success"
              ? "border-green-800/80 bg-green-950/30 text-green-400"
              : "border-red-800/80 bg-red-950/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* ================= 1. HERO SECTION ================= */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
          <div className="border-b border-neutral-800 pb-3">
            <h2 className="text-base font-semibold text-white">1. Hero Section (Bagian Paling Atas)</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Teks pembuka dan tombol utama yang pertama kali dilihat pengunjung.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-400">Badge / Label Atas</label>
              <input
                type="text"
                value={form.hero_badge}
                onChange={(e) => updateField("hero_badge", e.target.value)}
                placeholder="Blog pribadi · LUX0RIA"
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-400">
                Judul Utama Headline * (Mendukung baris baru / Enter)
              </label>
              <textarea
                rows={2}
                value={form.hero_title}
                onChange={(e) => updateField("hero_title", e.target.value)}
                placeholder={"Cerita, catatan,\ndan karya."}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-sm text-white font-sans outline-none focus:border-blue-500 transition-colors leading-relaxed"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                💡 Tekan Enter untuk membuat teks turun ke baris berikutnya.
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-400">Deskripsi Sub-headline / Pengantar</label>
              <input
                type="text"
                value={form.hero_subtitle}
                onChange={(e) => updateField("hero_subtitle", e.target.value)}
                placeholder="Komunitas gaming & blog resmi LUX0RIA"
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Tombol Aksi CTA */}
          <div className="pt-4 border-t border-neutral-800/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-3">
              3 Tombol Aksi Hero (Call-To-Action)
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              {/* CTA 1 */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-4 space-y-3">
                <span className="text-xs font-medium text-blue-400">Tombol Utama (Biru / Solid)</span>
                <div>
                  <label className="block text-[11px] text-neutral-400">Teks Tombol</label>
                  <input
                    type="text"
                    value={form.cta_primary_text}
                    onChange={(e) => updateField("cta_primary_text", e.target.value)}
                    placeholder="Baca Blog"
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400">Link Tujuan</label>
                  <input
                    type="text"
                    value={form.cta_primary_url}
                    onChange={(e) => updateField("cta_primary_url", e.target.value)}
                    placeholder="/blog"
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* CTA 2 */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-4 space-y-3">
                <span className="text-xs font-medium text-neutral-300">Tombol Kedua (Ghost)</span>
                <div>
                  <label className="block text-[11px] text-neutral-400">Teks Tombol</label>
                  <input
                    type="text"
                    value={form.cta_secondary_text}
                    onChange={(e) => updateField("cta_secondary_text", e.target.value)}
                    placeholder="Cerita"
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400">Link Tujuan</label>
                  <input
                    type="text"
                    value={form.cta_secondary_url}
                    onChange={(e) => updateField("cta_secondary_url", e.target.value)}
                    placeholder="/cerita"
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* CTA 3 */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-4 space-y-3">
                <span className="text-xs font-medium text-neutral-300">Tombol Ketiga (Ghost)</span>
                <div>
                  <label className="block text-[11px] text-neutral-400">Teks Tombol</label>
                  <input
                    type="text"
                    value={form.cta_tertiary_text}
                    onChange={(e) => updateField("cta_tertiary_text", e.target.value)}
                    placeholder="Donasi"
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400">Link Tujuan</label>
                  <input
                    type="text"
                    value={form.cta_tertiary_url}
                    onChange={(e) => updateField("cta_tertiary_url", e.target.value)}
                    placeholder="/donasi"
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. SECTION TULISAN TERBARU ================= */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
          <div className="border-b border-neutral-800 pb-3">
            <h2 className="text-base font-semibold text-white">2. Bagian Tulisan Terbaru (Dark Tile)</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Judul bagian kartu artikel terbaru yang tampil di atas background gelap.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400">Judul Bagian</label>
            <input
              type="text"
              value={form.posts_heading}
              onChange={(e) => updateField("posts_heading", e.target.value)}
              placeholder="Tulisan terbaru."
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* ================= 3. SECTION JELAJAHI ================= */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
          <div className="border-b border-neutral-800 pb-3">
            <h2 className="text-base font-semibold text-white">3. Bagian Jelajahi (Kartu Navigasi)</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Atur judul dan 4 kartu navigasi utama website di bagian bawah beranda.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400">Judul Bagian</label>
            <input
              type="text"
              value={form.explore_heading}
              onChange={(e) => updateField("explore_heading", e.target.value)}
              placeholder="Jelajahi."
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(form.explore_items || []).map((card, idx) => (
              <div key={idx} className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300">Kartu #{idx + 1}</span>
                  <select
                    value={card.icon}
                    onChange={(e) => updateCard(idx, "icon", e.target.value)}
                    className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-white outline-none"
                  >
                    {CARD_ICONS.map((ic) => (
                      <option key={ic} value={ic}>Ikon: {ic}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] text-neutral-400">Nama / Judul</label>
                    <input
                      type="text"
                      value={card.name}
                      onChange={(e) => updateCard(idx, "name", e.target.value)}
                      placeholder="Contoh: Cerita"
                      className="mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400">Link Tujuan</label>
                    <input
                      type="text"
                      value={card.href}
                      onChange={(e) => updateCard(idx, "href", e.target.value)}
                      placeholder="/cerita"
                      className="mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400">Deskripsi Singkat</label>
                  <input
                    type="text"
                    value={card.description}
                    onChange={(e) => updateCard(idx, "description", e.target.value)}
                    placeholder="Deskripsi singkat..."
                    className="mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Bottom Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <Link
            href="/"
            target="_blank"
            className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            Lihat Beranda
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </>
  );
}
