"use client";

import { useState, useRef } from "react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUploader({
  value,
  onChange,
  label = "Cover Image",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        onChange(data.url);
      } else {
        setError(data.error || "Gagal mengunggah gambar.");
      }
    } catch {
      setError("Terjadi kesalahan saat mengunggah.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemove() {
    onChange("");
    setError("");
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-neutral-300">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-xs text-neutral-400 hover:text-white transition-colors underline"
        >
          {showManualUrl ? "Gunakan Upload File" : "Atau Input URL"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-900/30 border border-red-800 rounded px-2.5 py-1.5">
          {error}
        </p>
      )}

      {showManualUrl ? (
        <div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/image.jpg atau /uploads/..."
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
            id="cover-image-input"
          />

          {value ? (
            <div className="relative overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Cover Preview"
                className="w-full h-48 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2v6h-6" />
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                    <path d="M3 22v-6h6" />
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  </svg>
                  <span>{uploading ? "Mengunggah..." : "Ganti Gambar"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-700 hover:border-neutral-500 bg-neutral-900/60 p-6 cursor-pointer transition-colors"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">
                {uploading ? "Mengunggah gambar..." : "Klik untuk Pilih & Upload Gambar"}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Format: JPG, PNG, WebP, GIF (Maksimal 5MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
