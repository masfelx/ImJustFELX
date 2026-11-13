"use client";

import { useState } from "react";

type PackageItem = {
  id: string;
  name: string;
  price: string;
  calc: string;
  badge: string;
  badgeColor: string;
  desc: string;
  featured?: boolean;
};

export default function PartnerSlotCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<PackageItem | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const packages: PackageItem[] = [
    {
      id: "starter",
      name: "1 Bulan (Starter)",
      price: "Rp 25.000",
      calc: "Rp 25.000 / bln",
      badge: "Starter",
      badgeColor: "bg-neutral-800 text-neutral-300 border-neutral-700",
      desc: "Cocok untuk promosi event, pengenalan clan, atau uji coba.",
    },
    {
      id: "semi_annual",
      name: "6 Bulan (Semi-Annual)",
      price: "Rp 120.000",
      calc: "Rp 20.000 / bln",
      badge: "Hemat 20%",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      desc: "Pilihan ideal untuk server, brand komunitas, atau toko digital.",
    },
    {
      id: "annual",
      name: "1 Tahun (Annual)",
      price: "Rp 200.000",
      calc: "~Rp 16.600 / bln",
      badge: "Best Value · Diskon 33%",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      desc: "Backlink SEO permanen jangka panjang dengan reputasi terpercaya.",
      featured: true,
    },
  ];

  function handleOpenModal() {
    setSelectedPkg(null);
    setIsConfirmed(false);
    setIsOpen(true);
  }

  function handleSelectPackage(pkg: PackageItem) {
    setSelectedPkg(pkg);
    setIsConfirmed(false);
  }

  function handleConfirmYes() {
    setIsConfirmed(true);
  }

  function handleConfirmNo() {
    setSelectedPkg(null);
    setIsConfirmed(false);
  }

  // Pesan otomatis WhatsApp sesuai paket yang dipilih
  const waMessage = selectedPkg
    ? encodeURIComponent(
        `Halo Admin LUX0RIA, saya ingin pasang website dengan paket ${selectedPkg.name} seharga ${selectedPkg.price} di halaman Terhubung.`
      )
    : encodeURIComponent(
        "Halo Admin LUX0RIA, saya tertarik untuk pasang link website di halaman Terhubung."
      );

  return (
    <>
      {/* ── Kartu Promosi Minimalis di Grid ── */}
      <div data-reveal data-reveal-delay="0.2">
        <button
          type="button"
          onClick={handleOpenModal}
          className="group flex h-full w-full flex-col justify-between rounded-lg border border-dashed border-ink-muted-48/40 bg-canvas/40 p-6 text-left transition-all hover:border-primary hover:bg-canvas"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono font-medium text-emerald-600">
                Slot Tersedia
              </span>
            </div>

            <h3 className="mt-4 text-body-strong text-ink group-hover:text-primary transition-colors">
              Letakkan Website Kamu di Sini
            </h3>
            <p className="mt-1.5 text-caption text-ink-muted-80">
              Promosikan website, clan, server, atau bisnismu kepada pengunjung aktif LUX0RIA.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between pt-4 border-t border-hairline">
            <span className="text-caption text-ink-muted-48">
              Mulai <span className="font-semibold text-ink font-mono">Rp 25rb</span>/bln
            </span>
            <span className="inline-flex items-center gap-1 text-caption font-medium text-primary">
              <span>Lihat Paket & Pasang</span>
              <svg
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
        </button>
      </div>

      {/* ── Modal Detail Paket & Harga Pasang Website ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Pasang Website Kamu</h3>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                    Slot Aktif
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-400">
                  Tampil resmi di halaman Terhubung LUX0RIA dengan nama, deskripsi, dan link langsung.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                aria-label="Tutup modal"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Pilihan Paket Harga (Dapat Diklik) */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  1. Pilih Salah Satu Paket
                </span>
                <span className="text-[11px] text-neutral-500">
                  Klik kartu untuk memilih
                </span>
              </div>

              <div className="grid gap-2.5">
                {packages.map((pkg) => {
                  const isSelected = selectedPkg?.id === pkg.id;

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handleSelectPackage(pkg)}
                      className={`w-full text-left rounded-xl border p-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/50"
                          : pkg.featured
                          ? "border-amber-500/40 bg-amber-500/[0.04] hover:border-amber-500/70"
                          : "border-neutral-800 bg-neutral-800/40 hover:border-neutral-700 hover:bg-neutral-800/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{pkg.name}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium ${pkg.badgeColor}`}>
                            {pkg.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold font-mono text-emerald-400">
                            {pkg.price}
                          </span>
                          {isSelected && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-black">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-neutral-400">
                        <p>{pkg.desc}</p>
                        <span className="font-mono text-neutral-500 shrink-0 ml-2">
                          ({pkg.calc})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Benefit Singkat */}
            <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
                Apa Saja yang Kamu Dapatkan?
              </span>
              <ul className="space-y-1.5 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Link langsung (backlink SEO dofollow) ke domain website kamu</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Logo/ikon kustom, nama brand, dan kalimat deskripsi promosi</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Sistem durasi otomatis: aktif 24 jam penuh selama masa paket</span>
                </li>
              </ul>
            </div>

            {/* ── BAGIAN KONFIRMASI PAKET (IYA / TIDAK) ── */}
            {selectedPkg && !isConfirmed && (
              <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/[0.06] p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Konfirmasi Paket Pilihan</span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between">
                  <p className="text-sm font-bold text-white">
                    {selectedPkg.name}
                  </p>
                  <p className="text-sm font-bold font-mono text-emerald-400">
                    {selectedPkg.price}
                  </p>
                </div>

                <p className="mt-1 text-xs text-neutral-300">
                  Apakah kamu yakin ingin memasang website dengan paket ini?
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmYes}
                    className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-black transition-colors"
                  >
                    Iya, Lanjutkan
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmNo}
                    className="rounded-xl border border-neutral-700 hover:bg-neutral-800 px-4 py-2.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                  >
                    Tidak (Batal)
                  </button>
                </div>
              </div>
            )}

            {/* ── TOMBOL WHATSAPP HANYA MUNCUL JIKA SUDAH DIKONFIRMASI "IYA" ── */}
            {selectedPkg && isConfirmed && (
              <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="mb-3 flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="font-semibold text-white">Paket Terkonfirmasi:</span>
                    <span className="text-emerald-400 font-mono font-bold">{selectedPkg.name} ({selectedPkg.price})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConfirmed(false)}
                    className="text-[11px] text-neutral-400 hover:text-white underline ml-2"
                  >
                    Ganti
                  </button>
                </div>

                <a
                  href={`https://wa.me/6285126247912?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-950/40"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>Chat WhatsApp Admin (0851-2624-7912)</span>
                </a>

                <p className="mt-3 text-center text-[11px] text-neutral-400">
                  Kirimkan nama website, link URL, dan durasi paket ke WhatsApp admin untuk langsung dipasang.
                </p>
              </div>
            )}

            {/* Pesan panduan jika belum memilih paket */}
            {!selectedPkg && (
              <p className="mt-4 text-center text-xs text-neutral-500">
                Pilih salah satu paket durasi di atas untuk melanjutkan ke konfirmasi.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
