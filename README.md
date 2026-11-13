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

## Admin Panel

Admin panel ada di **`/admin`** (tidak ditautkan dari navigasi publik).

### Cara masuk
1. Buka `https://domain-kamu.com/admin`.
2. Masukkan password admin (yang hash-nya tersimpan di `ADMIN_PASSWORD_HASH`).
3. Setelah berhasil, kamu diarahkan ke `/admin/dashboard`.

### Menu yang tersedia
| Menu | Fungsi |
|---|---|
| **Dashboard** | Ringkasan statistik: jumlah blog, donasi, tautan, dan aktivitas terbaru. |
| **Beranda** | Ubah judul, subjudul, dan konten halaman depan. |
| **Donasi** | Tambah / ubah / hapus platform donasi (Saweria, Sociabuzz, QRIS, dll). |
| **Terhubung** | Kelola media sosial & tautan promosi, termasuk masa aktif sewa link. |
| **Blog** | Tulis, edit, dan hapus artikel (Markdown + cover). |
| **Tentang** | Ubah isi halaman Tentang. |
| **Cerita** | Moderasi feed anonim — hapus cerita/balasan yang tidak layak. |
| **Pengaturan Situs** | Nama situs, tagline, deskripsi, URL, author. |
| **VIP** | Kuota VIP, QRIS admin, dan riwayat transaksi. |

Semua perubahan langsung tersimpan ke Supabase Cloud dan tampil di website publik.

### Keamanan
- Password admin disimpan sebagai **hash bcrypt** — bukan teks biasa.
- Sesi login memakai **JWT HMAC** di cookie `HttpOnly`, `SameSite=Lax`, `Secure` di production, berlaku 24 jam.
- Middleware menolak akses ke `/admin/dashboard/*` dan `/api/admin/*` tanpa token valid.
- Login dibatasi **15 percobaan / 15 menit per IP**.
- `JWT_SECRET` **wajib** diisi di production. Tanpa itu, admin menolak semua akses (503) — tidak ada fallback diam-diam.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server. Jangan pernah memberi prefix `NEXT_PUBLIC_` atau membagikannya ke browser.
- Endpoint publik (kirim cerita/balasan) memakai rate limit untuk mencegah spam.

### Mengganti password admin
```bash
node -e "console.log(require('bcryptjs').hashSync('PASSWORD_BARU', 12))"
```
Salin hasilnya ke `ADMIN_PASSWORD_HASH` di `.env.local` **dan** di Environment Variables Vercel, lalu redeploy.

---

## Setup Lokal

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

Isi `.env.local`:

| Variable | Wajib | Keterangan |
|---|---|---|
| `ADMIN_PASSWORD_HASH` | Ya | Hash bcrypt password admin. |
| `JWT_SECRET` | Ya (production) | Random 32+ karakter untuk tanda tangan sesi. |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL project Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | Publishable/anon key (boleh publik, hanya baca). |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya | Secret key — **hanya server**, dipakai untuk menulis data. |

### Menyiapkan database
1. Buka **Supabase Dashboard → SQL Editor → New Query**.
2. Jalankan `supabase-schema.sql` (tabel dasar: posts, donations, links, site_config).
3. Jalankan `supabase-stories.sql` (tabel `stories`, `story_replies`, realtime, dan bucket `cerita-photos`).
4. Verifikasi koneksi:
```bash
npm run check:db
```
5. Kalau ada cerita lama yang masih tersimpan lokal:
```bash
npm run migrate:cerita
```

### Script berguna
| Perintah | Fungsi |
|---|---|
| `npm run check:db` | Cek service key, tabel, dan bucket storage. |
| `npm run migrate:cerita` | Pindahkan `content/data/cerita.json` ke Supabase (anti-duplikat). |
| `npm run backup` | Snapshot database (termasuk cerita) ke `backups/` & `content/`. |

---

## Troubleshooting: Cerita Hilang Setelah Refresh

Gejala: cerita muncul sebentar, lalu hilang setelah halaman di-refresh.

Penyebabnya **bukan** bug tampilan, tapi data gagal ditulis ke database. Urutan pengecekan:

1. **Service role key tidak valid**
   - Jalankan `npm run check:db`.
   - Kalau muncul `Service key ditolak: Unregistered API key`, buat key baru di
     **Project Settings → API Keys → Secret keys → Create new secret key**.
   - Ganti `SUPABASE_SERVICE_ROLE_KEY` di `.env.local` dan di Vercel, lalu redeploy.

2. **Tabel `stories` belum ada**
   - Jalankan `supabase-stories.sql` di SQL Editor.
   - Tanpa tabel ini, aplikasi memakai `posts.cerita-feed`; kalau service key juga salah, tidak ada yang bisa ditulis.

3. **Environment Variables Vercel belum diisi**
   - Pastikan kelima variabel di atas ada di **Vercel → Settings → Environment Variables** untuk environment Production.
   - Setelah mengubah env, **redeploy** (env lama tidak otomatis terpakai).

4. **Cek respons API**
   - Buka DevTools → Network → kirim cerita → lihat `POST /api/cerita`.
   - Status `503` = penyimpanan belum siap (pesan errornya menjelaskan variabel mana yang salah).
   - Status `201` = cerita benar-benar tersimpan.

Sejak pembaruan ini, aplikasi **tidak akan lagi menampilkan “berhasil”** kalau data gagal disimpan — pengguna akan melihat pesan error yang jelas.

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
