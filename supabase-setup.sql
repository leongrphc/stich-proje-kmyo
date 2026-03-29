-- =============================================
-- KMYO Teknik Servis - Supabase Tablo Kurulumu v2
-- Bu SQL'i Supabase Dashboard > SQL Editor'de calistirin
-- =============================================

-- =============================================
-- 1. ROL SORGULAMA FONKSIYONU (SECURITY DEFINER = RLS bypass)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT rol FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- 2. PROFILES TABLOSU
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ad TEXT,
  soyad TEXT,
  email TEXT,
  tema TEXT NOT NULL DEFAULT 'light'
    CHECK (tema IN ('light', 'dark')),
  rol TEXT NOT NULL DEFAULT 'kullanici'
    CHECK (rol IN ('kullanici', 'teknisyen', 'yonetici')),
  musaitlik TEXT NOT NULL DEFAULT 'Musait'
    CHECK (musaitlik IN ('Musait', 'Mesgul', 'Izinde')),
  uzmanlik_alanlari TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tema'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN tema TEXT NOT NULL DEFAULT 'light'
      CHECK (tema IN ('light', 'dark'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'musaitlik'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN musaitlik TEXT NOT NULL DEFAULT 'Musait'
      CHECK (musaitlik IN ('Musait', 'Mesgul', 'Izinde'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'uzmanlik_alanlari'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN uzmanlik_alanlari TEXT[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanici kendi profilini gorebilir" ON profiles;
DROP POLICY IF EXISTS "Kullanici kendi profilini guncelleyebilir" ON profiles;
DROP POLICY IF EXISTS "Teknisyen ve yonetici tum profilleri gorebilir" ON profiles;
DROP POLICY IF EXISTS "Yonetici profilleri guncelleyebilir" ON profiles;

CREATE POLICY "Kullanici kendi profilini gorebilir"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Teknisyen ve yonetici tum profilleri gorebilir"
  ON profiles FOR SELECT
  USING (public.get_user_role() IN ('teknisyen', 'yonetici'));

CREATE POLICY "Kullanici kendi profilini guncelleyebilir"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Yonetici profilleri guncelleyebilir"
  ON profiles FOR UPDATE
  USING (public.get_user_role() = 'yonetici');

-- =============================================
-- 3. PROFILES TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, ad, soyad, email, rol)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'ad',
    NEW.raw_user_meta_data->>'soyad',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'kullanici')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 4. TALEPLER TABLOSU
-- teknisyen_id: gercek UUID referansi (dropdown ile atanacak)
-- teknisyen_ad: gosterim icin cache
-- =============================================
CREATE TABLE IF NOT EXISTS talepler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  baslik TEXT NOT NULL,
  aciklama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  konum TEXT NOT NULL,
  oncelik TEXT NOT NULL DEFAULT 'Orta',
  durum TEXT NOT NULL DEFAULT 'Beklemede',
  kullanici_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kullanici_ad TEXT,
  kullanici_email TEXT,
  teknisyen_id UUID REFERENCES auth.users(id),
  teknisyen_ad TEXT DEFAULT 'Atanmadi',
  aksiyon_tipi TEXT CHECK (aksiyon_tipi IN ('maliyet_onayi', 'parca_onayi', 'yetki_gerekli', 'bilgi_gerekli')),
  aksiyon_aciklama TEXT,
  tahmini_maliyet DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eger tablo zaten varsa ve teknisyen_id kolonu yoksa ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'talepler' AND column_name = 'teknisyen_id'
  ) THEN
    ALTER TABLE talepler ADD COLUMN teknisyen_id UUID REFERENCES auth.users(id);
  END IF;
  -- teknisyen_ad yoksa ekle (eski tablolarda 'teknisyen' olarak vardi)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'talepler' AND column_name = 'teknisyen_ad'
  ) THEN
    ALTER TABLE talepler ADD COLUMN teknisyen_ad TEXT DEFAULT 'Atanmadi';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'talepler' AND column_name = 'aksiyon_tipi'
  ) THEN
    ALTER TABLE talepler ADD COLUMN aksiyon_tipi TEXT CHECK (aksiyon_tipi IN ('maliyet_onayi', 'parca_onayi', 'yetki_gerekli', 'bilgi_gerekli'));
    ALTER TABLE talepler ADD COLUMN aksiyon_aciklama TEXT;
    ALTER TABLE talepler ADD COLUMN tahmini_maliyet DECIMAL;
  END IF;
END $$;

ALTER TABLE talepler ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. TALEPLER RLS
-- =============================================
DROP POLICY IF EXISTS "Kullanicilar kendi taleplerini gorebilir" ON talepler;
DROP POLICY IF EXISTS "Teknisyen kendine atananlari gorebilir" ON talepler;
DROP POLICY IF EXISTS "Teknisyen ve yonetici tum talepleri gorebilir" ON talepler;
DROP POLICY IF EXISTS "Yonetici tum talepleri gorebilir" ON talepler;
DROP POLICY IF EXISTS "Kullanicilar talep olusturabilir" ON talepler;
DROP POLICY IF EXISTS "Kullanicilar kendi taleplerini guncelleyebilir" ON talepler;
DROP POLICY IF EXISTS "Teknisyen talepleri guncelleyebilir" ON talepler;
DROP POLICY IF EXISTS "Yonetici talepleri silebilir" ON talepler;
DROP POLICY IF EXISTS "Kullanicilar kendi taleplerini silebilir" ON talepler;

-- Kullanici: sadece kendi talepleri
CREATE POLICY "Kullanicilar kendi taleplerini gorebilir"
  ON talepler FOR SELECT
  USING (auth.uid() = kullanici_id);

-- Teknisyen: sadece kendine atanan talepler
CREATE POLICY "Teknisyen kendine atananlari gorebilir"
  ON talepler FOR SELECT
  USING (
    public.get_user_role() = 'teknisyen'
    AND teknisyen_id = auth.uid()
  );

-- Yonetici: tum talepler
CREATE POLICY "Yonetici tum talepleri gorebilir"
  ON talepler FOR SELECT
  USING (public.get_user_role() = 'yonetici');

-- INSERT: sadece kullanicilar
CREATE POLICY "Kullanicilar talep olusturabilir"
  ON talepler FOR INSERT
  WITH CHECK (auth.uid() = kullanici_id);

-- UPDATE: kullanici kendi talebini
CREATE POLICY "Kullanicilar kendi taleplerini guncelleyebilir"
  ON talepler FOR UPDATE
  USING (auth.uid() = kullanici_id);

-- UPDATE: teknisyen sadece kendine atananlari + yonetici hepsini
CREATE POLICY "Teknisyen talepleri guncelleyebilir"
  ON talepler FOR UPDATE
  USING (
    (public.get_user_role() = 'teknisyen' AND teknisyen_id = auth.uid())
    OR public.get_user_role() = 'yonetici'
  );

-- DELETE: sadece yonetici
CREATE POLICY "Yonetici talepleri silebilir"
  ON talepler FOR DELETE
  USING (public.get_user_role() = 'yonetici');

-- =============================================
-- 6. TALEP YORUMLARI TABLOSU
-- =============================================
CREATE TABLE IF NOT EXISTS talep_yorumlari (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  talep_id UUID NOT NULL REFERENCES talepler(id) ON DELETE CASCADE,
  yazan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yazan_ad TEXT,
  yazan_rol TEXT,
  yorum TEXT NOT NULL,
  mesaj_tipi TEXT DEFAULT 'text' CHECK (mesaj_tipi IN ('text', 'voice')),
  ses_path TEXT,
  ses_suresi_ms INTEGER,
  tur TEXT DEFAULT 'yorum'
    CHECK (tur IN ('yorum', 'durum_degisikligi', 'atama', 'onay', 'red', 'aksiyon')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

ALTER TABLE talep_yorumlari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Talep sahibi yorumlari gorebilir" ON talep_yorumlari;
DROP POLICY IF EXISTS "Staff yorumlari gorebilir" ON talep_yorumlari;
DROP POLICY IF EXISTS "Giris yapmis kullanici yorum ekleyebilir" ON talep_yorumlari;
DROP POLICY IF EXISTS "Kullanici kendi yorumunu guncelleyebilir" ON talep_yorumlari;
DROP POLICY IF EXISTS "Kullanici kendi yorumunu silebilir" ON talep_yorumlari;

-- Talep sahibi kendi talebinin yorumlarini gorebilir
CREATE POLICY "Talep sahibi yorumlari gorebilir"
  ON talep_yorumlari FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM talepler
      WHERE talepler.id = talep_yorumlari.talep_id
      AND talepler.kullanici_id = auth.uid()
    )
  );

-- Teknisyen (kendine atanan talebin yorumlari) + Yonetici (hepsi)
CREATE POLICY "Staff yorumlari gorebilir"
  ON talep_yorumlari FOR SELECT
  USING (
    public.get_user_role() = 'yonetici'
    OR (
      public.get_user_role() = 'teknisyen'
      AND EXISTS (
        SELECT 1 FROM talepler
        WHERE talepler.id = talep_yorumlari.talep_id
        AND talepler.teknisyen_id = auth.uid()
      )
    )
  );

-- Giris yapmis herkes yorum ekleyebilir
CREATE POLICY "Giris yapmis kullanici yorum ekleyebilir"
  ON talep_yorumlari FOR INSERT
  WITH CHECK (auth.uid() = yazan_id);

CREATE POLICY "Kullanici kendi yorumunu guncelleyebilir"
  ON talep_yorumlari FOR UPDATE
  USING (auth.uid() = yazan_id AND tur = 'yorum')
  WITH CHECK (auth.uid() = yazan_id AND tur = 'yorum');

CREATE POLICY "Kullanici kendi yorumunu silebilir"
  ON talep_yorumlari FOR DELETE
  USING (auth.uid() = yazan_id AND tur = 'yorum');

-- =============================================
-- 7. SESLI MESAJ STORAGE
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('talep-sesleri', 'talep-sesleri', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Ilgili kullanicilar ses dosyalarini gorebilir" ON storage.objects;
DROP POLICY IF EXISTS "Giris yapmis kullanici ses dosyasi yukleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Kullanici kendi ses dosyasini silebilir" ON storage.objects;

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

-- =============================================
-- 8. TALEP DEGERLENDIRMELERI
-- =============================================
CREATE TABLE IF NOT EXISTS talep_degerlendirmeleri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  talep_id UUID NOT NULL UNIQUE REFERENCES talepler(id) ON DELETE CASCADE,
  kullanici_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teknisyen_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  teknisyen_puani SMALLINT NOT NULL CHECK (teknisyen_puani BETWEEN 1 AND 5),
  cozum_puani SMALLINT NOT NULL CHECK (cozum_puani BETWEEN 1 AND 5),
  geri_bildirim TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE talep_degerlendirmeleri ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanici kendi degerlendirmesini gorebilir" ON talep_degerlendirmeleri;
DROP POLICY IF EXISTS "Staff ilgili degerlendirmeleri gorebilir" ON talep_degerlendirmeleri;
DROP POLICY IF EXISTS "Talep sahibi degerlendirme ekleyebilir" ON talep_degerlendirmeleri;
DROP POLICY IF EXISTS "Talep sahibi degerlendirme guncelleyebilir" ON talep_degerlendirmeleri;

CREATE POLICY "Kullanici kendi degerlendirmesini gorebilir"
  ON talep_degerlendirmeleri FOR SELECT
  USING (kullanici_id = auth.uid());

CREATE POLICY "Staff ilgili degerlendirmeleri gorebilir"
  ON talep_degerlendirmeleri FOR SELECT
  USING (
    public.get_user_role() = 'yonetici'
    OR teknisyen_id = auth.uid()
  );

CREATE POLICY "Talep sahibi degerlendirme ekleyebilir"
  ON talep_degerlendirmeleri FOR INSERT
  WITH CHECK (
    kullanici_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM talepler
      WHERE talepler.id = talep_degerlendirmeleri.talep_id
        AND talepler.kullanici_id = auth.uid()
        AND talepler.durum = 'Tamamlandi'
    )
  );

CREATE POLICY "Talep sahibi degerlendirme guncelleyebilir"
  ON talep_degerlendirmeleri FOR UPDATE
  USING (kullanici_id = auth.uid())
  WITH CHECK (
    kullanici_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM talepler
      WHERE talepler.id = talep_degerlendirmeleri.talep_id
        AND talepler.kullanici_id = auth.uid()
        AND talepler.durum = 'Tamamlandi'
    )
  );

-- =============================================
-- 8. TEKNISYEN LISTESI FONKSIYONU (RPC)
-- Yonetici teknisyen atarken dropdown icin
-- =============================================
CREATE OR REPLACE FUNCTION public.get_teknisyenler()
RETURNS TABLE(
  id UUID,
  ad TEXT,
  soyad TEXT,
  email TEXT,
  musaitlik TEXT,
  uzmanlik_alanlari TEXT[],
  acik_talep_sayisi BIGINT
) AS $$
  SELECT
    p.id,
    p.ad,
    p.soyad,
    p.email,
    p.musaitlik,
    p.uzmanlik_alanlari,
    COUNT(t.id) FILTER (WHERE t.durum NOT IN ('Tamamlandi', 'Kapatildi')) AS acik_talep_sayisi
  FROM public.profiles p
  LEFT JOIN public.talepler t ON t.teknisyen_id = p.id
  WHERE p.rol = 'teknisyen'
  GROUP BY p.id, p.ad, p.soyad, p.email, p.musaitlik, p.uzmanlik_alanlari
  ORDER BY
    CASE p.musaitlik
      WHEN 'Musait' THEN 1
      WHEN 'Mesgul' THEN 2
      ELSE 3
    END,
    COUNT(t.id) FILTER (WHERE t.durum NOT IN ('Tamamlandi', 'Kapatildi')) ASC,
    p.ad ASC,
    p.soyad ASC;
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- 9. MEVCUT KULLANICILARA PROFIL OLUSTURMA
-- =============================================
INSERT INTO profiles (id, ad, soyad, email, rol)
SELECT
  id,
  raw_user_meta_data->>'ad',
  raw_user_meta_data->>'soyad',
  email,
  COALESCE(raw_user_meta_data->>'rol', 'kullanici')
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 10. ROL ATAMA KOMUTLARI (gerektiginde calistirin)
-- =============================================
-- UPDATE profiles SET rol = 'yonetici' WHERE email = 'admin@email.com';
-- UPDATE profiles SET rol = 'teknisyen' WHERE email = 'teknisyen@email.com';
