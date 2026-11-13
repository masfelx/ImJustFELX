"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminTentangPage() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/tentang")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat");
        return res.json();
      })
      .then((data) => {
        setTitle(data.title || "Tentang");
        setExcerpt(data.excerpt || "");
        setContent(data.content || "");
      })
      .catch(() => setMessage({ type: "error", text: "Gagal memuat konten halaman Tentang." }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/tentang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt, content }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Konten halaman Tentang berhasil disimpan!" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Gagal menyimpan konten." });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal terhubung ke server." });
    } finally {
      setSaving(false);
    }
  }

  function insertFormatting(prefix: string, suffix: string = "") {
    const textarea = document.getElementById("tentang-content-textarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || "teks";
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  }

  if (loading) {
    return <div className="py-20 text-center text-neutral-500">Memuat editor Tentang...</div>;
  }

  const wordCount = content.replace(/[#>*`~\-[\]()]/g, " ").split(/\s+/).filter(Boolean).length;

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">Kelola Halaman Tentang</h1>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              Live Real-Time
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            Edit profil, cerita pengantar, dan konten yang tampil di halaman <code>/tentang</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tentang"
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

      {/* Form Container */}
      <div className="space-y-6">
        {/* Card Metadata / Header Halaman */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
            Header & Meta Halaman
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-400">Judul Utama Halaman *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Tentang"
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
              />
              <span className="mt-1 block text-[11px] text-neutral-500">
                Judul besar yang tampil di bagian atas halaman publik.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400">Deskripsi Subtitle / Lead</label>
              <input
                type="text"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Kenalan dengan orang di balik LUX0RIA..."
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
              />
              <span className="mt-1 block text-[11px] text-neutral-500">
                Teks pengantar di bawah judul (maks. 1–2 kalimat).
              </span>
            </div>
          </div>
        </div>

        {/* Card Editor Konten Markdown */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
                Isi Konten Halaman (Markdown)
              </h2>
              <span className="text-xs text-neutral-500">
                {wordCount} kata · Estimasi baca ~{Math.max(1, Math.round(wordCount / 200))} menit
              </span>
            </div>

            {/* Tab Edit / Preview */}
            <div className="flex rounded-lg bg-neutral-800 p-1 border border-neutral-700">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`rounded-md px-3.5 py-1 text-xs font-medium transition-colors ${
                  activeTab === "edit"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`rounded-md px-3.5 py-1 text-xs font-medium transition-colors ${
                  activeTab === "preview"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Pratinjau
              </button>
            </div>
          </div>

          {activeTab === "edit" ? (
            <>
              {/* Toolbar Markdown Ringkas */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-lg border border-neutral-800 bg-black/40 p-2">
                <button
                  type="button"
                  onClick={() => insertFormatting("## ")}
                  className="rounded px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 font-mono"
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("### ")}
                  className="rounded px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 font-mono"
                  title="Heading 3"
                >
                  H3
                </button>
                <div className="h-4 w-px bg-neutral-700 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormatting("**", "**")}
                  className="rounded px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 font-bold"
                  title="Tebal (Bold)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("*", "*")}
                  className="rounded px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 italic"
                  title="Miring (Italic)"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("- ")}
                  className="rounded px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                  title="Bullet List"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("> ")}
                  className="rounded px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                  title="Kutipan"
                >
                  &ldquo; Kutipan
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("[", "](https://example.com)")}
                  className="rounded px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                  title="Link"
                >
                  🔗 Link
                </button>
              </div>

              {/* Textarea */}
              <textarea
                id="tentang-content-textarea"
                rows={18}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tulis cerita perkenalan, sejarah situs, atau informasi profil kamu di sini menggunakan format Markdown..."
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 p-4 font-mono text-sm leading-relaxed text-white outline-none focus:border-blue-500 transition-colors"
              />
            </>
          ) : (
            /* Tab Pratinjau Teks Bersih */
            <div className="min-h-[400px] rounded-lg border border-neutral-800 bg-neutral-950 p-6">
              <div className="prose prose-invert max-w-none text-neutral-300">
                <h1 className="text-3xl font-bold text-white mb-2">{title || "Tentang"}</h1>
                {excerpt && <p className="text-lg text-neutral-400 italic mb-6">{excerpt}</p>}
                <div className="whitespace-pre-wrap font-sans leading-relaxed text-sm text-neutral-200">
                  {content}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
            <span>💡 Mendukung format Markdown standar (Heading, List, Link, dll).</span>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
