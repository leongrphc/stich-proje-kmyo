import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import { Audio } from "expo-av";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AksiyonKarti, { AKSIYON_TIPLERI, Btn } from "../components/AksiyonKarti";
import DegerlendirmeKarti from "../components/DegerlendirmeKarti";
import { AksiyonModal, AtamaModal } from "../components/Modaller";
import TalepBilgiKarti from "../components/TalepBilgiKarti";
import TimelineListesi from "../components/TimelineListesi";
import YorumListesi from "../components/YorumListesi";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { bildirimGonder, topluBildirimGonder, yoneticilereBildirim } from "../lib/bildirimler";
import { durumRengi, oncelikRengi, tarihFormat } from "../lib/helpers";
import { hataYonet } from "../lib/errorHandler";
import { supabase } from "../lib/supabase";
import GradientCard from "../components/GradientCard";

const SES_BUCKET = "talep-sesleri";

function sesIcerikTipiBelirle(uzanti) {
  switch ((uzanti || "").toLowerCase()) {
    case "m4a":
    case "mp4":
      return "audio/mp4";
    case "caf":
      return "audio/x-caf";
    case "webm":
      return "audio/webm";
    case "aac":
      return "audio/aac";
    default:
      return "application/octet-stream";
  }
}

export default function TalepDetayScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, role, fullName, isYonetici, isTeknisyen, isKullanici, isStaff } = useAuth();
  const { colors, shadows } = useAppTheme();
  const styles = useMemo(() => getStyles(colors, shadows), [colors, shadows]);
  const [talep, setTalep] = useState(null);
  const [yorumlar, setYorumlar] = useState([]);
  const [degerlendirme, setDegerlendirme] = useState(null);
  const [degerlendirmeForm, setDegerlendirmeForm] = useState({
    teknisyen_puani: 0,
    cozum_puani: 0,
    geri_bildirim: "",
  });
  const [degerlendirmeKaydediliyor, setDegerlendirmeKaydediliyor] = useState(false);
  const [yeniYorum, setYeniYorum] = useState("");
  const [loading, setLoading] = useState(true);
  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const [kayitYapiliyor, setKayitYapiliyor] = useState(false);
  const [sesYukleniyor, setSesYukleniyor] = useState(false);
  const [atamaModal, setAtamaModal] = useState(false);
  const [teknisyenler, setTeknisyenler] = useState([]);
  const [aksiyonModal, setAksiyonModal] = useState(false);
  const [aksiyonTipi, setAksiyonTipi] = useState("");
  const [aksiyonAciklama, setAksiyonAciklama] = useState("");
  const [aksiyonMaliyet, setAksiyonMaliyet] = useState("");
  const scrollRef = useRef(null);
  const sesKaydiRef = useRef(null);
  const kayitBaslangicRef = useRef(null);

  // --- VERİ ÇEKME ---
  const fetchTalep = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("talepler")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setTalep(data);
    } catch (error) {
      hataYonet(error, "Talep Yükleme");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchYorumlar = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("talep_yorumlari")
        .select("*")
        .eq("talep_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setYorumlar(data || []);
    } catch (error) {
      hataYonet(error, "Yorumlar");
    }
  }, [id]);

  const fetchDegerlendirme = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("talep_degerlendirmeleri")
        .select("*")
        .eq("talep_id", id)
        .maybeSingle();

      if (error) throw error;

      setDegerlendirme(data || null);
      setDegerlendirmeForm({
        teknisyen_puani: data?.teknisyen_puani || 0,
        cozum_puani: data?.cozum_puani || 0,
        geri_bildirim: data?.geri_bildirim || "",
      });
    } catch (error) {
      if (error?.code !== "PGRST116") {
        hataYonet(error, "Degerlendirme");
      }
    }
  }, [id]);

  useEffect(() => {
    fetchTalep();
    fetchYorumlar();
    fetchDegerlendirme();
  }, [fetchDegerlendirme, fetchTalep, fetchYorumlar]);

  useEffect(() => {
    return () => {
      sesKaydiRef.current?.stopAndUnloadAsync().catch(() => null);
      Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => null);
    };
  }, []);

  const handleDegerlendirmeKaydet = async () => {
    if (!talep?.teknisyen_id) {
      Alert.alert("Hata", "Degerlendirme icin teknisyen atamasi bulunamadi.");
      return;
    }

    if (!degerlendirmeForm.teknisyen_puani || !degerlendirmeForm.cozum_puani) {
      Alert.alert("Hata", "Lutfen iki puani da seciniz.");
      return;
    }

    setDegerlendirmeKaydediliyor(true);
    try {
      const payload = {
        talep_id: id,
        kullanici_id: user.id,
        teknisyen_id: talep.teknisyen_id,
        teknisyen_puani: degerlendirmeForm.teknisyen_puani,
        cozum_puani: degerlendirmeForm.cozum_puani,
        geri_bildirim: degerlendirmeForm.geri_bildirim.trim(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("talep_degerlendirmeleri")
        .upsert(payload, { onConflict: "talep_id" })
        .select("*")
        .single();

      if (error) throw error;

      setDegerlendirme(data);
      Alert.alert("Basarili", degerlendirme ? "Degerlendirmeniz guncellendi." : "Degerlendirmeniz kaydedildi.");
    } catch (error) {
      hataYonet(error, "Degerlendirme Kaydetme");
    } finally {
      setDegerlendirmeKaydediliyor(false);
    }
  };

  // --- YORUM ---
  const yorumEkle = async (payloadOrText, tur = "yorum") => {
    const payload =
      typeof payloadOrText === "object" && payloadOrText !== null
        ? payloadOrText
        : { yorum: payloadOrText, tur };

    try {
      const { error } = await supabase.from("talep_yorumlari").insert({
        talep_id: id,
        yazan_id: user.id,
        yazan_ad: fullName,
        yazan_rol: role,
        yorum: payload.yorum || "Sesli mesaj",
        tur: payload.tur || "yorum",
        mesaj_tipi: payload.mesajTipi || "text",
        ses_path: payload.sesPath || null,
        ses_suresi_ms: payload.sesSuresiMs || null,
      });
      if (error) throw error;
      await fetchYorumlar();
    } catch (error) {
      hataYonet(error, "Yorum Ekleme");
    }
  };

  const handleYorumGonder = async () => {
    if (!yeniYorum.trim()) return;
    await yorumEkle(yeniYorum.trim());

    const bildirimData = {
      gonderenId: user.id,
      gonderenAd: fullName,
      talepId: id,
      baslik: "Yeni Yorum",
      mesaj: `${fullName}: ${yeniYorum.trim().substring(0, 100)}`,
      tur: "yorum",
    };

    // Talep sahibi + teknisyene bildirim
    const alicilar = [];
    if (talep.kullanici_id && talep.kullanici_id !== user.id) alicilar.push(talep.kullanici_id);
    if (talep.teknisyen_id && talep.teknisyen_id !== user.id) alicilar.push(talep.teknisyen_id);
    if (alicilar.length > 0) {
      await topluBildirimGonder({ aliciIdler: alicilar, ...bildirimData });
    }

    // Yöneticilere de bildirim
    await yoneticilereBildirim(bildirimData);

    setYeniYorum("");
  };

  const handleYorumDuzenle = async (yorumId, metin) => {
    try {
      const { error } = await supabase
        .from("talep_yorumlari")
        .update({ yorum: metin, updated_at: new Date().toISOString() })
        .eq("id", yorumId)
        .eq("yazan_id", user.id)
        .eq("tur", "yorum")
        .eq("mesaj_tipi", "text");

      if (error) throw error;

      await fetchYorumlar();
      return true;
    } catch (error) {
      hataYonet(error, "Yorum Duzenleme");
      return false;
    }
  };

  const handleYorumSil = (yorum) => {
    Alert.alert(
      "Yorum Sil",
      "Bu yorumu silmek istediginize emin misiniz?",
      [
        { text: "Vazgec", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              if (yorum.mesaj_tipi === "voice" && yorum.ses_path) {
                const { error: storageError } = await supabase.storage
                  .from(SES_BUCKET)
                  .remove([yorum.ses_path]);

                if (storageError) throw storageError;
              }

              const { error } = await supabase
                .from("talep_yorumlari")
                .delete()
                .eq("id", yorum.id)
                .eq("yazan_id", user.id)
                .eq("tur", "yorum");

              if (error) throw error;

              await fetchYorumlar();
            } catch (error) {
              hataYonet(error, "Yorum Silme");
            }
          },
        },
      ],
    );
  };

  const sesKaydiniTemizle = async (recording = sesKaydiRef.current) => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // kayit daha once durdurulmus olabilir
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    }).catch(() => null);

    if (sesKaydiRef.current === recording) {
      sesKaydiRef.current = null;
    }

    kayitBaslangicRef.current = null;
  };

  const handleSesKaydiBaslat = async () => {
    try {
      const izin = await Audio.requestPermissionsAsync();
      if (izin.status !== "granted") {
        Alert.alert("Mikrofon Izni Gerekli", "Sesli mesaj birakmak icin mikrofon izni vermelisiniz.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      sesKaydiRef.current = recording;
      kayitBaslangicRef.current = Date.now();
      setKayitYapiliyor(true);
    } catch (error) {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => null);
      hataYonet(error, "Ses Kaydi");
    }
  };

  const handleSesKaydiIptal = async () => {
    await sesKaydiniTemizle();
    setKayitYapiliyor(false);
  };

  const handleSesKaydiBitir = async () => {
    if (!sesKaydiRef.current) return;

    setSesYukleniyor(true);
    const aktifKayit = sesKaydiRef.current;
    const kayitSuresiMs = kayitBaslangicRef.current
      ? Math.max(0, Date.now() - kayitBaslangicRef.current)
      : null;

    sesKaydiRef.current = null;
    kayitBaslangicRef.current = null;
    setKayitYapiliyor(false);

    try {
      try {
        await aktifKayit.stopAndUnloadAsync();
      } catch (stopError) {
        if (stopError?.message?.includes("E_AUDIO_NODATA")) {
          throw new Error("Kayitta ses verisi olusmadi. Mikrofon iznini ve cihaz ses girisini kontrol edin.");
        }
        throw stopError;
      }

      const sesUri = aktifKayit.getURI();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });

      if (!sesUri) {
        throw new Error("Ses kaydi dosyasi olusturulamadi.");
      }

      const dosyaBilgisi = await FileSystemLegacy.getInfoAsync(sesUri, { size: true });
      if (!dosyaBilgisi.exists || !dosyaBilgisi.size || dosyaBilgisi.size < 1024) {
        throw new Error("Ses dosyasi olusmadi. Kaydi biraz daha uzun alip tekrar deneyin.");
      }

      if (kayitSuresiMs !== null && kayitSuresiMs < 700) {
        throw new Error("Ses kaydi cok kisa oldu. En az 1 saniyelik kayit alip tekrar deneyin.");
      }

      const base64Ses = await FileSystemLegacy.readAsStringAsync(sesUri, {
        encoding: "base64",
      });
      const arrayBuffer = decode(base64Ses);
      const sesBytes = new Uint8Array(arrayBuffer);
      const uzanti = sesUri.split(".").pop()?.split("?")[0] || "m4a";
      const sesPath = `${id}/${Date.now()}-${user.id}.${uzanti}`;

      const { error: uploadError } = await supabase.storage
        .from(SES_BUCKET)
        .upload(sesPath, sesBytes, {
          contentType: sesIcerikTipiBelirle(uzanti),
          upsert: false,
        });

      if (uploadError) throw uploadError;

      await yorumEkle({
        yorum: "Sesli mesaj",
        tur: "yorum",
        mesajTipi: "voice",
        sesPath,
        sesSuresiMs: kayitSuresiMs,
      });

      const bildirimData = {
        gonderenId: user.id,
        gonderenAd: fullName,
        talepId: id,
        baslik: "Yeni Sesli Mesaj",
        mesaj: `${fullName} sesli mesaj birakti.`,
        tur: "yorum",
      };

      const alicilar = [];
      if (talep.kullanici_id && talep.kullanici_id !== user.id) alicilar.push(talep.kullanici_id);
      if (talep.teknisyen_id && talep.teknisyen_id !== user.id) alicilar.push(talep.teknisyen_id);

      if (alicilar.length > 0) {
        await topluBildirimGonder({ aliciIdler: alicilar, ...bildirimData });
      }

      await yoneticilereBildirim(bildirimData);
    } catch (error) {
      hataYonet(error, "Sesli Mesaj");
    } finally {
      setSesYukleniyor(false);
    }
  };

  // --- DURUM GÜNCELLE ---
  const durumGuncelle = async (yeniDurum, yorumText, bildirimTur = "durum_degisikligi") => {
    setIslemYapiliyor(true);
    try {
      const { error } = await supabase
        .from("talepler")
        .update({ durum: yeniDurum, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      if (yorumText) await yorumEkle(yorumText, "durum_degisikligi");

      // Talep sahibine bildirim
      if (talep.kullanici_id && talep.kullanici_id !== user.id) {
        await bildirimGonder({
          aliciId: talep.kullanici_id, gonderenId: user.id, gonderenAd: fullName,
          talepId: id, baslik: `Talep Durumu: ${yeniDurum}`,
          mesaj: `"${talep.baslik}" talebinizin durumu ${yeniDurum} olarak guncellendi.`,
          tur: bildirimTur,
        });
      }
      await fetchTalep();
    } catch (error) {
      Alert.alert("Hata", error.message);
    } finally {
      setIslemYapiliyor(false);
    }
  };

  // --- TEKNİSYEN İŞLEMLERİ ---
  const handleIslemeAl = () => {
    Alert.alert("Isleme Al", "Bu talebi isleme almak istiyor musunuz?", [
      { text: "Iptal", style: "cancel" },
      {
        text: "Isleme Al",
        onPress: () => durumGuncelle("Devam Ediyor", `${fullName} talebi isleme aldi.`),
      },
    ]);
  };

  const handleTamamlandi = () => {
    Alert.alert(
      "Tamamlandi Bildir",
      "Islem tamamlandi olarak yoneticiye bildirilecek. Onayliyor musunuz?",
      [
        { text: "Iptal", style: "cancel" },
        {
          text: "Bildir",
          onPress: async () => {
            setIslemYapiliyor(true);
            try {
              const { error } = await supabase
                .from("talepler")
                .update({ durum: "Onay Bekliyor", updated_at: new Date().toISOString() })
                .eq("id", id);
              if (error) throw error;
              await yorumEkle(
                `${fullName} islemi tamamladi ve yonetici onayina gonderdi.`,
                "onay"
              );
              // Yoneticilere bildirim
              await yoneticilereBildirim({
                gonderenId: user.id, gonderenAd: fullName, talepId: id,
                baslik: "Onay Bekliyor",
                mesaj: `${fullName} "${talep.baslik}" talebini tamamladi. Onayiniz bekleniyor.`,
                tur: "onay",
              });
              Alert.alert("Basarili", "Yoneticiye bildirildi.");
              await fetchTalep();
            } catch (error) {
              Alert.alert("Hata", error.message);
            } finally {
              setIslemYapiliyor(false);
            }
          },
        },
      ]
    );
  };

  const handleAksiyonGonder = async () => {
    if (!aksiyonTipi) { Alert.alert("Hata", "Aksiyon tipi seciniz."); return; }
    if (!aksiyonAciklama.trim()) { Alert.alert("Hata", "Aciklama giriniz."); return; }
    if (aksiyonTipi === "maliyet_onayi" && !aksiyonMaliyet.trim()) {
      Alert.alert("Hata", "Tahmini maliyet giriniz."); return;
    }

    setIslemYapiliyor(true);
    setAksiyonModal(false);
    try {
      const maliyet = aksiyonMaliyet ? parseFloat(aksiyonMaliyet) : null;
      const tipLabel = AKSIYON_TIPLERI.find(t => t.key === aksiyonTipi)?.label || aksiyonTipi;

      const { error } = await supabase
        .from("talepler")
        .update({
          durum: "Aksiyon Bekleniyor",
          aksiyon_tipi: aksiyonTipi,
          aksiyon_aciklama: aksiyonAciklama.trim(),
          tahmini_maliyet: maliyet,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      const yorumMetni = maliyet
        ? `[${tipLabel}] ${aksiyonAciklama.trim()} - Tahmini Maliyet: ${maliyet} TL`
        : `[${tipLabel}] ${aksiyonAciklama.trim()}`;
      await yorumEkle(`${fullName}: ${yorumMetni}`, "aksiyon");

      // Yoneticilere bildirim
      await yoneticilereBildirim({
        gonderenId: user.id, gonderenAd: fullName, talepId: id,
        baslik: "Aksiyon Gerekli",
        mesaj: `${fullName} "${talep.baslik}" icin ${tipLabel} talep ediyor.`,
        tur: "aksiyon",
      });

      Alert.alert("Basarili", "Aksiyon bildirimi gonderildi.");
      setAksiyonTipi(""); setAksiyonAciklama(""); setAksiyonMaliyet("");
      await fetchTalep();
    } catch (error) {
      Alert.alert("Hata", error.message);
    } finally {
      setIslemYapiliyor(false);
    }
  };

  // --- YÖNETİCİ: AKSİYON ONAYLA/REDDET ---
  const handleAksiyonOnayla = () => {
    Alert.alert("Aksiyonu Onayla", "Teknisyenin talebini onaylayip devam etmesini istiyor musunuz?", [
      { text: "Iptal", style: "cancel" },
      {
        text: "Onayla",
        onPress: async () => {
          setIslemYapiliyor(true);
          try {
            const { error } = await supabase
              .from("talepler")
              .update({
                durum: "Devam Ediyor",
                aksiyon_tipi: null, aksiyon_aciklama: null, tahmini_maliyet: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", id);
            if (error) throw error;
            await yorumEkle(`${fullName} aksiyonu onayladi. Teknisyen devam edebilir.`, "onay");
            // Teknisyene bildirim
            if (talep.teknisyen_id) {
              await bildirimGonder({
                aliciId: talep.teknisyen_id, gonderenId: user.id, gonderenAd: fullName,
                talepId: id, baslik: "Aksiyon Onaylandi",
                mesaj: `"${talep.baslik}" icin aksiyonunuz onaylandi. Devam edebilirsiniz.`,
                tur: "onay",
              });
            }
            Alert.alert("Basarili", "Aksiyon onaylandi.");
            await fetchTalep();
          } catch (error) {
            Alert.alert("Hata", error.message);
          } finally {
            setIslemYapiliyor(false);
          }
        },
      },
    ]);
  };

  const handleAksiyonReddet = () => {
    Alert.alert("Aksiyonu Reddet", "Teknisyenin talebini reddedip talebi kapatmak mi istiyorsunuz?", [
      { text: "Iptal", style: "cancel" },
      {
        text: "Reddet ve Devam Et",
        onPress: async () => {
          setIslemYapiliyor(true);
          try {
            const { error } = await supabase
              .from("talepler")
              .update({
                durum: "Devam Ediyor",
                aksiyon_tipi: null, aksiyon_aciklama: null, tahmini_maliyet: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", id);
            if (error) throw error;
            await yorumEkle(`${fullName} aksiyonu reddetti. Farkli cozum bulunmali.`, "red");
            if (talep.teknisyen_id) {
              await bildirimGonder({
                aliciId: talep.teknisyen_id, gonderenId: user.id, gonderenAd: fullName,
                talepId: id, baslik: "Aksiyon Reddedildi",
                mesaj: `"${talep.baslik}" icin aksiyonunuz reddedildi. Farkli cozum gerekiyor.`,
                tur: "red",
              });
            }
            await fetchTalep();
          } catch (error) {
            Alert.alert("Hata", error.message);
          } finally {
            setIslemYapiliyor(false);
          }
        },
      },
      {
        text: "Reddet ve Kapat",
        style: "destructive",
        onPress: async () => {
          setIslemYapiliyor(true);
          try {
            const { error } = await supabase
              .from("talepler")
              .update({
                durum: "Kapatildi",
                aksiyon_tipi: null, aksiyon_aciklama: null, tahmini_maliyet: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", id);
            if (error) throw error;
            await yorumEkle(`${fullName} aksiyonu reddetti ve talebi kapatti.`, "red");
            await fetchTalep();
          } catch (error) {
            Alert.alert("Hata", error.message);
          } finally {
            setIslemYapiliyor(false);
          }
        },
      },
    ]);
  };

  // --- YÖNETİCİ İŞLEMLERİ ---
  const handleTeknisyenAtaModal = async () => {
    try {
      const { data, error } = await supabase.rpc("get_teknisyenler");
      if (error) throw error;
      setTeknisyenler(data || []);
      setAtamaModal(true);
    } catch (error) {
      Alert.alert("Hata", "Teknisyen listesi yuklenemedi: " + error.message);
    }
  };

  const handleTeknisyenSec = async (tekn) => {
    setAtamaModal(false);
    setIslemYapiliyor(true);
    try {
      const teknAd = `${tekn.ad || ""} ${tekn.soyad || ""}`.trim();
      const { error } = await supabase
        .from("talepler")
        .update({
          teknisyen_id: tekn.id,
          teknisyen_ad: teknAd,
          durum: "Atandi",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      await yorumEkle(`Talep ${teknAd} adli teknisyene atandi.`, "atama");

      // Teknisyene bildirim
      await bildirimGonder({
        aliciId: tekn.id, gonderenId: user.id, gonderenAd: fullName,
        talepId: id, baslik: "Yeni Atama",
        mesaj: `"${talep.baslik}" talebi size atandi.`,
        tur: "atama",
      });
      // Talep sahibine bildirim
      if (talep.kullanici_id && talep.kullanici_id !== user.id) {
        await bildirimGonder({
          aliciId: talep.kullanici_id, gonderenId: user.id, gonderenAd: fullName,
          talepId: id, baslik: "Teknisyen Atandi",
          mesaj: `"${talep.baslik}" talebinize ${teknAd} atandi.`,
          tur: "atama",
        });
      }

      Alert.alert("Basarili", `Talep ${teknAd} adli teknisyene atandi.`);
      await fetchTalep();
    } catch (error) {
      Alert.alert("Hata", error.message);
    } finally {
      setIslemYapiliyor(false);
    }
  };

  const handleOnayla = () => {
    Alert.alert("Talebi Onayla", "Tamamlandi olarak onaylamak istiyor musunuz?", [
      { text: "Iptal", style: "cancel" },
      {
        text: "Onayla",
        onPress: () => durumGuncelle("Tamamlandi", `${fullName} talebi onayladi. Tamamlandi.`),
      },
    ]);
  };

  const handleReddet = () => {
    Alert.alert("Talebi Reddet", "Teknisyene geri gondermek istiyor musunuz?", [
      { text: "Iptal", style: "cancel" },
      {
        text: "Reddet",
        style: "destructive",
        onPress: () => durumGuncelle("Devam Ediyor", `${fullName} onay reddetti. Islem devam etmeli.`),
      },
    ]);
  };

  const handleKapat = () => {
    Alert.alert("Talebi Kapat", "Bu talep kapatilacak.", [
      { text: "Iptal", style: "cancel" },
      {
        text: "Kapat",
        onPress: () => durumGuncelle("Kapatildi", `${fullName} talebi kapatti.`),
      },
    ]);
  };

  const handleSil = () => {
    Alert.alert("Talebi Sil", "Bu talep kalici olarak silinecek. Emin misiniz?", [
      { text: "Iptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          setIslemYapiliyor(true);
          try {
            const { error } = await supabase.from("talepler").delete().eq("id", id);
            if (error) throw error;
            Alert.alert("Basarili", "Talep silindi.", [
              { text: "Tamam", onPress: () => router.back() },
            ]);
          } catch (error) {
            Alert.alert("Hata", error.message);
          } finally {
            setIslemYapiliyor(false);
          }
        },
      },
    ]);
  };

  // --- RENDER ---
  if (loading) {
    return (
        <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!talep) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.textPlaceholder} />
        <Text style={styles.errorText}>Talep bulunamadi.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <TalepBilgiKarti
        talep={talep}
        durumRengi={durumRengi}
        oncelikRengi={oncelikRengi}
        tarihFormat={tarihFormat}
      />

      <AksiyonKarti talep={talep} />

      {isKullanici && talep.kullanici_id === user?.id && talep.teknisyen_id && (
        <DegerlendirmeKarti
          talep={talep}
          degerlendirme={degerlendirme}
          form={degerlendirmeForm}
          setForm={setDegerlendirmeForm}
          kaydediliyor={degerlendirmeKaydediliyor}
          onKaydet={handleDegerlendirmeKaydet}
        />
      )}

      {/* İşlem Butonları */}
      {isStaff && (
        <GradientCard style={styles.card}>
          <Text style={styles.cardTitle}>Islemler</Text>

          {isTeknisyen && (
            <>
              {(talep.durum === "Atandi" || talep.durum === "Beklemede") && (
                <Btn color="#2196F3" icon="play-circle-outline" text="Isleme Al" onPress={handleIslemeAl} />
              )}
              {talep.durum === "Devam Ediyor" && (
                <>
                  <Btn color="#4CAF50" icon="checkmark-done-outline" text="Tamamlandi - Yoneticiye Bildir" onPress={handleTamamlandi} />
                  <Btn color="#E91E63" icon="warning-outline" text="Aksiyon Bildir" onPress={() => setAksiyonModal(true)} />
                </>
              )}
            </>
          )}

          {isYonetici && (
            <>
              {talep.durum === "Beklemede" && (
                <Btn color="#7C4DFF" icon="person-add-outline" text="Teknisyen Ata" onPress={handleTeknisyenAtaModal} />
              )}
              {talep.durum === "Atandi" && (
                <Btn color="#7C4DFF" icon="swap-horizontal-outline" text="Teknisyen Degistir" onPress={handleTeknisyenAtaModal} />
              )}
              {talep.durum === "Onay Bekliyor" && (
                <>
                  <Btn color="#4CAF50" icon="checkmark-circle-outline" text="Onayla - Tamamlandi" onPress={handleOnayla} />
                  <Btn color="#F44336" icon="close-circle-outline" text="Reddet - Devam Etsin" onPress={handleReddet} />
                </>
              )}
              {talep.durum === "Aksiyon Bekleniyor" && (
                <>
                  <Btn color="#4CAF50" icon="checkmark-circle-outline" text="Aksiyonu Onayla" onPress={handleAksiyonOnayla} />
                  <Btn color="#F44336" icon="close-circle-outline" text="Aksiyonu Reddet" onPress={handleAksiyonReddet} />
                </>
              )}
              {talep.durum !== "Kapatildi" && talep.durum !== "Tamamlandi" && (
                <Btn color="#9E9E9E" icon="close-circle-outline" text="Talebi Kapat" onPress={handleKapat} />
              )}
              <Btn color="#F44336" icon="trash-outline" text="Talebi Sil" onPress={handleSil} />
            </>
          )}
        </GradientCard>
      )}

      {/* Timeline */}
      {yorumlar.filter((y) => y.tur !== "yorum").length > 0 && (
        <GradientCard style={styles.card}>
          <TimelineListesi
            yorumlar={yorumlar.filter((y) => y.tur !== "yorum")}
          />
        </GradientCard>
      )}

      <YorumListesi
        yorumlar={yorumlar}
        yeniYorum={yeniYorum}
        setYeniYorum={setYeniYorum}
        onGonder={handleYorumGonder}
        scrollRef={scrollRef}
        canVoiceRecord={true}
        kayitYapiliyor={kayitYapiliyor}
        sesYukleniyor={sesYukleniyor}
        onSesKaydiBaslat={handleSesKaydiBaslat}
        onSesKaydiBitir={handleSesKaydiBitir}
        onSesKaydiIptal={handleSesKaydiIptal}
        currentUserId={user?.id}
        onYorumDuzenle={handleYorumDuzenle}
        onYorumSil={handleYorumSil}
      />

      {islemYapiliyor && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Islem yapiliyor...</Text>
        </View>
      )}

      <AksiyonModal
        visible={aksiyonModal}
        onClose={() => setAksiyonModal(false)}
        aksiyonTipi={aksiyonTipi}
        setAksiyonTipi={setAksiyonTipi}
        aksiyonAciklama={aksiyonAciklama}
        setAksiyonAciklama={setAksiyonAciklama}
        aksiyonMaliyet={aksiyonMaliyet}
        setAksiyonMaliyet={setAksiyonMaliyet}
        onGonder={handleAksiyonGonder}
      />

      <AtamaModal
        visible={atamaModal}
        onClose={() => setAtamaModal(false)}
        teknisyenler={teknisyenler}
        onTeknisyenSec={handleTeknisyenSec}
      />

    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors, shadows) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface || colors.background, padding: 16 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.surface || colors.background },
    errorText: { fontSize: 15, color: colors.outline || colors.textMuted, marginTop: 12 },
    card: {
      backgroundColor: colors.surfaceContainerLowest || colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      ...shadows.sm,
    },
    cardTitle: { fontSize: 11, fontWeight: "700", color: colors.outline || colors.textMuted, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" },
    loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8 },
    loadingText: { marginLeft: 8, color: colors.outline || colors.textMuted, fontSize: 14 },
  });
