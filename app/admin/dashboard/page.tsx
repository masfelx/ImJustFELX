"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  totalPosts: number;
  totalDonasi: number;
  totalSocials: number;
  totalOtherLinks: number;
  totalCerita: number;
  siteName: string;
  latestPost: { title: string; date: string; slug: string } | null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-neutral-500">Memuat dashboard...</div>
      </div>
    );
  }

  const cards = [
    {
      label: "Blog Posts",
      value: stats?.totalPosts ?? 0,
      icon: (
        <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      href: "/admin/dashboard/blog",
      color: "border-blue-500/30 bg-blue-500/10",
    },
    {
      label: "Metode Donasi",
      value: stats?.totalDonasi ?? 0,
      icon: (
        <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      href: "/admin/dashboard/donasi",
      color: "border-green-500/30 bg-green-500/10",
    },
    {
      label: "Sosial Media",
      value: stats?.totalSocials ?? 0,
      icon: (
        <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
        </svg>
      ),
      href: "/admin/dashboard/terhubung",
      color: "border-purple-500/30 bg-purple-500/10",
    },
    {
      label: "Link Lainnya",
      value: stats?.totalOtherLinks ?? 0,
      icon: (
        <svg className="w-6 h-6 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      href: "/admin/dashboard/terhubung",
      color: "border-orange-500/30 bg-orange-500/10",
    },
    {
      label: "Cerita",
      value: stats?.totalCerita ?? 0,
      icon: (
        <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      href: "/admin/dashboard/cerita",
      color: "border-cyan-500/30 bg-cyan-500/10",
    },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Selamat datang di admin panel {stats?.siteName}.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border p-5 transition-colors hover:border-neutral-600 ${card.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-3xl font-bold">{card.value}</span>
            </div>
            <p className="mt-2 text-sm text-neutral-400">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Latest post */}
      {stats?.latestPost && (
        <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
          <h2 className="text-lg font-semibold">Artikel Terbaru</h2>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{stats.latestPost.title}</p>
              <p className="text-sm text-neutral-500">{stats.latestPost.date}</p>
            </div>
            <Link
              href={`/admin/dashboard/blog/edit/${stats.latestPost.slug}`}
              className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Aksi Cepat</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/admin/dashboard/beranda"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            Edit Beranda
          </Link>
          <Link
            href="/admin/dashboard/blog/new"
            className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            + Tulis Artikel
          </Link>
          <Link
            href="/admin/dashboard/donasi"
            className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            Kelola Donasi
          </Link>
          <Link
            href="/admin/dashboard/site"
            className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            Edit Site Config
          </Link>
          <Link
            href="/admin/dashboard/tentang"
            className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            Edit Tentang
          </Link>
          <Link
            href="/admin/dashboard/cerita"
            className="flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Moderasi Cerita
          </Link>
        </div>
      </div>
    </>
  );
}
