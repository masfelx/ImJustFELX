"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * ADMIN LOGIN — Halaman tersembunyi di /admin
 * Design: gelap, minimal, aman.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/admin/dashboard");
      } else if (res.status === 429) {
        setError(`Terlalu banyak percobaan. Coba lagi dalam ${data.retryAfter} detik.`);
      } else {
        setError(data.error || "Password salah.");
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Admin Panel
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            LUX0RIA — Akses terbatas
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password admin"
              required
              autoFocus
              className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-600 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-neutral-700">
          Halaman ini hanya untuk administrator.
        </p>
      </div>
    </div>
  );
}
