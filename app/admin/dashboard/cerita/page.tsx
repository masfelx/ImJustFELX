"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type Cerita = {
  id: string;
  author_name: string;
  author_handle: string;
  content: string;
  avatar_color: string;
  likes: number;
  created_at: string;
  replies?: Array<{ id: string; author_name: string; content: string }>;
  is_vip?: boolean;
  proof_image_url?: string;
  image_url?: string;
};

type VipSettings = {
  quota: number;
  initial_quota: number;
  price_per_vip: number;
  qris_image_url: string;
  total_earned: number;
  total_transactions: number;
  analytics?: VipAnalytics;
};

type DailyData = { date: string; count: number; amount: number };
type WeeklyData = { week: string; count: number; amount: number };
type MonthlyData = { month: string; count: number; amount: number };
type TopUser = { name: string; count: number; amount: number };

type VipAnalytics = {
  daily: DailyData[];
  weekly: WeeklyData[];
  monthly: MonthlyData[];
  avg_per_day: number;
  peak_hour: number | null;
  peak_hour_count: number;
  top_users: TopUser[];
  projection_30d: number;
};

export default function AdminCeritaPage() {
  const [stories, setStories] = useState<Cerita[]>([]);
  const [vipSettings, setVipSettings] = useState<VipSettings>({
    quota: 500000,
    initial_quota: 500000,
    price_per_vip: 5000,
    qris_image_url: "/qris-default.svg",
    total_earned: 0,
    total_transactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // VIP Admin controls state
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaInput, setQuotaInput] = useState("500000");
  const [savingQuota, setSavingQuota] = useState(false);
  const [uploadingQris, setUploadingQris] = useState(false);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const qrisFileInputRef = useRef<HTMLInputElement>(null);

  // Reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMode, setResetMode] = useState<"full" | "history">("full");
  const [resetting, setResetting] = useState(false);

  // Analisis tab
  const [analyticsTab, setAnalyticsTab] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    Promise.all([
      fetch("/api/cerita", { cache: "no-store" }).then((res) => res.json()).catch(() => []),
      fetch("/api/admin/vip", { cache: "no-store" }).then((res) => res.json()).catch(() => null),
    ]).then(([storiesData, vipData]) => {
      if (Array.isArray(storiesData)) setStories(storiesData);
      if (vipData && typeof vipData.quota === "number") {
        setVipSettings(vipData);
        setQuotaInput(String(vipData.quota));
      }
      setLoading(false);
    });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Hapus cerita ini? Tidak bisa dikembalikan.")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/cerita/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert("Gagal menghapus cerita.");
      }
    } catch {
      alert("Terjadi kesalahan.");
    } finally {
      setDeleting(null);
    }
  }

  // Update kuota admin
  async function handleSaveQuota(e: React.FormEvent) {
    e.preventDefault();
    const val = parseInt(quotaInput, 10);
    if (isNaN(val) || val < 0) {
      alert("Masukkan nominal kuota valid.");
      return;
    }

    setSavingQuota(true);
    try {
      const res = await fetch("/api/admin/vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quota: val,
          initial_quota: val,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVipSettings((prev) => ({ ...prev, ...data }));
        setShowQuotaModal(false);
      } else {
        alert("Gagal memperbarui kuota.");
      }
    } catch {
      alert("Koneksi gagal.");
    } finally {
      setSavingQuota(false);
    }
  }

  // Upload gambar QRIS admin kustom
  async function handleQrisUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQris(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/vip/qris-upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setVipSettings((prev) => ({
          ...prev,
          qris_image_url: data.qris_image_url,
        }));
        alert("Gambar QRIS berhasil diperbarui.");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Gagal mengunggah QRIS.");
      }
    } catch {
      alert("Terjadi kesalahan saat upload QRIS.");
    } finally {
      setUploadingQris(false);
      if (qrisFileInputRef.current) qrisFileInputRef.current.value = "";
    }
  }

  // Reset transaksi VIP
  async function handleReset() {
    setResetting(true);
    try {
      const res = await fetch("/api/admin/vip", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: resetMode }),
      });

      if (res.ok) {
        const data = await res.json();
        setVipSettings((prev) => ({
          ...prev,
          total_earned: data.total_earned ?? prev.total_earned,
          total_transactions: data.total_transactions ?? prev.total_transactions,
          analytics: undefined,
        }));
        setShowResetModal(false);

        // Re-fetch data segar
        const fresh = await fetch("/api/admin/vip", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
        if (fresh && typeof fresh.quota === "number") setVipSettings(fresh);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Gagal mereset transaksi.");
      }
    } catch {
      alert("Koneksi gagal.");
    } finally {
      setResetting(false);
    }
  }

  const analytics = vipSettings.analytics;

  // Helper: format rupiah pendek
  function fmtRp(n: number) {
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
    if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
    return `Rp ${n.toLocaleString("id-ID")}`;
  }

  // Bar chart data berdasarkan tab aktif
  function getChartData(): { label: string; count: number; amount: number }[] {
    if (!analytics) return [];
    if (analyticsTab === "daily") {
      return analytics.daily.map((d) => ({
        label: d.date.slice(5), // MM-DD
        count: d.count,
        amount: d.amount,
      }));
    }
    if (analyticsTab === "weekly") {
      return analytics.weekly.map((w) => ({
        label: `W ${w.week}`,
        count: w.count,
        amount: w.amount,
      }));
    }
    return analytics.monthly.map((m) => ({
      label: m.month.slice(5), // MM
      count: m.count,
      amount: m.amount,
    }));
  }

  if (loading) {
    return (
      <>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Moderasi Cerita & Kuota VIP</h1>
            <div className="mt-2 h-4 w-48 rounded bg-neutral-800 animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="h-10 w-full rounded bg-neutral-800 animate-pulse" />
            </div>
          ))}
        </div>
      </>
    );
  }

  const chartData = getChartData();
  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1);

  return (
    <>
      {/* ── Top Header Bar ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moderasi Cerita & Kuota VIP</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Kelola kuota sistem VIP, gambar QRIS pembayaran, analisis, dan moderasi konten.
          </p>
        </div>
        <Link
          href="/cerita"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          <span>Buka Halaman Cerita</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Link>
      </div>

      {/* ── 3 Kartu Manajemen Kuota VIP & QRIS Admin ── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {/* Card 1: Sisa Kuota Admin */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Sisa Kuota Admin
            </span>
            <button
              onClick={() => setShowQuotaModal(true)}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 underline"
            >
              Ubah / Isi Ulang
            </button>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            Rp {vipSettings.quota.toLocaleString("id-ID")}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Tiap post VIP (5k) memotong kuota Rp 5.000 otomatis.
          </p>
        </div>

        {/* Card 2: Total VIP Masuk + Reset */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Total Transaksi VIP
            </span>
            <button
              onClick={() => setShowResetModal(true)}
              className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
              title="Reset data transaksi VIP"
            >
              <svg className="w-3.5 h-3.5 inline-block mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reset
            </button>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            Rp {vipSettings.total_earned.toLocaleString("id-ID")}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            {vipSettings.total_transactions} cerita VIP telah terbit.
          </p>
        </div>

        {/* Card 3: QRIS Pembayaran */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-sm flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              QRIS FELXSTORE
            </span>
            <p className="mt-1 text-[11px] text-emerald-400 font-mono font-medium truncate">
              ID1025408420731 · Aktif
            </p>
            <div className="mt-2.5">
              <input
                ref={qrisFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrisUpload}
              />
              <button
                onClick={() => qrisFileInputRef.current?.click()}
                disabled={uploadingQris}
                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                {uploadingQris ? "Mengunggah..." : "Ganti Gambar QRIS"}
              </button>
            </div>
          </div>

          {/* Mini QRIS Preview */}
          <div className="h-16 w-16 shrink-0 rounded-xl bg-white p-1 border border-neutral-700 overflow-hidden flex items-center justify-center">
            <img
              src={vipSettings.qris_image_url}
              alt="QRIS Aktif"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* ── Analisis VIP ── */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Analisis VIP</h2>
          <div className="flex rounded-lg bg-neutral-800 p-0.5">
            {(["daily", "weekly", "monthly"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setAnalyticsTab(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  analyticsTab === tab
                    ? "bg-neutral-700 text-white"
                    : "text-neutral-400 hover:text-neutral-300"
                }`}
              >
                {tab === "daily" ? "Harian" : tab === "weekly" ? "Mingguan" : "Bulanan"}
              </button>
            ))}
          </div>
        </div>

        {/* Statistik Ringkas */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl bg-neutral-800/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Rata-rata / Hari</p>
              <p className="mt-1 text-sm font-bold font-mono text-white">
                {fmtRp(analytics.avg_per_day)}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-800/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Proyeksi 30 Hari</p>
              <p className="mt-1 text-sm font-bold font-mono text-white">
                {fmtRp(analytics.projection_30d)}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-800/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Jam Tersibuk</p>
              <p className="mt-1 text-sm font-bold font-mono text-white">
                {analytics.peak_hour !== null
                  ? `${String(analytics.peak_hour).padStart(2, "0")}:00`
                  : "—"}
              </p>
              {analytics.peak_hour !== null && (
                <p className="text-[10px] text-neutral-500">{analytics.peak_hour_count} transaksi</p>
              )}
            </div>
            <div className="rounded-xl bg-neutral-800/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Total Histori</p>
              <p className="mt-1 text-sm font-bold font-mono text-white">
                {vipSettings.total_transactions}
              </p>
            </div>
          </div>
        )}

        {/* Bar Chart */}
        {chartData.length > 0 ? (
          <div className="flex items-end gap-1.5 h-32">
            {chartData.map((d, i) => {
              const barHeight = maxAmount > 0 ? Math.max(4, (d.amount / maxAmount) * 100) : 4;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-neutral-500">
                    {d.count > 0 ? d.count : ""}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all bg-emerald-500/60 hover:bg-emerald-400/80 min-w-[8px]"
                    style={{ height: `${barHeight}%` }}
                    title={`${d.label}: ${d.count} transaksi, Rp ${d.amount.toLocaleString("id-ID")}`}
                  />
                  <span className="text-[9px] text-neutral-500 truncate max-w-full">{d.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500">Belum ada data transaksi untuk ditampilkan.</p>
          </div>
        )}

        {/* Top Users */}
        {analytics && analytics.top_users.length > 0 && (
          <div className="mt-5 pt-4 border-t border-neutral-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Kontributor VIP Teratas
            </h3>
            <div className="space-y-2">
              {analytics.top_users.map((user, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-neutral-800/40 px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-700 text-[10px] font-bold text-neutral-300">
                      {i + 1}
                    </span>
                    <span className="text-sm text-white">{user.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-emerald-400">
                      Rp {user.amount.toLocaleString("id-ID")}
                    </span>
                    <span className="ml-2 text-[10px] text-neutral-500">
                      {user.count}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Daftar Moderasi Cerita ── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Daftar Cerita Terbit ({stories.length})</h2>
      </div>

      {stories.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 py-16 text-center">
          <p className="text-neutral-500">Belum ada cerita.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => (
            <div
              key={story.id}
              className={`rounded-xl border p-4 transition-colors ${
                story.is_vip
                  ? "border-amber-500/40 bg-amber-500/[0.04]"
                  : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ${story.avatar_color}`}
                >
                  {story.author_name.slice(0, 2).toUpperCase()}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">
                      {story.author_name}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {story.author_handle}
                    </span>
                    <span className="text-xs text-neutral-600">
                      {new Date(story.created_at).toLocaleString("id-ID")}
                    </span>

                    {/* VIP Ribbon Badge */}
                    {story.is_vip && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-400 border border-amber-500/30">
                        <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>VIP · Rp 5.000</span>
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-sm text-neutral-300 whitespace-pre-wrap break-words">
                    {story.content}
                  </p>

                  {/* Foto Cerita (jika ada) */}
                  {story.image_url && (
                    <div className="mt-2.5">
                      <img
                        src={story.image_url}
                        alt="Foto Cerita"
                        className="h-24 w-24 rounded-lg object-cover border border-neutral-700"
                      />
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 flex-wrap">
                    <span className="text-xs text-neutral-500">
                      {story.likes} likes · {story.replies?.length || 0} balasan
                    </span>

                    {/* Tombol Lihat Bukti QR Pembayaran Pengguna */}
                    {story.proof_image_url && (
                      <button
                        type="button"
                        onClick={() => setPreviewProofUrl(story.proof_image_url || null)}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span>Lihat Bukti QR (Rp 5k)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(story.id)}
                  disabled={deleting === story.id}
                  className="flex-shrink-0 rounded-lg bg-red-600/20 border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50"
                >
                  {deleting === story.id ? "..." : "Hapus"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Ubah / Isi Ulang Kuota Admin ── */}
      {showQuotaModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 text-white shadow-2xl">
            <h3 className="text-base font-bold text-white">Atur Sisa Kuota Admin</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Kapasitas kuota sistem website. Pengunjung tidak dapat melihat angka ini.
            </p>

            <form onSubmit={handleSaveQuota} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300">
                  Nominal Kuota (Rp)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={quotaInput}
                  onChange={(e) => setQuotaInput(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none font-mono"
                  placeholder="Contoh: 500000"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={savingQuota}
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {savingQuota ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuotaModal(false)}
                  className="rounded-xl border border-neutral-700 px-4 py-2.5 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Reset Transaksi VIP ── */}
      {showResetModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 text-white shadow-2xl">
            <h3 className="text-base font-bold text-white">Reset Transaksi VIP</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Pilih mode reset. Data yang dihapus tidak dapat dikembalikan.
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => setResetMode("full")}
                className={`w-full text-left rounded-xl border p-3 transition-colors ${
                  resetMode === "full"
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600"
                }`}
              >
                <p className="text-sm font-semibold text-white">Reset Penuh</p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  Hapus total pendapatan, jumlah transaksi, dan seluruh riwayat. Kuota tidak berubah.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setResetMode("history")}
                className={`w-full text-left rounded-xl border p-3 transition-colors ${
                  resetMode === "history"
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600"
                }`}
              >
                <p className="text-sm font-semibold text-white">Hapus Riwayat Saja</p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  Hapus daftar riwayat transaksi. Total pendapatan dan jumlah tetap tercatat.
                </p>
              </button>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {resetting ? "Memproses..." : "Konfirmasi Reset"}
              </button>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="rounded-xl border border-neutral-700 px-4 py-2.5 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Preview Bukti QR Pembayaran Pengguna ── */}
      {previewProofUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setPreviewProofUrl(null)}
        >
          <div
            className="relative max-w-md w-full rounded-2xl bg-neutral-900 border border-neutral-800 p-4 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <span className="text-sm font-bold text-white">Bukti Pembayaran QR (Rp 5.000)</span>
              <button
                onClick={() => setPreviewProofUrl(null)}
                aria-label="Tutup preview bukti QR"
                className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center bg-black/50 rounded-xl overflow-hidden p-2">
              <img
                src={previewProofUrl}
                alt="Bukti Transfer QR"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="rounded-xl bg-neutral-800 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
