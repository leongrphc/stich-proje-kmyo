-- =============================================
-- KMYO Teknik Servis - Fotoğraf Desteği
-- Bu SQL'i Supabase Dashboard > SQL Editor'de calistirin
-- =============================================

-- 1. Talepler tablosuna foto_url kolonu ekle
ALTER TABLE talepler ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. Storage bucket olustur
INSERT INTO storage.buckets (id, name, public)
VALUES ('talep-fotograflari', 'talep-fotograflari', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS politikalari
CREATE POLICY "Herkes fotograflari gorebilir"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'talep-fotograflari');

CREATE POLICY "Giris yapmis kullanici yukleyebilir"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'talep-fotograflari' AND auth.uid() IS NOT NULL);
