import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import { durumRengi, tarihFormat } from "../../lib/helpers";
import { supabase } from "../../lib/supabase";
import { RADIUS, SPACING } from "../../lib/theme";

export default function TaleplerScreen() {
  const router = useRouter();
  const { isYonetici, isTeknisyen } = useAuth();
  const { colors, shadows, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(colors, shadows, isDark), [colors, shadows, isDark]);
  const [seciliFiltre, setSeciliFiltre] = useState("Tumu");
  const [talepler, setTalepler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aramaMetni, setAramaMetni] = useState("");

  const fetchTalepler = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("talepler")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTalepler(data || []);
    } catch (error) {
      console.error("Talepler yuklenemedi:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTalepler();
    }, [fetchTalepler]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTalepler();
  }, [fetchTalepler]);

  const filtreler = isYonetici
    ? ["Tumu", "Beklemede", "Atandi", "Devam Ediyor", "Aksiyon Bekleniyor", "Onay Bekliyor", "Tamamlandi", "Kapatildi"]
    : isTeknisyen
      ? ["Tumu", "Atandi", "Devam Ediyor", "Aksiyon Bekleniyor", "Onay Bekliyor", "Tamamlandi"]
      : ["Tumu", "Beklemede", "Devam Ediyor", "Tamamlandi"];

  const filtrelenmis = (seciliFiltre === "Tumu" ? talepler : talepler.filter((t) => t.durum === seciliFiltre))
    .filter((t) => {
      if (!aramaMetni.trim()) return true;
      const q = aramaMetni.toLowerCase();
      return (
        (t.baslik || "").toLowerCase().includes(q) ||
        (t.id || "").toLowerCase().includes(q) ||
        (t.kategori || "").toLowerCase().includes(q)
      );
    });

  const durumBadgeLabel = (durum) => {
    const map = {
      "Beklemede": "BEKLEYEN",
      "Devam Ediyor": "İŞLEMDE",
      "Tamamlandi": "TAMAMLANDI",
      "Atandi": "ATANDI",
      "Aksiyon Bekleniyor": "AKSİYON",
      "Onay Bekliyor": "ONAY",
      "Kapatildi": "KAPALI",
    };
    return map[durum] || durum?.toUpperCase() || "";
  };

  const renderTalep = ({ item }) => {
    const renk = durumRengi(item.durum);
    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/talep-detay", params: { id: item.id } })}
        activeOpacity={0.6}
      >
        <View style={styles.talepCard}>
          <View style={[styles.talepAccent, { backgroundColor: renk }]} />
          <View style={styles.talepContent}>
            <View style={styles.talepTopRow}>
              <Text style={styles.talepId}>#{item.id?.substring(0, 8).toUpperCase() || "TS-0000"}</Text>
              <View style={[styles.durumBadge, { backgroundColor: `${renk}18` }]}>
                <Text style={[styles.durumBadgeText, { color: renk }]}>{durumBadgeLabel(item.durum)}</Text>
              </View>
            </View>
            <Text style={styles.talepBaslik} numberOfLines={1}>{item.baslik}</Text>
            <View style={styles.talepMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={14} color={colors.outline} />
                <Text style={styles.metaText}>{item.kullanici_ad || item.kullanici_email || "-"}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.outline} />
                <Text style={styles.metaText}>{tarihFormat(item.created_at)}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Arama */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Talep ID veya cihaz ara..."
            placeholderTextColor={colors.outlineVariant}
            value={aramaMetni}
            onChangeText={setAramaMetni}
          />
        </View>
      </View>

      {/* Filtreler */}
      <View style={styles.filtreContainer}>
        <FlatList
          data={filtreler}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: SPACING.base }}
          renderItem={({ item: filtre }) => (
            <TouchableOpacity
              style={[styles.filtreChip, seciliFiltre === filtre && styles.filtreChipActive]}
              onPress={() => setSeciliFiltre(filtre)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filtreText, seciliFiltre === filtre && styles.filtreTextActive]}>
                {filtre === "Tumu" ? "Tümü" : filtre === "Devam Ediyor" ? "İşlemde" : filtre === "Tamamlandi" ? "Tamamlandı" : filtre}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtrelenmis}
          renderItem={renderTalep}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.outlineVariant} />
              <Text style={styles.emptyText}>Talep bulunamadı</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push("/(tabs)/yeni-talep")}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.fabText}>YENİ TALEP</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors, shadows, isDark) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    searchContainer: {
      paddingHorizontal: SPACING.base,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceContainerHigh,
      borderRadius: RADIUS.card,
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.md,
      gap: SPACING.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.onSurface,
    },
    filtreContainer: {
      paddingVertical: SPACING.sm,
    },
    filtreChip: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.card,
      marginHorizontal: SPACING.xs,
      backgroundColor: colors.surfaceContainerHigh,
    },
    filtreChipActive: {
      backgroundColor: colors.primary,
    },
    filtreText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.onSurfaceVariant,
    },
    filtreTextActive: { color: "#fff" },
    listContainer: {
      padding: SPACING.base,
      paddingBottom: 100,
    },
    talepCard: {
      flexDirection: "row",
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: RADIUS.card,
      overflow: "hidden",
      marginBottom: SPACING.md,
      ...shadows.sm,
    },
    talepAccent: {
      width: 4,
    },
    talepContent: {
      flex: 1,
      padding: SPACING.lg,
    },
    talepTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.xs,
    },
    talepId: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.outline,
      letterSpacing: 0.8,
    },
    durumBadge: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.sm,
    },
    durumBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.8,
    },
    talepBaslik: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.onSurface,
      letterSpacing: -0.3,
      marginBottom: SPACING.md,
    },
    talepMeta: {
      gap: SPACING.xs,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    metaText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      fontWeight: "500",
    },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 20,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      paddingVertical: SPACING.md + 2,
      paddingHorizontal: SPACING.xl,
      borderRadius: RADIUS.button,
      gap: SPACING.sm,
      ...shadows.lg,
    },
    fabText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: 0.8,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
    },
    emptyText: {
      fontSize: 14,
      color: colors.outline,
      marginTop: SPACING.md,
    },
  });
