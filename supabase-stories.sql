-- ============================================================
-- MIGRASI: TABEL CERITA (FEED ANONIM) — LUX0RIA
-- ============================================================
-- Cara pakai:
--   Supabase Dashboard -> SQL Editor -> New Query
--   Tempel seluruh file ini -> Run
--
-- File ini AMAN dijalankan ulang (idempotent):
--   - semua tabel memakai IF NOT EXISTS
--   - policy di-drop dulu sebelum dibuat ulang
--   - realtime & bucket dicek dulu sebelum ditambahkan
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABEL `stories` — cerita/curhat anonim
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stories (
  id              BIGSERIAL PRIMARY KEY,
  author_name     TEXT        NOT NULL DEFAULT 'Anonim',
  author_handle   TEXT        NOT NULL DEFAULT '@anon',
  content         TEXT        NOT NULL,
  avatar_color    TEXT        NOT NULL DEFAULT 'bg-blue-600',
  likes           INTEGER     NOT NULL DEFAULT 0,
  is_vip          BOOLEAN     NOT NULL DEFAULT FALSE,
  vip_theme       TEXT        CHECK (vip_theme IN ('gold', 'neon', 'fire', 'midnight')),
  pinned_until    TIMESTAMPTZ,
  image_url       TEXT,
  proof_image_url TEXT,
  is_edited       BOOLEAN     NOT NULL DEFAULT FALSE,
  edited_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kalau tabel sudah pernah dibuat versi lama, lengkapi kolom yang kurang.
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS author_name     TEXT        NOT NULL DEFAULT 'Anonim';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS author_handle   TEXT        NOT NULL DEFAULT '@anon';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS avatar_color    TEXT        NOT NULL DEFAULT 'bg-blue-600';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS likes           INTEGER     NOT NULL DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_vip          BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS vip_theme       TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS pinned_until    TIMESTAMPTZ;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS image_url       TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS proof_image_url TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_edited       BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS edited_at       TIMESTAMPTZ;

-- ------------------------------------------------------------
-- 2. TABEL `story_replies` — balasan tiap cerita
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_replies (
  id            BIGSERIAL PRIMARY KEY,
  story_id      BIGINT      NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  author_name   TEXT        NOT NULL DEFAULT 'Anonim',
  author_handle TEXT        NOT NULL DEFAULT '@anon',
  content       TEXT        NOT NULL,
  avatar_color  TEXT        NOT NULL DEFAULT 'bg-blue-600',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. INDEX — biar feed & balasan tetap cepat
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS stories_created_at_idx
  ON public.stories (created_at DESC);

CREATE INDEX IF NOT EXISTS stories_vip_created_idx
  ON public.stories (is_vip DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS story_replies_story_id_idx
  ON public.story_replies (story_id, created_at ASC);

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
--    Publik: hanya boleh BACA (SELECT)
--    Tulis: hanya lewat backend dengan Service Role Key
-- ------------------------------------------------------------
ALTER TABLE public.stories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read stories"        ON public.stories;
DROP POLICY IF EXISTS "Public read story_replies"  ON public.story_replies;
DROP POLICY IF EXISTS "Service write stories"      ON public.stories;
DROP POLICY IF EXISTS "Service write story_replies" ON public.story_replies;

CREATE POLICY "Public read stories"
  ON public.stories FOR SELECT
  USING (true);

CREATE POLICY "Public read story_replies"
  ON public.story_replies FOR SELECT
  USING (true);

CREATE POLICY "Service write stories"
  ON public.stories FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service write story_replies"
  ON public.story_replies FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Hak akses dasar (Supabase biasanya sudah otomatis, ini jaga-jaga)
GRANT SELECT ON public.stories, public.story_replies TO anon, authenticated;
GRANT ALL    ON public.stories, public.story_replies TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.stories_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.story_replies_id_seq TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 5. REALTIME — supaya feed update otomatis tanpa refresh
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'stories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'story_replies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.story_replies;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 6. STORAGE BUCKET — foto cerita
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('cerita-photos', 'cerita-photos', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS "Public read cerita photos"    ON storage.objects;
DROP POLICY IF EXISTS "Service write cerita photos"  ON storage.objects;

-- Siapa pun boleh melihat foto (bucket publik)
CREATE POLICY "Public read cerita photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cerita-photos');

-- Hanya service role (backend) yang boleh upload/hapus
CREATE POLICY "Service write cerita photos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'cerita-photos' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'cerita-photos' AND auth.role() = 'service_role');

-- ------------------------------------------------------------
-- SELESAI.
-- Setelah ini:
--   1. Pastikan SUPABASE_SERVICE_ROLE_KEY valid (.env.local + Vercel)
--   2. Jalankan: npm run migrate:cerita   (memindahkan cerita lokal)
--   3. Redeploy Vercel
-- ------------------------------------------------------------
