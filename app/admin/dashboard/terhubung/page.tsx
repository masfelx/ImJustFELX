"use client";

import { useEffect, useState } from "react";

type TerhubungItem = {
  name: string;
  url: string;
  description?: string;
  icon?: string;
  handle?: string;
  expires_at?: string;
  duration_plan?: string;
};

const SOCIAL_ICONS = ["instagram", "youtube", "tiktok", "x"];
const LINK_ICONS = ["globe", "link", "coffee", "spark", "gift", "heart"];

/* ── Editor untuk Sosial Media ── */
function SocialItemEditor({
  items,
  setItems,
}: {
  items: TerhubungItem[];
  setItems: (items: TerhubungItem[]) => void;
}) {
  function addItem() {
    setItems([
      ...items,
      { name: "", url: "https://", description: "", icon: SOCIAL_ICONS[0], handle: "" },
    ]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof TerhubungItem, value: string) {
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

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">#{index + 1} {item.name ? `· ${item.name}` : ""}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => moveItem(index, "up")}
                disabled={index === 0}
                className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, "down")}
                disabled={index === items.length - 1}
                className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 transition-colors"
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
              <label className="block text-xs font-medium text-neutral-500">Nama *</label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(index, "name", e.target.value)}
                placeholder="Instagram"
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500">URL *</label>
              <input
                type="url"
                value={item.url}
                onChange={(e) => updateItem(index, "url", e.target.value)}
                placeholder="https://instagram.com/username"
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500">Handle</label>
              <input
                type="text"
                value={item.handle || ""}
                onChange={(e) => updateItem(index, "handle", e.target.value)}
                placeholder="@username"
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500">Ikon</label>
              <select
                value={item.icon || SOCIAL_ICONS[0]}
                onChange={(e) => updateItem(index, "icon", e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                {SOCIAL_ICONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full rounded-xl border-2 border-dashed border-neutral-700 py-3.5 text-xs font-medium text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
      >
        + Tambah Sosial Media
      </button>
    </div>
  );
}

/* ── Editor untuk Website Lainnya & Durasi Auto-Expiry ── */
function OtherLinksEditor({
  items,
  setItems,
}: {
  items: TerhubungItem[];
  setItems: (items: TerhubungItem[]) => void;
}) {
  function addItem() {
    setItems([
      ...items,
      {
        name: "",
        url: "https://",
        description: "",
        icon: LINK_ICONS[0],
        duration_plan: "1_month",
        expires_at: calculateFutureDate(30),
      },
    ]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof TerhubungItem, value: string) {
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

  // Helper tambah hari ke tanggal saat ini
  function calculateFutureDate(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  // Terapkan preset durasi
  function applyDurationPreset(index: number, days: number | null, planLabel: string) {
    const updated = [...items];
    if (days === null) {
      // Permanen
      updated[index] = {
        ...updated[index],
        expires_at: "",
        duration_plan: "permanent",
      };
    } else {
      updated[index] = {
        ...updated[index],
        expires_at: calculateFutureDate(days),
        duration_plan: planLabel,
      };
    }
    setItems(updated);
  }

  // Cek status masa aktif
  function getStatusInfo(expires_at?: string) {
    if (!expires_at || expires_at.trim() === "") {
      return {
        isPermanent: true,
        isExpired: false,
        daysRemaining: null,
        label: "Permanen · Tampil Selamanya",
        color: "bg-neutral-800 text-neutral-300 border-neutral-700",
      };
    }

    const expTime = new Date(expires_at).getTime();
    if (isNaN(expTime)) {
      return {
        isPermanent: true,
        isExpired: false,
        daysRemaining: null,
        label: "Tanggal Tidak Valid",
        color: "bg-neutral-800 text-neutral-400 border-neutral-700",
      };
    }

    // Hitung toleransi akhir hari
    const endOfDay = expTime + (24 * 60 * 60 * 1000 - 1);
    const now = Date.now();
    const diffMs = endOfDay - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs > 0) {
      return {
        isPermanent: false,
        isExpired: false,
        daysRemaining: diffDays,
        label: `Aktif · Sisa ${diffDays} hari (s/d ${expires_at})`,
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    } else {
      return {
        isPermanent: false,
        isExpired: true,
        daysRemaining: diffDays,
        label: `Kedaluwarsa (${expires_at}) · Tersembunyi Otomatis`,
        color: "bg-red-500/10 text-red-400 border-red-500/30",
      };
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const status = getStatusInfo(item.expires_at);

        return (
          <div
            key={index}
            className={`rounded-xl border p-5 transition-colors ${
              status.isExpired
                ? "border-red-900/40 bg-red-950/10"
                : "border-neutral-800 bg-neutral-900/50"
            }`}
          >
            {/* Header Item */}
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-white">
                  #{index + 1} {item.name ? `· ${item.name}` : "· Website Baru"}
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 disabled:opacity-30"
                  title="Pindah ke atas"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, "down")}
                  disabled={index === items.length - 1}
                  className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 disabled:opacity-30"
                  title="Pindah ke bawah"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Hapus</span>
                </button>
              </div>
            </div>

            {/* Form Fields Utama */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-neutral-400">Nama Website / Brand *</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  placeholder="Contoh: Livara PB Private"
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400">URL Website *</label>
                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => updateItem(index, "url", e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400">Deskripsi Singkat Promosi</label>
                <input
                  type="text"
                  value={item.description || ""}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  placeholder="Deskripsi singkat seputar website..."
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400">Ikon Kartu</label>
                <select
                  value={item.icon || LINK_ICONS[0]}
                  onChange={(e) => updateItem(index, "icon", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  {LINK_ICONS.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bagian Manajemen Durasi Sewa & Auto-Expiry */}
            <div className="mt-5 rounded-lg border border-neutral-800 bg-black/40 p-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Durasi Sewa & Kedaluwarsa Otomatis
                </span>
                <span className="text-[11px] text-neutral-500">
                  {status.isExpired ? "Status: Tidak Tampil di Publik" : "Status: Tampil di Publik"}
                </span>
              </div>

              {/* Tombol Cepat Preset Durasi */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-neutral-400 mr-1">Atur Durasi:</span>
                <button
                  type="button"
                  onClick={() => applyDurationPreset(index, 30, "1_month")}
                  className="rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-2.5 py-1 text-xs text-white transition-colors"
                >
                  + 1 Bulan (30 Hari)
                </button>
                <button
                  type="button"
                  onClick={() => applyDurationPreset(index, 180, "6_months")}
                  className="rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-2.5 py-1 text-xs text-white transition-colors"
                >
                  + 6 Bulan (180 Hari)
                </button>
                <button
                  type="button"
                  onClick={() => applyDurationPreset(index, 365, "1_year")}
                  className="rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-2.5 py-1 text-xs text-white transition-colors"
                >
                  + 1 Tahun (365 Hari)
                </button>
                <button
                  type="button"
                  onClick={() => applyDurationPreset(index, null, "permanent")}
                  className="rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 transition-colors"
                >
                  Permanen
                </button>
              </div>

              {/* Input Tanggal Manual */}
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] text-neutral-400">
                    Batas Tanggal Kedaluwarsa (YYYY-MM-DD):
                  </label>
                  <input
                    type="date"
                    value={item.expires_at || ""}
                    onChange={(e) => updateItem(index, "expires_at", e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div className="text-[11px] text-neutral-500 max-w-sm pt-4">
                  💡 Jika tanggal ini lewat, link ini <strong>otomatis hilang</strong> dari halaman publik tanpa Anda perlu menghapusnya manual.
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addItem}
        className="w-full rounded-xl border-2 border-dashed border-neutral-700 py-3.5 text-xs font-medium text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
      >
        + Tambah Website Lainnya
      </button>
    </div>
  );
}

export default function AdminTerhubungPage() {
  const [socials, setSocials] = useState<TerhubungItem[]>([]);
  const [otherLinks, setOtherLinks] = useState<TerhubungItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/terhubung")
      .then((res) => res.json())
      .then((data) => {
        setSocials(data.socials || []);
        setOtherLinks(data.otherLinks || []);
      })
      .catch(() => setMessage({ type: "error", text: "Gagal memuat data." }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/terhubung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socials, otherLinks }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Data terhubung berhasil disimpan!" });
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
    return <div className="py-20 text-center text-neutral-500">Memuat data terhubung...</div>;
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Terhubung & Sponsor Website</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Atur sosial media, website partner sponsor, serta durasi sewa otomatis (auto-expiry).
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
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

      {/* Website & Link Partner Lainnya dengan Durasi */}
      <div className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Website Sponsor & Partner ({otherLinks.length})</span>
          </h2>
          <span className="text-xs text-neutral-500">
            Link kedaluwarsa otomatis disembunyikan dari publik
          </span>
        </div>
        <OtherLinksEditor items={otherLinks} setItems={setOtherLinks} />
      </div>

      {/* Sosial Media */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
          </svg>
          <span>Sosial Media ({socials.length})</span>
        </h2>
        <SocialItemEditor items={socials} setItems={setSocials} />
      </div>
    </>
  );
}
