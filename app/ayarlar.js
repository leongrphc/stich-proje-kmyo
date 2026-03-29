import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { hataYonet } from "../lib/errorHandler";
import {
  MUSAITLIK_SECENEKLERI,
  UZMANLIK_SECENEKLERI,
  musaitlikRengi,
  rolEtiketi,
} from "../lib/helpers";
import { supabase } from "../lib/supabase";
import { RADIUS, SPACING } from "../lib/theme";

const ROL_SECENEKLERI = [
  { value: "kullanici", label: "Kullanıcı", icon: "person-outline" },
  { value: "teknisyen", label: "Teknisyen", icon: "construct-outline" },
  { value: "yonetici", label: "Yönetici", icon: "shield-checkmark-outline" },
];

export default function AyarlarScreen() {
  const router = useRouter();
  const { user, fullName, role, isYonetici, refreshProfile } = useAuth();
  const { colors, shadows } = useAppTheme();
  const styles = useMemo(() => getStyles(colors, shadows), [colors, shadows]);

  const [kullanicilar, setKullanicilar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [islemdeId, setIslemdeId] = useState(null);
  const [teknisyenModalAcik, setTeknisyenModalAcik] = useState(false);
  const [aktifTeknisyen, setAktifTeknisyen] = useState(null);
  const [teknisyenKaydediliyor, setTeknisyenKaydediliyor] = useState(false);
  const [teknisyenForm, setTeknisyenForm] = useState({
    musaitlik: "Musait",
    uzmanlik_alanlari: [],
  });
  const [dashboard, setDashboard] = useState({
    aylikVeriler: [],
    kategoriDagilimi: [],
    teknisyenPerformans: [],
    acilTalepler: 0,
    aktifGorevler: 0,
    bekleyenOnay: 0,
    memnuniyet: 0,
    toplamTalep: 0,
  });

  const kullanicilariGetir = useCallback(
    async (yenileme = false) => {
      if (!isYonetici) {
        setKullanicilar([]);
        setYukleniyor(false);
        setYenileniyor(false);
        return;
      }

      if (yenileme) {
        setYenileniyor(true);
      } else {
        setYukleniyor(true);
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, ad, soyad, email, rol, musaitlik, uzmanlik_alanlari")
          .order("ad", { ascending: true })
          .order("soyad", { ascending: true });

        if (error) throw error;
        setKullanicilar(data || []);
      } catch (error) {
        hataYonet(error, "Kullanıcılar Yüklenemedi");
      } finally {
        setYukleniyor(false);
        setYenileniyor(false);
      }
    },
    [isYonetici],
  );

  useFocusEffect(
    useCallback(() => {
      kullanicilariGetir();
      if (isYonetici) fetchDashboard();
    }, [kullanicilariGetir, isYonetici]),
  );

  const fetchDashboard = async () => {
    try {
      const { data: talepler } = await supabase.from("talepler").select("*");
      const t = talepler || [];

      // Aylık talep verileri (son 6 ay)
      const aylar = [];
      const simdi = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(simdi.getFullYear(), simdi.getMonth() - i, 1);
        const ayAd = d.toLocaleDateString("tr-TR", { month: "short" });
        const yil = d.getFullYear();
        const ay = d.getMonth();
        const sayi = t.filter((x) => {
          const td = new Date(x.created_at);
          return td.getFullYear() === yil && td.getMonth() === ay;
        }).length;
        aylar.push({ ay: ayAd, sayi });
      }

      // Kategori dağılımı
      const katMap = {};
      t.forEach((x) => {
        const k = x.kategori || "Diğer";
        katMap[k] = (katMap[k] || 0) + 1;
      });
      const katRenkler = ["#00236f", "#1e3a8a", "#264191", "#3b82f6", "#60a5fa", "#93c5fd", "#c084fc"];
      const kategoriDagilimi = Object.entries(katMap)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v], i) => ({ label: k, sayi: v, renk: katRenkler[i % katRenkler.length] }));

      // Teknisyen performansı
      const teknisyenMap = {};
      t.forEach((x) => {
        if (!x.teknisyen_id) return;
        if (!teknisyenMap[x.teknisyen_id]) {
          teknisyenMap[x.teknisyen_id] = { ad: x.teknisyen_ad || "Bilinmiyor", toplam: 0, tamamlanan: 0 };
        }
        teknisyenMap[x.teknisyen_id].toplam++;
        if (x.durum === "Tamamlandi" || x.durum === "Kapatildi") teknisyenMap[x.teknisyen_id].tamamlanan++;
      });
      const teknisyenPerformans = Object.values(teknisyenMap)
        .sort((a, b) => b.toplam - a.toplam)
        .slice(0, 5)
        .map((tp) => ({ ...tp, oran: tp.toplam > 0 ? Math.round((tp.tamamlanan / tp.toplam) * 100) : 0 }));

      // Memnuniyet puanı
      let memnuniyet = 0;
      try {
        const { data: degData } = await supabase.from("talep_degerlendirmeleri").select("teknisyen_puani, cozum_puani");
        if (degData && degData.length > 0) {
          const topPuan = degData.reduce((s, d) => s + ((d.teknisyen_puani || 0) + (d.cozum_puani || 0)) / 2, 0);
          memnuniyet = (topPuan / degData.length).toFixed(1);
        }
      } catch {}

      setDashboard({
        aylikVeriler: aylar,
        kategoriDagilimi,
        teknisyenPerformans,
        acilTalepler: t.filter((x) => x.oncelik === "Yüksek" && x.durum !== "Tamamlandi" && x.durum !== "Kapatildi").length,
        aktifGorevler: t.filter((x) => x.durum === "Devam Ediyor" || x.durum === "Atandi").length,
        bekleyenOnay: t.filter((x) => x.durum === "Aksiyon Bekleniyor" || x.durum === "Onay Bekliyor").length,
        memnuniyet: Number(memnuniyet) || 0,
        toplamTalep: t.length,
      });
    } catch (err) {
      console.error("Dashboard verileri:", err.message);
    }
  };

  const kullaniciOzeti = useMemo(() => {
    return kullanicilar.reduce(
      (acc, item) => {
        acc.toplam += 1;
        if (item.rol === "yonetici") acc.yonetici += 1;
        if (item.rol === "teknisyen") acc.teknisyen += 1;
        if (item.rol === "kullanici") acc.kullanici += 1;
        return acc;
      },
      { toplam: 0, yonetici: 0, teknisyen: 0, kullanici: 0 },
    );
  }, [kullanicilar]);

  const rolGuncelle = async (hedefKullanici, yeniRol) => {
    setIslemdeId(hedefKullanici.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ rol: yeniRol })
        .eq("id", hedefKullanici.id);

      if (error) throw error;

      setKullanicilar((onceki) =>
        onceki.map((item) =>
          item.id === hedefKullanici.id ? { ...item, rol: yeniRol } : item,
        ),
      );

      if (hedefKullanici.id === user?.id) {
        await refreshProfile();
      }

      Alert.alert(
        "Rol Güncellendi",
        `${tamAd(hedefKullanici)} için yeni rol: ${rolEtiketi(yeniRol)}.`,
      );
    } catch (error) {
      hataYonet(error, "Rol Güncelleme");
    } finally {
      setIslemdeId(null);
    }
  };

  const rolDegisikliginiOnayla = (hedefKullanici, yeniRol) => {
    if (hedefKullanici.rol === yeniRol || islemdeId === hedefKullanici.id) {
      return;
    }

    const hedefAd = tamAd(hedefKullanici);
    const mevcutRol = rolEtiketi(hedefKullanici.rol);
    const yeniRolEtiket = rolEtiketi(yeniRol);
    const kendisi = hedefKullanici.id === user?.id;
    const mesaj = kendisi
      ? `Kendi rolünüzü ${mevcutRol} yerine ${yeniRolEtiket} olarak değiştirmek istediğinize emin misiniz?`
      : `${hedefAd} için rol ${mevcutRol} yerine ${yeniRolEtiket} olarak atansın mı?`;

    Alert.alert("Rol Atama", mesaj, [
      { text: "İptal", style: "cancel" },
      {
        text: "Rol Ata",
        onPress: () => rolGuncelle(hedefKullanici, yeniRol),
      },
    ]);
  };

  const teknisyenDuzenleModaliniAc = (teknisyen) => {
    setAktifTeknisyen(teknisyen);
    setTeknisyenForm({
      musaitlik: teknisyen.musaitlik || "Musait",
      uzmanlik_alanlari: teknisyen.uzmanlik_alanlari || [],
    });
    setTeknisyenModalAcik(true);
  };

  const uzmanlikDegistir = (alan) => {
    setTeknisyenForm((onceki) => {
      const secili = onceki.uzmanlik_alanlari.includes(alan);
      return {
        ...onceki,
        uzmanlik_alanlari: secili
          ? onceki.uzmanlik_alanlari.filter((item) => item !== alan)
          : [...onceki.uzmanlik_alanlari, alan],
      };
    });
  };

  const teknisyenBilgileriniKaydet = async () => {
    if (!aktifTeknisyen) return;

    setTeknisyenKaydediliyor(true);
    try {
      const payload = {
        musaitlik: teknisyenForm.musaitlik,
        uzmanlik_alanlari: teknisyenForm.uzmanlik_alanlari,
      };

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", aktifTeknisyen.id);

      if (error) throw error;

      setKullanicilar((onceki) =>
        onceki.map((item) =>
          item.id === aktifTeknisyen.id ? { ...item, ...payload } : item,
        ),
      );

      setTeknisyenModalAcik(false);
      setAktifTeknisyen(null);
      Alert.alert("Başarılı", `${tamAd(aktifTeknisyen)} için teknik bilgiler güncellendi.`);
    } catch (error) {
      hataYonet(error, "Teknisyen Bilgileri");
    } finally {
      setTeknisyenKaydediliyor(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: SPACING.xxxl }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        isYonetici ? (
          <RefreshControl
            refreshing={yenileniyor}
            onRefresh={() => { kullanicilariGetir(true); fetchDashboard(); }}
            tintColor={colors.primary}
          />
        ) : undefined
      }
    >
      {/* Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
          <Text style={styles.backBtnText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yönetici Paneli</Text>
      </View>

      {/* Welcome */}
      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.welcomeLabel}>YÖNETİCİ PANELİ</Text>
          <Text style={styles.welcomeName}>Hoşgeldiniz, {fullName?.split(" ")[0] || "Yönetici"}</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
        </View>
      </View>

      {/* Admin Section */}
      {isYonetici && (
        <>
          {/* Telemetry Strip */}
          <View style={styles.telemetryRow}>
            <View style={styles.telemetryModule}>
              <Text style={styles.telemetryLabel}>AKTİF GÖREVLER</Text>
              <Text style={styles.telemetryValue}>{dashboard.aktifGorevler}</Text>
              <View style={[styles.telemetryAccent, { backgroundColor: colors.primary }]} />
            </View>
            <View style={styles.telemetryModule}>
              <Text style={styles.telemetryLabel}>BEKLEYEN ONAY</Text>
              <Text style={styles.telemetryValue}>{dashboard.bekleyenOnay}</Text>
              <View style={[styles.telemetryAccent, { backgroundColor: colors.warning }]} />
            </View>
            <View style={styles.telemetryModule}>
              <Text style={styles.telemetryLabel}>MEMNUNİYET</Text>
              <Text style={styles.telemetryValue}>{dashboard.memnuniyet || "—"}</Text>
              <View style={[styles.telemetryAccent, { backgroundColor: colors.success }]} />
            </View>
          </View>

          {/* Hızlı İşlemler */}
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push("/(tabs)/talepler")} activeOpacity={0.7}>
              <View style={[styles.quickActionIconBg, { backgroundColor: `${colors.primary}14` }]}>
                <Ionicons name="list-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Tüm Talepler</Text>
            </TouchableOpacity>
          
            <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push("/(tabs)/profil")} activeOpacity={0.7}>
              <View style={[styles.quickActionIconBg, { backgroundColor: `${colors.outline}14` }]}>
                <Ionicons name="settings-outline" size={22} color={colors.outline} />
              </View>
              <Text style={styles.quickActionLabel}>Ayarlar</Text>
            </TouchableOpacity>
          </View>

          {/* Aylık Talep Analizi */}
          <View style={styles.dashSection}>
            <View style={styles.dashSectionHeader}>
              <View style={[styles.dashAccent, { backgroundColor: colors.primary }]} />
              <Text style={styles.dashSectionTitle}>Aylık Talep Analizi</Text>
              <Text style={styles.dashSectionBadge}>{dashboard.toplamTalep} toplam</Text>
            </View>
            <View style={styles.chartCard}>
              <View style={styles.barChartRow}>
                {dashboard.aylikVeriler.map((item, i) => {
                  const maxVal = Math.max(...dashboard.aylikVeriler.map((v) => v.sayi), 1);
                  const pct = (item.sayi / maxVal) * 100;
                  return (
                    <View key={i} style={styles.barCol}>
                      <Text style={styles.barValue}>{item.sayi}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { height: `${Math.max(pct, 4)}%`, backgroundColor: colors.primary }]} />
                      </View>
                      <Text style={styles.barLabel}>{item.ay}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Acil Talepler Uyarısı */}
          {dashboard.acilTalepler > 0 && (
            <View style={styles.alertCard}>
              <View style={styles.alertIconBg}>
                <Ionicons name="warning" size={20} color={colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>Acil Talepler</Text>
                <Text style={styles.alertDesc}>{dashboard.acilTalepler} adet yüksek öncelikli çözülmemiş talep mevcut.</Text>
              </View>
            </View>
          )}

          {/* Kategori Dağılımı */}
          <View style={styles.dashSection}>
            <View style={styles.dashSectionHeader}>
              <View style={[styles.dashAccent, { backgroundColor: colors.tertiaryColor || "#264191" }]} />
              <Text style={styles.dashSectionTitle}>Kategori Dağılımı</Text>
            </View>
            <View style={styles.chartCard}>
              {dashboard.kategoriDagilimi.length > 0 ? (
                dashboard.kategoriDagilimi.map((kat, i) => {
                  const maxKat = Math.max(...dashboard.kategoriDagilimi.map((k) => k.sayi), 1);
                  return (
                    <View key={i} style={styles.hBarRow}>
                      <Text style={styles.hBarLabel} numberOfLines={1}>{kat.label}</Text>
                      <View style={styles.hBarTrack}>
                        <View style={[styles.hBarFill, { width: `${(kat.sayi / maxKat) * 100}%`, backgroundColor: kat.renk }]} />
                      </View>
                      <Text style={styles.hBarValue}>{kat.sayi}</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyChartText}>Veri bulunamadı</Text>
              )}
            </View>
          </View>

          {/* Teknisyen Performansı */}
          {dashboard.teknisyenPerformans.length > 0 && (
            <View style={styles.dashSection}>
              <View style={styles.dashSectionHeader}>
                <View style={[styles.dashAccent, { backgroundColor: colors.success }]} />
                <Text style={styles.dashSectionTitle}>Ekip Performansı</Text>
              </View>
              <View style={styles.chartCard}>
                {dashboard.teknisyenPerformans.map((tp, i) => (
                  <View key={i} style={styles.perfRow}>
                    <View style={styles.perfInfo}>
                      <Text style={styles.perfName}>{tp.ad}</Text>
                      <Text style={styles.perfDetail}>{tp.tamamlanan}/{tp.toplam} tamamlandı</Text>
                    </View>
                    <View style={styles.perfBarTrack}>
                      <View style={[styles.perfBarFill, { width: `${tp.oran}%` }]} />
                    </View>
                    <Text style={styles.perfPct}>{tp.oran}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* User Stats */}
          <View style={styles.statsGrid}>
            <StatCard icon="people" label="Toplam" value={kullaniciOzeti.toplam} color={colors.primary} />
            <StatCard icon="shield-checkmark" label="Yönetici" value={kullaniciOzeti.yonetici} color={colors.indigo} />
            <StatCard icon="construct" label="Teknisyen" value={kullaniciOzeti.teknisyen} color={colors.purple} />
          </View>

          {/* User List */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>KULLANICILARI YÖNET</Text>
          </View>

          {yukleniyor ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
          ) : kullanicilar.length > 0 ? (
            <View style={styles.usersContainer}>
              {kullanicilar.map((item) => (
                <UserRoleCard
                  key={item.id}
                  user={item}
                  isLoadingId={islemdeId}
                  currentUserId={user?.id}
                  onRoleChange={rolDegisikliginiOnayla}
                  onEditTeknisyen={teknisyenDuzenleModaliniAc}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={40} color={colors.textPlaceholder} />
              <Text style={styles.emptyText}>Kullanıcı bulunamadı</Text>
            </View>
          )}
        </>
      )}

      {/* Restricted */}
      {!isYonetici && (
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedIcon}>
            <Ionicons name="lock-closed-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.restrictedTitle}>Yönetici Yetkisi Gerekli</Text>
          <Text style={styles.restrictedText}>
            Bu alan sadece yönetici rolüne sahip kullanıcılara açıktır
          </Text>
        </View>
      )}

      {/* Technician Modal */}
      <Modal visible={teknisyenModalAcik} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Teknisyen Profili</Text>
            <Text style={styles.modalSubtitle}>
              {(aktifTeknisyen && tamAd(aktifTeknisyen)) || "Teknisyen"} için müsaitlik ve uzmanlık alanları
            </Text>

            <Text style={styles.modalSectionLabel}>MÜSAİTLİK</Text>
            <View style={styles.chipRow}>
              {MUSAITLIK_SECENEKLERI.map((durum) => {
                const secili = teknisyenForm.musaitlik === durum;
                const renk = musaitlikRengi(durum);
                return (
                  <TouchableOpacity
                    key={durum}
                    style={[
                      styles.modalChip,
                      { borderColor: renk },
                      secili && { backgroundColor: renk },
                    ]}
                    onPress={() => setTeknisyenForm((o) => ({ ...o, musaitlik: durum }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalChipText, secili && { color: "#fff" }]}>{durum}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalSectionLabel}>UZMANLIK ALANLARI</Text>
            <View style={styles.chipRow}>
              {UZMANLIK_SECENEKLERI.map((alan) => {
                const secili = teknisyenForm.uzmanlik_alanlari.includes(alan);
                return (
                  <TouchableOpacity
                    key={alan}
                    style={[styles.modalChip, secili && styles.modalChipActive]}
                    onPress={() => uzmanlikDegistir(alan)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalChipText, secili && styles.modalChipTextActive]}>{alan}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, teknisyenKaydediliyor && { opacity: 0.6 }]}
              onPress={teknisyenBilgileriniKaydet}
              disabled={teknisyenKaydediliyor}
              activeOpacity={0.8}
            >
              {teknisyenKaydediliyor ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalPrimaryBtnText}>Kaydet</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setTeknisyenModalAcik(false);
                setAktifTeknisyen(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelBtnText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function UserRoleCard({ user, isLoadingId, currentUserId, onRoleChange, onEditTeknisyen }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isLoading = isLoadingId === user.id;

  return (
    <View style={styles.userCard}>
      <View style={styles.userCardHeader}>
        <View style={styles.userAvatarSmall}>
          <Text style={styles.userAvatarText}>{getInitials(tamAd(user))}</Text>
        </View>
        <View style={styles.userCardInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
            <Text style={styles.userCardName}>{tamAd(user)}</Text>
            {user.id === currentUserId && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>SEN</Text>
              </View>
            )}
          </View>
          <Text style={styles.userCurrentRole}>
            {rolEtiketi(user.rol)}
          </Text>
        </View>
        {isLoading && <ActivityIndicator color={colors.primary} />}
      </View>

      <View style={styles.roleButtonsRow}>
        {ROL_SECENEKLERI.map((secenek) => (
          <TouchableOpacity
            key={secenek.value}
            style={[
              styles.roleBtn,
              user.rol === secenek.value && styles.roleBtnActive,
              isLoading && styles.roleBtnDisabled,
            ]}
            disabled={isLoading}
            onPress={() => onRoleChange(user, secenek.value)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={secenek.icon}
              size={15}
              color={user.rol === secenek.value ? "#fff" : colors.textMuted}
            />
            <Text
              style={[
                styles.roleBtnText,
                user.rol === secenek.value && styles.roleBtnTextActive,
              ]}
            >
              {secenek.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {user.rol === "teknisyen" && (
        <View style={styles.teknisyenInfo}>
          <View style={styles.teknisyenInfoRow}>
            <Text style={styles.teknisyenLabel}>Müsaitlik</Text>
            <View style={[styles.statusPill, { backgroundColor: `${musaitlikRengi(user.musaitlik || "Musait")}18` }]}>
              <Text style={[styles.statusPillText, { color: musaitlikRengi(user.musaitlik || "Musait") }]}>
                {user.musaitlik || "Müsait"}
              </Text>
            </View>
          </View>

          <Text style={styles.teknisyenLabel}>Uzmanlık</Text>
          <View style={styles.uzmanlikChipRow}>
            {(user.uzmanlik_alanlari || []).length > 0 ? (
              (user.uzmanlik_alanlari || []).map((alan) => (
                <View key={`${user.id}-${alan}`} style={styles.uzmanlikChipSmall}>
                  <Text style={styles.uzmanlikChipSmallText}>{alan}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.uzmanlikBosText}>Henüz uzmanlık tanımlanmadı</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.editTeknisyenBtn}
            onPress={() => onEditTeknisyen(user)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editTeknisyenText}>Teknik Bilgileri Düzenle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function StatCard({ icon, label, value, color }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: color + "14" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function tamAd(item) {
  const ad = `${item?.ad || ""} ${item?.soyad || ""}`.trim();
  return ad || "İsimsiz Kullanıcı";
}

function getInitials(name) {
  const parts = (name || "").split(" ").filter(Boolean).slice(0, 2);
  if (!parts.length) return "KM";
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

const getStyles = (colors, shadows = {}) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface || colors.background },
    customHeader: {
      backgroundColor: colors.surfaceContainerLowest || colors.secondaryBackground,
      paddingTop: Platform.OS === "ios" ? 56 : 40,
      paddingBottom: SPACING.md,
      paddingHorizontal: SPACING.base,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    backBtnText: {
      fontSize: 17,
      color: colors.primary,
      fontWeight: "400",
      letterSpacing: -0.41,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.primary,
      letterSpacing: -0.3,
    },
    welcomeSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.lg,
    },
    welcomeLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.outline || colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: SPACING.xs,
    },
    welcomeName: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.onSurface || colors.text,
      letterSpacing: -0.3,
    },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primaryBg,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.primary,
    },
    telemetryRow: {
      flexDirection: "row",
      paddingHorizontal: SPACING.base,
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    telemetryModule: {
      flex: 1,
      backgroundColor: colors.surfaceContainerHighest || colors.quaternaryFill,
      borderRadius: RADIUS.lg,
      padding: SPACING.base,
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
    },
    telemetryLabel: {
      fontSize: 8,
      fontWeight: "700",
      color: colors.outline || colors.textMuted,
      letterSpacing: 1,
      marginBottom: SPACING.xs,
    },
    telemetryValue: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.onSurface || colors.text,
      letterSpacing: -0.3,
    },
    telemetryAccent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
    },
    quickActionsGrid: {
      flexDirection: "row",
      paddingHorizontal: SPACING.base,
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    quickActionCard: {
      flex: 1,
      backgroundColor: colors.surfaceContainerLowest || colors.card,
      borderRadius: RADIUS.card,
      padding: SPACING.base,
      alignItems: "center",
      gap: SPACING.sm,
      ...shadows.sm,
    },
    quickActionIconBg: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
    },
    quickActionLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.onSurfaceVariant || colors.textTertiary,
      textAlign: "center",
    },
    dashSection: {
      paddingHorizontal: SPACING.base,
      marginBottom: SPACING.lg,
    },
    dashSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    dashAccent: {
      width: 4,
      height: 20,
      borderRadius: 2,
    },
    dashSectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.onSurface || colors.text,
      letterSpacing: -0.3,
      flex: 1,
    },
    dashSectionBadge: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.outline || colors.textMuted,
    },
    chartCard: {
      backgroundColor: colors.surfaceContainerLowest || colors.card,
      borderRadius: RADIUS.card,
      padding: SPACING.lg,
      ...shadows.sm,
    },
    barChartRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: 140,
      gap: SPACING.sm,
    },
    barCol: {
      flex: 1,
      alignItems: "center",
      gap: SPACING.xs,
    },
    barValue: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.onSurfaceVariant || colors.textMuted,
    },
    barTrack: {
      width: "100%",
      flex: 1,
      backgroundColor: colors.surfaceContainerHigh || colors.quaternaryFill,
      borderRadius: 4,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    barFill: {
      width: "100%",
      borderRadius: 4,
    },
    barLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.outline || colors.textMuted,
      textTransform: "uppercase",
    },
    alertCard: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: SPACING.base,
      marginBottom: SPACING.lg,
      backgroundColor: colors.errorContainer || `${colors.danger}12`,
      borderRadius: RADIUS.card,
      padding: SPACING.base,
      gap: SPACING.md,
    },
    alertIconBg: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.danger}18`,
      justifyContent: "center",
      alignItems: "center",
    },
    alertTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.onErrorContainer || colors.danger,
    },
    alertDesc: {
      fontSize: 12,
      color: colors.onSurfaceVariant || colors.textMuted,
      marginTop: 2,
    },
    hBarRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
      gap: SPACING.sm,
    },
    hBarLabel: {
      width: 80,
      fontSize: 12,
      fontWeight: "600",
      color: colors.onSurfaceVariant || colors.textTertiary,
    },
    hBarTrack: {
      flex: 1,
      height: 10,
      backgroundColor: colors.surfaceContainerHigh || colors.quaternaryFill,
      borderRadius: 5,
      overflow: "hidden",
    },
    hBarFill: {
      height: "100%",
      borderRadius: 5,
    },
    hBarValue: {
      width: 28,
      fontSize: 13,
      fontWeight: "700",
      color: colors.onSurface || colors.text,
      textAlign: "right",
    },
    emptyChartText: {
      fontSize: 13,
      color: colors.outline || colors.textMuted,
      textAlign: "center",
      paddingVertical: SPACING.xl,
    },
    perfRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
      gap: SPACING.sm,
    },
    perfInfo: {
      width: 110,
    },
    perfName: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.onSurface || colors.text,
    },
    perfDetail: {
      fontSize: 10,
      color: colors.outline || colors.textMuted,
      marginTop: 1,
    },
    perfBarTrack: {
      flex: 1,
      height: 8,
      backgroundColor: colors.surfaceContainerHigh || colors.quaternaryFill,
      borderRadius: 4,
      overflow: "hidden",
    },
    perfBarFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    perfPct: {
      width: 36,
      fontSize: 13,
      fontWeight: "700",
      color: colors.success,
      textAlign: "right",
    },
    statsGrid: {
      flexDirection: "row",
      paddingHorizontal: SPACING.base,
      gap: SPACING.md,
      marginTop: SPACING.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surfaceContainerLowest || colors.card,
      borderRadius: RADIUS.card,
      padding: SPACING.md,
      alignItems: "center",
      ...shadows.sm,
    },
    statIconBg: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    statValue: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      marginTop: SPACING.sm,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: SPACING.xs,
      fontWeight: "500",
    },
    sectionHeader: {
      paddingHorizontal: SPACING.base + SPACING.xs,
      marginTop: SPACING.xl,
      marginBottom: SPACING.md,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.outline || colors.textTertiary,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    loadingContainer: { alignItems: "center", paddingVertical: SPACING.xxxl },
    loadingText: {
      color: colors.textMuted,
      marginTop: SPACING.md,
      fontSize: 15,
      letterSpacing: -0.24,
    },
    usersContainer: {
      paddingHorizontal: SPACING.base,
      gap: SPACING.md,
    },
    userCard: {
      backgroundColor: colors.surfaceContainerLowest || colors.card,
      borderRadius: RADIUS.card,
      padding: SPACING.base,
      ...shadows.sm,
    },
    userCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    userAvatarSmall: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryBg,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.md,
    },
    userAvatarText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
    },
    userCardInfo: { flex: 1 },
    userCardName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      letterSpacing: -0.24,
    },
    youBadge: {
      backgroundColor: colors.primaryBg,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: RADIUS.sm,
    },
    youBadgeText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: "700",
    },
    userCurrentRole: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
      letterSpacing: -0.08,
    },
    roleButtonsRow: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    roleBtn: {
      flex: 1,
      backgroundColor: colors.quaternaryFill,
      borderRadius: RADIUS.sm + 2,
      paddingVertical: SPACING.md,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.xs,
    },
    roleBtnActive: {
      backgroundColor: colors.primary,
    },
    roleBtnDisabled: { opacity: 0.5 },
    roleBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textMuted,
    },
    roleBtnTextActive: { color: "#fff" },
    teknisyenInfo: {
      marginTop: SPACING.base,
      paddingTop: SPACING.base,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceContainer || colors.borderLight,
    },
    teknisyenInfoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    teknisyenLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textTertiary,
      marginBottom: SPACING.sm,
      letterSpacing: -0.08,
    },
    statusPill: {
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
    },
    statusPillText: { fontSize: 12, fontWeight: "600" },
    uzmanlikChipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
    },
    uzmanlikChipSmall: {
      backgroundColor: colors.primaryBg,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
    },
    uzmanlikChipSmallText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "600",
    },
    uzmanlikBosText: {
      fontSize: 13,
      color: colors.textMuted,
      letterSpacing: -0.08,
    },
    editTeknisyenBtn: {
      marginTop: SPACING.md,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      backgroundColor: colors.primaryBg,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.sm,
    },
    editTeknisyenText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "600",
    },
    emptyContainer: { alignItems: "center", paddingVertical: SPACING.xxxl },
    emptyText: {
      color: colors.textMuted,
      marginTop: SPACING.md,
      fontSize: 15,
      letterSpacing: -0.24,
    },
    restrictedContainer: {
      alignItems: "center",
      paddingVertical: 60,
      marginHorizontal: SPACING.base,
    },
    restrictedIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.quaternaryFill,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: SPACING.base,
    },
    restrictedTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.38,
    },
    restrictedText: {
      fontSize: 15,
      color: colors.textMuted,
      marginTop: SPACING.sm,
      textAlign: "center",
      letterSpacing: -0.24,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: colors.surfaceContainerLowest || colors.secondaryBackground,
      borderTopLeftRadius: RADIUS.modal + 4,
      borderTopRightRadius: RADIUS.modal + 4,
      padding: SPACING.xl,
      paddingTop: SPACING.md,
    },
    modalHandle: {
      width: 36,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: SPACING.lg,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.onSurface || colors.text,
      letterSpacing: -0.3,
    },
    modalSubtitle: {
      fontSize: 15,
      color: colors.textMuted,
      marginTop: SPACING.xs,
      marginBottom: SPACING.lg,
      letterSpacing: -0.24,
    },
    modalSectionLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.outline || colors.textTertiary,
      marginBottom: SPACING.md,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    modalChip: {
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: colors.surfaceContainerHigh || colors.card,
    },
    modalChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modalChipText: {
      fontSize: 13,
      color: colors.textTertiary,
      fontWeight: "600",
      letterSpacing: -0.08,
    },
    modalChipTextActive: { color: "#fff" },
    modalPrimaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: RADIUS.button,
      alignItems: "center",
      paddingVertical: SPACING.base,
      marginTop: SPACING.xs,
      height: 50,
      justifyContent: "center",
    },
    modalPrimaryBtnText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "600",
      letterSpacing: -0.41,
    },
    modalCancelBtn: {
      alignItems: "center",
      paddingVertical: SPACING.base,
    },
    modalCancelBtnText: {
      fontSize: 17,
      color: colors.danger,
      fontWeight: "400",
      letterSpacing: -0.41,
    },
  });
