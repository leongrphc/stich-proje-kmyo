import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GradientCard from "../../components/GradientCard";
import { BildirimListeSkeleton } from "../../components/SkeletonLoader";
import { useAppTheme } from "../../context/ThemeContext";
import { okunduIsaretle, tumunuOkunduYap } from "../../lib/bildirimler";
import { cacheVeriGetir, cacheVeriKaydet } from "../../lib/offlineCache";
import { supabase } from "../../lib/supabase";
import { SPACING } from "../../lib/theme";

export default function BildirimlerScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [bildirimler, setBildirimler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const turConfig = {
    yeni_talep: { icon: "add-circle", color: colors.primary },
    atama: { icon: "person-add", color: colors.purple },
    yorum: { icon: "chatbubble", color: colors.info },
    durum_degisikligi: { icon: "swap-horizontal", color: colors.orange },
    aksiyon: { icon: "alert-circle", color: colors.pink },
    onay: { icon: "checkmark-circle", color: colors.success },
    red: { icon: "close-circle", color: colors.danger },
    bilgi: { icon: "information-circle", color: colors.textMuted },
  };

  const fetchBildirimler = useCallback(async () => {
    // Önce cache'den oku
    try {
      const cachedData = await cacheVeriGetir("bildirimler");
      if (cachedData && cachedData.length > 0) {
        setBildirimler(cachedData);
        setLoading(false);
      }
    } catch (_) {}

    // Sonra Supabase'den güncelle
    try {
      const { data, error } = await supabase
        .from("bildirimler")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setBildirimler(data || []);
      await cacheVeriKaydet("bildirimler", data || []);
    } catch (error) {
      console.error("Bildirimler yuklenemedi:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBildirimler();
    }, [fetchBildirimler]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBildirimler();
  }, [fetchBildirimler]);

  const handleBildirimTikla = async (bildirim) => {
    if (!bildirim.okundu) {
      await okunduIsaretle(bildirim.id);
      setBildirimler((prev) =>
        prev.map((b) => (b.id === bildirim.id ? { ...b, okundu: true } : b)),
      );
    }
    if (bildirim.talep_id) {
      router.push({
        pathname: "/talep-detay",
        params: { id: bildirim.talep_id },
      });
    }
  };

  const handleTumunuOkundu = async () => {
    await tumunuOkunduYap();
    setBildirimler((prev) => prev.map((b) => ({ ...b, okundu: true })));
  };

  const okunmamisVar = bildirimler.some((b) => !b.okundu);

  const zamanFormat = (tarih) => {
    if (!tarih) return "";
    const simdi = new Date();
    const t = new Date(tarih);
    const farkMs = simdi - t;
    const farkDk = Math.floor(farkMs / 60000);
    const farkSaat = Math.floor(farkMs / 3600000);
    const farkGun = Math.floor(farkMs / 86400000);

    if (farkDk < 1) return "Az önce";
    if (farkDk < 60) return `${farkDk} dk önce`;
    if (farkSaat < 24) return `${farkSaat} saat önce`;
    if (farkGun < 7) return `${farkGun} gün önce`;
    return t.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderBildirim = ({ item }) => {
    const config = turConfig[item.tur] || turConfig.bilgi;
    return (
      <TouchableOpacity
        onPress={() => handleBildirimTikla(item)}
        activeOpacity={0.6}
      >
        <GradientCard
          style={[styles.bildirimRow, !item.okundu && styles.okunmamisCard]}
          variant={item.okundu ? "default" : "cool"}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${config.color}14` },
            ]}
          >
            <Ionicons name={config.icon} size={22} color={config.color} />
          </View>
          <View style={styles.bildirimContent}>
            <View style={styles.bildirimHeaderRow}>
              <Text
                style={[
                  styles.bildirimBaslik,
                  !item.okundu && styles.okunmamisBaslik,
                ]}
                numberOfLines={1}
              >
                {item.baslik}
              </Text>
              <Text style={styles.zamanText}>
                {zamanFormat(item.created_at)}
              </Text>
            </View>
            <Text style={styles.bildirimMesaj} numberOfLines={2}>
              {item.mesaj}
            </Text>
            {item.gonderen_ad ? (
              <Text style={styles.gonderenText}>{item.gonderen_ad}</Text>
            ) : null}
          </View>
          {!item.okundu ? <View style={styles.okunmamisDot} /> : null}
        </GradientCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {okunmamisVar && (
        <TouchableOpacity
          style={styles.tumunuOkunduBtn}
          onPress={handleTumunuOkundu}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-done" size={18} color={colors.primary} />
          <Text style={styles.tumunuOkunduText}>Tümünü okundu yap</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <BildirimListeSkeleton />
      ) : (
        <FlatList
          data={bildirimler}
          renderItem={renderBildirim}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color={colors.textPlaceholder}
              />
              <Text style={styles.emptyText}>Henüz bildirim yok</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface || colors.background,
    },
    tumunuOkunduBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.md,
      backgroundColor:
        colors.surfaceContainerLowest || colors.secondaryBackground,
      gap: SPACING.sm,
    },
    tumunuOkunduText: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: "400",
      letterSpacing: -0.24,
    },
    listContainer: { padding: SPACING.base },
    bildirimRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    okunmamisCard: {},
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.md,
    },
    bildirimContent: { flex: 1 },
    bildirimHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 2,
    },
    bildirimBaslik: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.onSurface || colors.text,
      flex: 1,
      marginRight: SPACING.sm,
      letterSpacing: -0.24,
    },
    okunmamisBaslik: { fontWeight: "600" },
    bildirimMesaj: {
      fontSize: 13,
      color: colors.textTertiary,
      lineHeight: 18,
      letterSpacing: -0.08,
    },
    gonderenText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "500",
      marginTop: SPACING.xs,
    },
    zamanText: {
      fontSize: 12,
      color: colors.textMuted,
      letterSpacing: 0.07,
    },
    okunmamisDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
      marginLeft: SPACING.sm,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textPlaceholder,
      marginTop: SPACING.md,
      letterSpacing: -0.24,
    },
  });
