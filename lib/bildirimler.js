import { supabase } from "./supabase";
import { sendPushNotification, sendBulkPushNotification } from "./pushSender";

export async function bildirimGonder({ aliciId, gonderenId, gonderenAd, talepId, baslik, mesaj, tur }) {
  try {
    const { error } = await supabase.from("bildirimler").insert({
      alici_id: aliciId,
      gonderen_id: gonderenId,
      gonderen_ad: gonderenAd,
      talep_id: talepId,
      baslik,
      mesaj,
      tur,
    });
    if (error) throw error;

    // Push bildirim gönder
    sendPushNotification({
      aliciId,
      baslik,
      mesaj,
      data: { talepId, tur },
    }).catch(() => null);
  } catch (error) {
    console.error("Bildirim gonderilemedi:", error.message);
  }
}

export async function topluBildirimGonder({ aliciIdler, gonderenId, gonderenAd, talepId, baslik, mesaj, tur }) {
  if (!aliciIdler || aliciIdler.length === 0) return;

  const kayitlar = aliciIdler
    .filter((id) => id !== gonderenId)
    .map((aliciId) => ({
      alici_id: aliciId,
      gonderen_id: gonderenId,
      gonderen_ad: gonderenAd,
      talep_id: talepId,
      baslik,
      mesaj,
      tur,
    }));

  if (kayitlar.length === 0) return;

  try {
    const { error } = await supabase.from("bildirimler").insert(kayitlar);
    if (error) throw error;

    // Push bildirim gönder
    const pushAlicilar = aliciIdler.filter((id) => id !== gonderenId);
    sendBulkPushNotification({
      aliciIdler: pushAlicilar,
      baslik,
      mesaj,
      data: { talepId, tur },
    }).catch(() => null);
  } catch (error) {
    console.error("Toplu bildirim gonderilemedi:", error.message);
  }
}

export async function yoneticilereBildirim({ gonderenId, gonderenAd, talepId, baslik, mesaj, tur }) {
  try {
    const { data, error } = await supabase.rpc("get_yonetici_idler");
    if (error) throw error;
    const idler = (data || []).map((r) => r.id);
    await topluBildirimGonder({ aliciIdler: idler, gonderenId, gonderenAd, talepId, baslik, mesaj, tur });
  } catch (error) {
    console.error("Yonetici bildirimi gonderilemedi:", error.message);
  }
}

export async function okunmamisSayisiGetir() {
  try {
    const { data, error } = await supabase.rpc("get_okunmamis_bildirim_sayisi");
    if (error) throw error;
    return data || 0;
  } catch {
    return 0;
  }
}

export async function okunduIsaretle(bildirimId) {
  try {
    const { error } = await supabase
      .from("bildirimler")
      .update({ okundu: true })
      .eq("id", bildirimId);
    if (error) throw error;
  } catch (error) {
    console.error("Bildirim okundu yapilamadi:", error.message);
  }
}

export async function tumunuOkunduYap() {
  try {
    const { error } = await supabase.rpc("tum_bildirimleri_okundu_yap");
    if (error) throw error;
  } catch (error) {
    console.error("Bildirimler okundu yapilamadi:", error.message);
  }
}
