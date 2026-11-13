-- ============================================================
-- SKEMA DATABASE LUX0RIA DI SUPABASE
-- Salin dan jalankan seluruh kode ini di:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================

-- 1. TABEL SITE CONFIG (Pengaturan Website)
CREATE TABLE IF NOT EXISTS site_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  name TEXT NOT NULL DEFAULT 'LUX0RIA',
  tagline TEXT NOT NULL DEFAULT 'Blog pribadi untuk cerita, catatan, dan segala hal yang ingin kubagikan.',
  description TEXT NOT NULL DEFAULT 'Blog pribadi LUX0RIA — cerita, catatan, dan karya.',
  url TEXT NOT NULL DEFAULT 'https://lux0ria.example.com',
  author TEXT NOT NULL DEFAULT 'LUX0RIA',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL DONASI
CREATE TABLE IF NOT EXISTS donations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'coffee',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL SOSIAL MEDIA & LINK LAIN
CREATE TABLE IF NOT EXISTS links (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  handle TEXT,
  description TEXT,
  icon TEXT DEFAULT 'link',
  type TEXT NOT NULL CHECK (type IN ('social', 'other')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL ARTIKEL BLOG
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- KEAMANAN: ROW LEVEL SECURITY (RLS)
-- Semua orang bisa BACA (SELECT), tapi hanya Admin dengan
-- Service Role Key yang bisa UBAH/TAMBAH/HAPUS (INSERT/UPDATE/DELETE).
-- ============================================================

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy BACA untuk Publik
CREATE POLICY "Public read site_config" ON site_config FOR SELECT USING (true);
CREATE POLICY "Public read donations" ON donations FOR SELECT USING (true);
CREATE POLICY "Public read links" ON links FOR SELECT USING (true);
CREATE POLICY "Public read posts" ON posts FOR SELECT USING (true);

-- Policy TULIS hanya untuk Service Role (Backend Next.js kita)
CREATE POLICY "Admin write site_config" ON site_config FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin write donations" ON donations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin write links" ON links FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin write posts" ON posts FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- DATA AWAL (SEED DATA)
-- ============================================================

-- Data Config Awal
INSERT INTO site_config (id, name, tagline, description, url, author)
VALUES (
  'current',
  'LUX0RIA',
  'Blog pribadi untuk cerita, catatan, dan segala hal yang ingin kubagikan.',
  'Blog pribadi LUX0RIA — cerita, catatan, dan karya.',
  'https://lux0ria.example.com',
  'LUX0RIA'
) ON CONFLICT (id) DO NOTHING;

-- Data Donasi Awal
INSERT INTO donations (name, url, description, icon, sort_order) VALUES
('Saweria', 'https://saweria.co/username-kamu', 'Traktir kopi atau dukung lewat QRIS, e-wallet, dan transfer bank.', 'coffee', 1),
('Sociabuzz', 'https://sociabuzz.com/username-kamu', 'Dukungan berkelanjutan — bisa sekali bayar atau langganan bulanan.', 'spark', 2),
('Sibagi', 'https://sibagi.id/username-kamu', 'Bagikan dukunganmu lewat platform donasi karya dan konten lokal.', 'gift', 3)
ON CONFLICT DO NOTHING;

-- Data Sosial Media Awal
INSERT INTO links (name, url, handle, description, icon, type, sort_order) VALUES
('Instagram', 'https://instagram.com/username-kamu', '@username-kamu', NULL, 'instagram', 'social', 1),
('YouTube', 'https://youtube.com/@username-kamu', '@username-kamu', NULL, 'youtube', 'social', 2),
('TikTok', 'https://tiktok.com/@username-kamu', '@username-kamu', NULL, 'tiktok', 'social', 3),
('X (Twitter)', 'https://x.com/username-kamu', '@username-kamu', NULL, 'x', 'social', 4),
('Website Lainnya', 'https://example.com', NULL, 'Proyek atau website lain milikmu', 'globe', 'other', 1),
('Toko / Merchandise', 'https://example.com/toko', NULL, 'Belanja merchandise kalau ada', 'link', 'other', 2)
ON CONFLICT DO NOTHING;
