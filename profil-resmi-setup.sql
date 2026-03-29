-- =============================================
-- KMYO Teknik Servis - Profil Resmi Desteği
-- Bu SQL'i Supabase Dashboard > SQL Editor'de calistirin
-- =============================================

-- 1. Profiles tablosuna avatar_url kolonu ekle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Storage bucket olustur (public = true, herkes görselleri görebilir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS politikalari
-- Herkes profil fotograflarini gorebilir
CREATE POLICY "Herkes avatar gorebilir"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Giris yapmis kullanici kendi klasorune yukleyebilir
CREATE POLICY "Kullanici kendi avatarini yukleyebilir"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Kullanici kendi avatarini guncelleyebilir (upsert icin)
CREATE POLICY "Kullanici kendi avatarini guncelleyebilir"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Kullanici kendi avatarini silebilir
CREATE POLICY "Kullanici kendi avatarini silebilir"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
