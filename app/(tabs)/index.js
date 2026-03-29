import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import { durumRengi } from "../../lib/helpers";
import { supabase } from "../../lib/supabase";
import { RADIUS, SPACING } from "../../lib/theme";

export default function HomeScreen() {
  const { user, profile, fullName, role, isYonetici, isTeknisyen, isKullanici } = useAuth();
  const { colors, shadows, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(colors, shadows, isDark), [colors, shadows, isDark]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ozet, setOzet] = useState({});
  const [sonTalepler, setSonTalepler] = useState([]);

  const fetchVeriler = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("talepler")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const t = data || [];

      if (isYonetici) {
        setOzet({
          toplam: t.length,
          bekleyen: t.filter((x) => x.durum === "Beklemede").length,
          aksiyonBekliyor: t.filter((x) => x.durum === "Aksiyon Bekleniyor").length,
          onayBekliyor: t.filter((x) => x.durum === "Onay Bekliyor").length,
          devamEden: t.filter((x) => x.durum === "Devam Ediyor" || x.durum === "Atandi").length,
          tamamlanan: t.filter((x) => x.durum === "Tamamlandi").length,
        });
      } else if (isTeknisyen) {
        setOzet({
          toplam: t.length,
          atanan: t.filter((x) => x.durum === "Atandi").length,
          devamEden: t.filter((x) => x.durum === "Devam Ediyor").length,
          aksiyonBekliyor: t.filter((x) => x.durum === "Aksiyon Bekleniyor").length,
          tamamlanan: t.filter((x) => x.durum === "Tamamlandi").length,
        });
      } else {
        setOzet({
          toplam: t.length,
          bekleyen: t.filter((x) => x.durum === "Beklemede").length,
          devamEden: t.filter((x) => x.durum === "Devam Ediyor" || x.durum === "Atandi").length,
          tamamlanan: t.filter((x) => x.durum === "Tamamlandi").length,
        });
      }

      setSonTalepler(t.slice(0, 5));
    } catch (error) {
      console.error("Veriler yuklenemedi:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isTeknisyen, isYonetici]);

  useFocusEffect(
    useCallback(() => {
      fetchVeriler();
    }, [fetchVeriler]),
  );

  const handleSonIslemeGit = async () => {
    try {
      let query = supabase
        .from("talepler")
        .select("id, baslik")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (isKullanici) {
        query = query.eq("kullanici_id", user.id);
      } else if (isTeknisyen) {
        query = query.eq("teknisyen_id", user.id);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;

      if (data) {
        router.push({ pathname: "/talep-detay", params: { id: data.id } });
      } else {
        Alert.alert("Bilgi", "Henüz bir işlem kaydınız bulunmuyor.");
      }
    } catch (err) {
      console.error("Son işlem sorgusu:", err.message);
      Alert.alert("Hata", "Son işlem bulunamadı.");
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVeriler();
  }, [fetchVeriler]);

  const aktifSayisi = ozet.toplam || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: SPACING.xxxl }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>KMYO - TEKNİK SERVİS</Text>
        <TouchableOpacity
          style={styles.topBarIconBtn}
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/bildirimler")}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Hoşgeldin */}
      
      <View style={styles.welcomeSection}>
        <View style={styles.avatarCircle}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Ionicons name="person" size={28} color={colors.outline} />
          )}
        </View>
        
        <View style={styles.welcomeTextWrap}>
          <View style={styles.welcomeTitleRow}>
            
            <Text style={styles.welcomeTitle}>Hoş Geldiniz, {fullName?.split(" ")[0] || "Kullanıcı"}</Text>
       
          </View>
          <Text style={styles.welcomeSub}>Bugün {aktifSayisi} aktif tamir talebiniz var.</Text>
          
        </View>
             <View style={[
              styles.roleBadge,
              isYonetici && styles.roleBadgeYonetici,
              isTeknisyen && styles.roleBadgeTeknisyen,
              isKullanici && styles.roleBadgeKullanici,
            ]}>
              <Ionicons
                name={isYonetici ? "shield-checkmark" : isTeknisyen ? "construct" : "person-circle"}
                size={11}
                color={isYonetici ? colors.primary : isTeknisyen ? colors.purple : colors.success}
              />
              <Text style={[
                styles.roleBadgeText,
                isYonetici && styles.roleBadgeTextYonetici,
                isTeknisyen && styles.roleBadgeTextTeknisyen,
                isKullanici && styles.roleBadgeTextKullanici,
              ]}>
                {role === "yonetici" ? "Yönetici" : role === "teknisyen" ? "Teknisyen" : "Kullanıcı"}
              </Text>
            </View>
      </View>

      {/* İstatistik Kartları */}
      <View style={styles.statsSection}>
        {/* Aktif İşler - büyük kart */}
        <View style={styles.mainStatCard}>
          <View style={styles.mainStatAccent} />
          <View style={styles.mainStatContent}>
            <View style={styles.mainStatHeader}>
              <Text style={styles.mainStatLabel}>AKTİF İŞLER</Text>
              <Ionicons name="calendar-outline" size={22} color={colors.outline} />
            </View>
            <Text style={styles.mainStatNumber}>{aktifSayisi}</Text>
            {ozet.toplam > 0 && (
              <View style={styles.trendRow}>
                <Ionicons name="trending-up" size={16} color={colors.primary} />
                <Text style={styles.trendText}>%15 artış</Text>
              </View>
            )}
          </View>
        </View>

        {/* Alt kartlar */}
        <View style={styles.subStatsRow}>
          <View style={styles.subStatCard}>
            <View style={styles.subStatHeader}>
              <Text style={styles.subStatLabel}>BEKLEYENLER</Text>
              <Ionicons name="hourglass-outline" size={18} color={colors.beklemede} />
            </View>
            <Text style={styles.subStatNumber}>
              {String(ozet.bekleyen || ozet.atanan || 0).padStart(2, "0")}
            </Text>
          </View>
          <View style={styles.subStatCard}>
            <View style={styles.subStatHeader}>
              <Text style={styles.subStatLabel}>BİTENLER</Text>
              <Ionicons name="checkmark-circle" size={18} color={colors.tamamlandi} />
            </View>
            <Text style={styles.subStatNumber}>{ozet.tamamlanan || 0}</Text>
          </View>
        </View>
      </View>

      {/* Hızlı İşlemler */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>

        <TouchableOpacity
          style={styles.quickActionPrimary}
          activeOpacity={0.8}
          onPress={() => router.push("/(tabs)/yeni-talep")}
        >
          <LinearGradient
            colors={isDark ? ["#264191", "#1e3a8a"] : ["#00236f", "#1e3a8a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickActionGradient}
          >
            <View style={styles.quickActionIconWrap}>
              <Ionicons name="add" size={20} color="#fff" />
            </View>
            <Text style={styles.quickActionPrimaryText}>Yeni Kayıt Oluştur</Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionSecondary} activeOpacity={0.7} onPress={handleSonIslemeGit}>
          <View style={styles.quickActionSecIcon}>
            <Ionicons name="time-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.quickActionSecText}>Son İşleme Git</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.outlineVariant} />
        </TouchableOpacity>
      </View>

      {/* Son Aktivite */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Son Aktivite</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/talepler")} activeOpacity={0.7}>
            <View style={styles.seeAllPill}>
              <Text style={styles.seeAllText}>TÜMÜ</Text>
            </View>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : sonTalepler.length > 0 ? (
          <View style={styles.activityList}>
            {sonTalepler.map((talep) => {
              const renk = durumRengi(talep.durum);
              const saat = talep.created_at
                ? new Date(talep.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
                : "";
              return (
                <TouchableOpacity
                  key={talep.id}
                  style={styles.activityItem}
                  onPress={() => router.push({ pathname: "/talep-detay", params: { id: talep.id } })}
                  activeOpacity={0.6}
                >
                  <View style={[styles.activityAccent, { backgroundColor: renk }]} />
                  <View style={styles.activityContent}>
                    <View style={styles.activityTop}>
                      <Text style={styles.activityTitle} numberOfLines={1}>{talep.baslik}</Text>
                      <Text style={styles.activityTime}>{saat}</Text>
                    </View>
                    <Text style={styles.activitySub} numberOfLines={1}>
                      ID: #{talep.id?.substring(0, 8).toUpperCase()} • {talep.kategori || talep.konum || ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.outlineVariant} />
            <Text style={styles.emptyText}>Henüz talep bulunmuyor</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const getStyles = (colors, shadows, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: Platform.OS === "ios" ? 56 : 40,
      paddingBottom: SPACING.md,
      paddingHorizontal: SPACING.lg,
      backgroundColor: isDark ? colors.surfaceContainerLow : "rgba(255,255,255,0.8)",
    },
    topBarIconBtn: {
      padding: SPACING.sm,
    },
    topBarTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.primary,
      letterSpacing: -0.5,
    },
    welcomeSection: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.xl,
      gap: SPACING.md,
    },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.surfaceContainerHigh,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    avatarImage: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
    welcomeTextWrap: {
      flex: 1,
    },
    welcomeTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: SPACING.sm,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.onSurface,
      letterSpacing: -0.3,
    },
    roleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: 3,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.surfaceContainerHigh,
    },
    roleBadgeYonetici: {
      backgroundColor: isDark ? "rgba(144, 168, 255, 0.15)" : "rgba(0, 35, 111, 0.08)",
    },
    roleBadgeTeknisyen: {
      backgroundColor: isDark ? "rgba(196, 134, 255, 0.15)" : "rgba(175, 82, 222, 0.08)",
    },
    roleBadgeKullanici: {
      backgroundColor: isDark ? "rgba(79, 214, 122, 0.15)" : "rgba(52, 199, 89, 0.08)",
    },
    roleBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    roleBadgeTextYonetici: {
      color: colors.primary,
    },
    roleBadgeTextTeknisyen: {
      color: colors.purple,
    },
    roleBadgeTextKullanici: {
      color: colors.success,
    },
    welcomeSub: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 2,
      fontWeight: "500",
    },

    statsSection: {
      paddingHorizontal: SPACING.lg,
      gap: SPACING.md,
    },
    mainStatCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: RADIUS.card,
      overflow: "hidden",
      flexDirection: "row",
      ...shadows.sm,
    },
    mainStatAccent: {
      width: 4,
      backgroundColor: colors.primary,
    },
    mainStatContent: {
      flex: 1,
      padding: SPACING.lg,
    },
    mainStatHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    mainStatLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.outline,
      letterSpacing: 1,
    },
    mainStatNumber: {
      fontSize: 48,
      fontWeight: "800",
      color: colors.onSurface,
      marginTop: SPACING.xs,
      letterSpacing: -1,
    },
    trendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      marginTop: SPACING.xs,
    },
    trendText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
    subStatsRow: {
      flexDirection: "row",
      gap: SPACING.md,
    },
    subStatCard: {
      flex: 1,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: RADIUS.card,
      padding: SPACING.lg,
      ...shadows.sm,
    },
    subStatHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    subStatLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.outline,
      letterSpacing: 0.8,
    },
    subStatNumber: {
      fontSize: 36,
      fontWeight: "800",
      color: colors.onSurface,
      marginTop: SPACING.sm,
      letterSpacing: -1,
    },

    sectionContainer: {
      paddingHorizontal: SPACING.lg,
      marginTop: SPACING.xl,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.primary,
      letterSpacing: -0.2,
      marginBottom: SPACING.md,
    },
    seeAllPill: {
      backgroundColor: colors.surfaceContainerHigh,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADIUS.sm,
      marginBottom: SPACING.md,
    },
    seeAllText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.onSurfaceVariant,
      letterSpacing: 0.8,
    },

    quickActionPrimary: {
      borderRadius: RADIUS.card,
      overflow: "hidden",
      marginBottom: SPACING.md,
      ...shadows.md,
    },
    quickActionGradient: {
      flexDirection: "row",
      alignItems: "center",
      padding: SPACING.lg,
      gap: SPACING.md,
    },
    quickActionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.lg,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    quickActionPrimaryText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
      color: "#ffffff",
      letterSpacing: -0.2,
    },
    quickActionSecondary: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: RADIUS.card,
      padding: SPACING.lg,
      gap: SPACING.md,
      ...shadows.sm,
    },
    quickActionSecIcon: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.lg,
      backgroundColor: isDark ? colors.primaryBg : "rgba(0,35,111,0.06)",
      justifyContent: "center",
      alignItems: "center",
    },
    quickActionSecText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: colors.onSurface,
      letterSpacing: -0.2,
    },

    activityList: {
      gap: SPACING.sm,
    },
    activityItem: {
      flexDirection: "row",
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: RADIUS.card,
      overflow: "hidden",
      ...shadows.sm,
    },
    activityAccent: {
      width: 4,
    },
    activityContent: {
      flex: 1,
      padding: SPACING.base,
    },
    activityTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    activityTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.onSurface,
      flex: 1,
      marginRight: SPACING.sm,
    },
    activityTime: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.outline,
    },
    activitySub: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 3,
      fontWeight: "500",
    },

    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.xxxl,
    },
    emptyText: {
      fontSize: 14,
      color: colors.outline,
      marginTop: SPACING.md,
    },
  });
