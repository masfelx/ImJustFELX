"use client";

import { useEffect, useState } from "react";

type DonasiItem = {
  name: string;
  url: string;
  description?: string;
  icon?: string;
};

const ICON_OPTIONS = ["coffee", "spark", "gift", "heart", "link", "globe"];

export default function AdminDonasiPage() {
  const [items, setItems] = useState<DonasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/donasi")
      .then((res) => res.json())
      .then(setItems)
      .catch(() => setMessage({ type: "error", text: "Gagal memuat data." }))
      .finally(() => setLoading(false));
  }, []);

  function addItem() {
    setItems([...items, { name: "", url: "https://", description: "", icon: "coffee" }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof DonasiItem, value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function moveItem(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;
    const updated = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setItems(updated);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/donasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Data donasi berhasil disimpan!" });
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
    return <div className="py-20 text-center text-neutral-500">Memuat data donasi...</div>;
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Donasi</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Tambah, edit, atau hapus metode donasi yang tampil di website.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-800 bg-green-900/30 text-green-400"
              : "border-red-800 bg-red-900/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-400">
                #{index + 1}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 disabled:opacity-30"
                  title="Pindah ke atas"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveItem(index, "down")}
                  disabled={index === items.length - 1}
                  className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 disabled:opacity-30"
                  title="Pindah ke bawah"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeItem(index)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 transition-colors"
                  title="Hapus"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Hapus</span>
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-neutral-500">
                  Nama *
                </label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  placeholder="Saweria"
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500">
                  URL *
                </label>
                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => updateItem(index, "url", e.target.value)}
                  placeholder="https://saweria.co/username"
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500">
                  Deskripsi
                </label>
                <input
                  type="text"
                  value={item.description || ""}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  placeholder="Deskripsi singkat..."
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500">
                  Ikon
                </label>
                <select
                  value={item.icon || "coffee"}
                  onChange={(e) => updateItem(index, "icon", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addItem}
        className="mt-6 w-full rounded-xl border-2 border-dashed border-neutral-700 py-4 text-sm font-medium text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
      >
        + Tambah Metode Donasi
      </button>
    </>
  );
}
