-- =============================================
-- KMYO Teknik Servis - Push Notification Kurulumu
-- Bu SQL'i Supabase Dashboard > SQL Editor'de calistirin
-- =============================================

-- 1. PROFILES TABLOSUNA PUSH TOKEN KOLONU
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- 2. PUSH TOKEN SORGULAMA FONKSIYONU (RLS BYPASS)
-- Bildirim gonderirken alicinin token'ini almak icin
-- SECURITY DEFINER ile calisir, RLS'i bypass eder
CREATE OR REPLACE FUNCTION public.get_push_tokens(user_ids UUID[])
RETURNS TABLE(push_token TEXT) AS $$
  SELECT expo_push_token
  FROM public.profiles
  WHERE id = ANY(user_ids)
    AND expo_push_token IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- Tek kullanici icin token getirme
CREATE OR REPLACE FUNCTION public.get_push_token(target_user_id UUID)
RETURNS TEXT AS $$
  SELECT expo_push_token
  FROM public.profiles
  WHERE id = target_user_id
    AND expo_push_token IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;
