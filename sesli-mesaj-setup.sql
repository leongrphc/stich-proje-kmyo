-- =============================================
-- KMYO Teknik Servis - Sesli Mesaj Desteği
-- Bu SQL'i Supabase Dashboard > SQL Editor'de calistirin
-- =============================================

ALTER TABLE talep_yorumlari ADD COLUMN IF NOT EXISTS mesaj_tipi TEXT DEFAULT 'text';
ALTER TABLE talep_yorumlari ADD COLUMN IF NOT EXISTS ses_path TEXT;
ALTER TABLE talep_yorumlari ADD COLUMN IF NOT EXISTS ses_suresi_ms INTEGER;
ALTER TABLE talep_yorumlari ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'talep_yorumlari_mesaj_tipi_check'
  ) THEN
    ALTER TABLE talep_yorumlari
      ADD CONSTRAINT talep_yorumlari_mesaj_tipi_check
      CHECK (mesaj_tipi IN ('text', 'voice'));
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('talep-sesleri', 'talep-sesleri', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Kullanici kendi yorumunu guncelleyebilir" ON talep_yorumlari;
DROP POLICY IF EXISTS "Kullanici kendi yorumunu silebilir" ON talep_yorumlari;
DROP POLICY IF EXISTS "Kullanici kendi ses dosyasini silebilir" ON storage.objects;
DROP POLICY IF EXISTS "Ilgili kullanicilar ses dosyalarini gorebilir" ON storage.objects;
DROP POLICY IF EXISTS "Giris yapmis kullanici ses dosyasi yukleyebilir" ON storage.objects;

CREATE POLICY "Kullanici kendi yorumunu guncelleyebilir"
  ON talep_yorumlari FOR UPDATE
  USING (auth.uid() = yazan_id AND tur = 'yorum')
  WITH CHECK (auth.uid() = yazan_id AND tur = 'yorum');

CREATE POLICY "Kullanici kendi yorumunu silebilir"
  ON talep_yorumlari FOR DELETE
  USING (auth.uid() = yazan_id AND tur = 'yorum');

CREATE POLICY "Ilgili kullanicilar ses dosyalarini gorebilir"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'talep-sesleri'
    AND EXISTS (
      SELECT 1 FROM talepler
      WHERE talepler.id::TEXT = split_part(name, '/', 1)
      AND (
        talepler.kullanici_id = auth.uid()
        OR talepler.teknisyen_id = auth.uid()
        OR public.get_user_role() = 'yonetici'
      )
    )
  );

CREATE POLICY "Giris yapmis kullanici ses dosyasi yukleyebilir"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'talep-sesleri'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Kullanici kendi ses dosyasini silebilir"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'talep-sesleri'
    AND EXISTS (
      SELECT 1 FROM talep_yorumlari
      WHERE talep_yorumlari.ses_path = name
      AND talep_yorumlari.yazan_id = auth.uid()
      AND talep_yorumlari.tur = 'yorum'
    )
  );
