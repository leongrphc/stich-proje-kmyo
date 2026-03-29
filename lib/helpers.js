import { RENKLER } from "./theme";

const DURUM_RENK_MAP = {
  Beklemede: RENKLER.beklemede,
  Atandi: RENKLER.atandi,
  "Devam Ediyor": RENKLER.devamEdiyor,
  "Aksiyon Bekleniyor": RENKLER.aksiyonBekleniyor,
  "Onay Bekliyor": RENKLER.onayBekliyor,
  Tamamlandi: RENKLER.tamamlandi,
  Kapatildi: RENKLER.kapatildi,
};

const ONCELIK_RENK_MAP = {
  Yuksek: RENKLER.yuksek,
  "Yüksek": RENKLER.yuksek,
  Orta: RENKLER.orta,
  Dusuk: RENKLER.dusuk,
  "Düşük": RENKLER.dusuk,
};

const ROL_ETIKET_MAP = {
  yonetici: "Yonetici",
  teknisyen: "Teknisyen",
  kullanici: "Kullanici",
};

export const MUSAITLIK_SECENEKLERI = ["Musait", "Mesgul", "Izinde"];

export const UZMANLIK_SECENEKLERI = [
  "Bilgisayar",
  "Yazici",
  "Projeksiyon",
  "Ag / Internet",
  "Klima",
  "Elektrik",
  "Diger",
];

export function durumRengi(durum) {
  return DURUM_RENK_MAP[durum] || "#999";
}

export function oncelikRengi(oncelik) {
  return ONCELIK_RENK_MAP[oncelik] || "#999";
}

export function rolEtiketi(rol) {
  return ROL_ETIKET_MAP[rol] || "Kullanici";
}

export function musaitlikRengi(musaitlik) {
  switch (musaitlik) {
    case "Musait":
      return RENKLER.success;
    case "Mesgul":
      return RENKLER.warning;
    case "Izinde":
      return RENKLER.kapatildi;
    default:
      return RENKLER.textMuted;
  }
}

export function tarihFormat(tarih, saatGoster = false) {
  if (!tarih) return "";
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  if (saatGoster) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  return new Date(tarih).toLocaleDateString("tr-TR", options);
}

export function sureFormatla(ms) {
  if (typeof ms !== "number" || Number.isNaN(ms)) return "--:--";

  const toplamSaniye = Math.max(0, Math.round(ms / 1000));
  const saat = Math.floor(toplamSaniye / 3600);
  const dakika = Math.floor((toplamSaniye % 3600) / 60);
  const saniye = toplamSaniye % 60;

  if (saat > 0) {
    return `${String(saat).padStart(2, "0")}:${String(dakika).padStart(2, "0")}:${String(saniye).padStart(2, "0")}`;
  }

  return `${String(dakika).padStart(2, "0")}:${String(saniye).padStart(2, "0")}`;
}
