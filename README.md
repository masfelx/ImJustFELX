<div align="center">

# LUX0RIA (ImJustFELX)

**Modern, Minimalist Personal Space, Blog, & Anonymous Social Story Feed.**  
Dirancang dengan estetika bersih ala Apple Design System, didukung arsitektur **Next.js 16 + React 19 + Tailwind CSS v4 + Supabase Cloud**.

[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-149eca?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-white?style=for-the-badge&logo=vercel&logoColor=black)](https://imjustfelx.vercel.app)
[![Author](https://img.shields.io/badge/Author-masfelx-0066cc?style=for-the-badge&logo=github)](https://github.com/masfelx)

[**Live Demo Website**](https://imjustfelx.vercel.app) • [**Tentang**](#tentang-lux0ria) • [**Fitur Utama**](#fitur-utama) • [**Tech Stack**](#tech-stack)

</div>

---

## Tentang LUX0RIA

**LUX0RIA** adalah website personal multi-fungsi yang menggabungkan:
1. **Personal Identity & Portfolio**: Profil minimalis berkecepatan tinggi dengan estetika monokrom dan aksen biru Apple (`#0066cc`).
2. **Blog & Publikasi**: Tempat berbagi opini, checklist, dan panduan dengan dukungan rendering Markdown (GFM) dan estimasi waktu baca.
3. **Feed Cerita Anonim (Ala X / Twitter)**: Platform berbagi cerita dan curahan hati bagi pengunjung secara anonim dengan sistem balasan, likes, dan unggah foto.
4. **Cerita VIP & QRIS Verification**: Fitur pin cerita ke atas dengan efek border animasi glow eksklusif serta validasi bukti transfer QRIS otomatis anti-duplikasi screenshot.
5. **Admin Panel Terintegrasi**: Dashboard manajemen konten lengkap untuk mengontrol Beranda, Blog, Tentang, Feed Cerita, Kuota VIP, Donasi, dan Link Promosi.

---

## Fitur Utama

### 1. Blog & Publikasi
- Editor blog & artikel terintegrasi di Admin Panel.
- Format Markdown (GFM) lengkap dengan kalkulasi waktu membaca otomatis.
- Dukungan cover image dan excerpts untuk SEO & preview media sosial.
- *Cloud-First Storage*: Tersinkronisasi ke Supabase Cloud dengan fallback lokal.

### 2. Feed Cerita (X/Twitter-Style Community Feed)
- Kirim cerita secara bebas baik anonim maupun dengan handle `@username`.
- Sistem balasan berulir (*thread replies*) dan tombol like interaktif.
- Unggah foto pendukung cerita langsung ke Supabase Storage.
- **Cerita VIP Eksklusif**:
  - Tema kartu khusus: **Gold Glow**, **Cyber Neon**, **Blazing Fire**, dan **Midnight Blue**.
  - Pinned di bagian paling atas feed.
  - Verifikasi otomatis lampiran pembayaran QRIS ke merchant admin.

### 3. Sistem Kas & Kuota VIP Admin
- Monitoring kuota VIP admin secara *real-time* di dashboard.
- Analisis pendapatan terperinci: pend apatan harian (7 hari), mingguan, bulanan, proyeksi 30 hari, jam tersibuk (*peak hours*), dan *top contributors*.
- Upload kustom QRIS Admin yang langsung diperbarui ke sistem.
- Pencegahan fraud: Screenshot bukti pembayaran yang sudah pernah dipakai akan otomatis ditolak.

### 4. Hub "Terhubung" & Promosi Sewa Link
- Daftar media sosial (Instagram, TikTok, YouTube, dll) yang dapat dikustomisasi langsung dari admin panel.
- **Sistem Sewa Tautan Promosi Berdurasi**:
  - Pilihan durasi: 1 Bulan, 6 Bulan, 1 Tahun, atau Permanen.
  - Penghitungan sisa masa aktif otomatis.
  - Tautan kedaluwarsa otomatis disembunyikan dari publik tanpa perlu dihapus manual.

### 5. Performa Ekstrim (Snappy Navigation)
- Waktu muat halaman mendekati 0ms berkat caching memori serverless pintar (*monotonic timing*) dan parallel fetch.
- Prefetching link otomatis Next.js 16.
- Progress bar animasi Apple-style saat berpindah halaman.

---

## Tech Stack

| Kategori | Teknologi | Deskripsi |
|---|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) | App Router, Turbopack, Partial Prerendering (PPR) |
| **Library UI** | [React 19](https://react.dev/) | Server & Client Components, Action Hooks |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Theme tokens, modern CSS syntax |
| **Animasi** | [GSAP](https://greensock.com/gsap/) | Micro-interactions & transisi halus |
| **Database & Cloud** | [Supabase](https://supabase.com/) | PostgreSQL, Cloud Storage, Service Role API |
| **Authentication** | JWT & BcryptJS | Sesi login admin aman berbasis HTTP-only cookies |
| **Hosting & CI/CD** | [Vercel](https://vercel.com/) | Otomatis deploy setiap `git push origin main` |

---

## Penulis & Pengembang

Dikembangkan dan dirawat oleh:

- **Email**: [officialfelxstudio@gmail.com](mailto:officialfelxstudio@gmail.com)
- **GitHub**: [@masfelx](https://github.com/masfelx)
- **Website**: [imjustfelx.vercel.app](https://imjustfelx.vercel.app)
- **TikTok**: [@masfel.id](https://www.tiktok.com/@masfel.id)
- **Instagram**: [@feldiantrxahackim_](https://www.instagram.com/feldiantrxahackim_/)

---

## Lisensi

Proyek ini dibuat untuk keperluan pribadi dan komunitas. Dilisensikan di bawah [MIT License](LICENSE).
