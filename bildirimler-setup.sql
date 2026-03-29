-- =============================================
-- KMYO Teknik Servis - Bildirimler Tablosu
-- Bu SQL'i Supabase Dashboard > SQL Editor'de calistirin
-- =============================================

-- =============================================
-- 1. BILDIRIMLER TABLOSU
-- =============================================
CREATE TABLE IF NOT EXISTS bildirimler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alici_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gonderen_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gonderen_ad TEXT,
  talep_id UUID REFERENCES talepler(id) ON DELETE CASCADE,
  baslik TEXT NOT NULL,
  mesaj TEXT NOT NULL,
  tur TEXT NOT NULL DEFAULT 'bilgi'
    CHECK (tur IN ('yeni_talep', 'atama', 'yorum', 'durum_degisikligi', 'aksiyon', 'onay', 'red', 'bilgi')),
  okundu BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bildirimler ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. RLS POLITIKALARI
-- =============================================
DROP POLICY IF EXISTS "Kullanici kendi bildirimlerini gorebilir" ON bildirimler;
DROP POLICY IF EXISTS "Giris yapmis kullanici bildirim gonderebilir" ON bildirimler;
DROP POLICY IF EXISTS "Kullanici kendi bildirimlerini guncelleyebilir" ON bildirimler;
DROP POLICY IF EXISTS "Kullanici kendi bildirimlerini silebilir" ON bildirimler;

CREATE POLICY "Kullanici kendi bildirimlerini gorebilir"
  ON bildirimler FOR SELECT
  USING (auth.uid() = alici_id);

CREATE POLICY "Giris yapmis kullanici bildirim gonderebilir"
  ON bildirimler FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Kullanici kendi bildirimlerini guncelleyebilir"
  ON bildirimler FOR UPDATE
  USING (auth.uid() = alici_id);

CREATE POLICY "Kullanici kendi bildirimlerini silebilir"
  ON bildirimler FOR DELETE
  USING (auth.uid() = alici_id);

-- =============================================
-- 3. YONETICI ID'LERINI GETIREN FONKSIYON (RPC)
-- Bildirim gonderirken yonetici listesini almak icin
-- =============================================
CREATE OR REPLACE FUNCTION public.get_yonetici_idler()
RETURNS TABLE(id UUID) AS $$
  SELECT id FROM public.profiles WHERE rol = 'yonetici';
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- 4. OKUNMAMIS BILDIRIM SAYISI (RPC)
-- Tab badge icin hizli sayi
-- =============================================
CREATE OR REPLACE FUNCTION public.get_okunmamis_bildirim_sayisi()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.bildirimler
  WHERE alici_id = auth.uid() AND okundu = false;
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- 5. TUM BILDIRIMLERI OKUNDU YAP (RPC)
-- =============================================
CREATE OR REPLACE FUNCTION public.tum_bildirimleri_okundu_yap()
RETURNS VOID AS $$
  UPDATE public.bildirimler
  SET okundu = true
  WHERE alici_id = auth.uid() AND okundu = false;
$$ LANGUAGE sql SECURITY DEFINER;
