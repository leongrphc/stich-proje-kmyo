import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { RADIUS, SPACING } from "../lib/theme";

const { width: EKRAN_GENISLIK } = Dimensions.get("window");

const slaytlar = [
  {
    id: "1",
    icon: "construct",
    baslik: "Hos Geldiniz",
    aciklama:
      "KMYO Teknik Servis Takip Sistemi ile ariza ve bakim taleplerinizi kolayca yonetin.",
    renk: "#00236f",
  },
  {
    id: "2",
    icon: "add-circle",
    baslik: "Talep Olusturun",
    aciklama:
      "Ariza veya bakim talebi olusturun, fotograf ekleyin ve durumunu aninda takip edin.",
    renk: "#1e3a8a",
  },
  {
    id: "3",
    icon: "time",
    baslik: "Takip Edin",
    aciklama:
      "Talebinizin durumunu adim adim takip edin. Atama, islem ve tamamlanma sureclerini gorun.",
    renk: "#AF52DE",
  },
  {
    id: "4",
    icon: "notifications",
    baslik: "Bildirimler",
    aciklama:
      "Talebinizle ilgili guncellemelerden aninda haberdar olun. Hicbir gelismeyi kacirmayin.",
    renk: "#34C759",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [aktifIndex, setAktifIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleAtla = useCallback(async () => {
    await AsyncStorage.setItem("onboarding_done", "true");
    router.replace("/login");
  }, [router]);

  const handleIleri = useCallback(() => {
    if (aktifIndex < slaytlar.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: aktifIndex + 1,
        animated: true,
      });
    } else {
      handleAtla();
    }
  }, [aktifIndex, handleAtla]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setAktifIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlayt = ({ item }) => (
    <View style={styles.slayt}>
      <View style={[styles.iconContainer, { backgroundColor: `${item.renk}14` }]}>
        <Ionicons name={item.icon} size={64} color={item.renk} />
      </View>
      <Text style={styles.baslik}>{item.baslik}</Text>
      <Text style={styles.aciklama}>{item.aciklama}</Text>
    </View>
  );

  const sonSlayt = aktifIndex === slaytlar.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.ustKisim}>
        {!sonSlayt ? (
          <TouchableOpacity
            style={styles.atlaBtn}
            onPress={handleAtla}
            activeOpacity={0.7}
          >
            <Text style={styles.atlaBtnText}>Atla</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.atlaBtn} />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slaytlar}
        renderItem={renderSlayt}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: EKRAN_GENISLIK,
          offset: EKRAN_GENISLIK * index,
          index,
        })}
      />

      <View style={styles.altKisim}>
        {/* Dot Indicator */}
        <View style={styles.dotRow}>
          {slaytlar.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                aktifIndex === i && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Buton */}
        <TouchableOpacity
          onPress={handleIleri}
          activeOpacity={0.85}
          style={styles.ileriBtn}
        >
          <LinearGradient
            colors={isDark ? ["#264191", "#1e3a8a"] : ["#00236f", "#1e3a8a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ileriBtnGradient}
          >
            {sonSlayt ? (
              <>
                <Text style={styles.ileriBtnText}>Basla</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            ) : (
              <>
                <Text style={styles.ileriBtnText}>Devam</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    ustKisim: {
      paddingTop: Platform.OS === "ios" ? 56 : 40,
      paddingHorizontal: SPACING.lg,
      alignItems: "flex-end",
    },
    atlaBtn: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.base,
      minHeight: 36,
    },
    atlaBtnText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.outline,
    },
    slayt: {
      width: EKRAN_GENISLIK,
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: SPACING.xxl,
    },
    iconContainer: {
      width: 140,
      height: 140,
      borderRadius: 70,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: SPACING.xxl,
    },
    baslik: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.onSurface,
      textAlign: "center",
      letterSpacing: -0.5,
      marginBottom: SPACING.md,
    },
    aciklama: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      textAlign: "center",
      lineHeight: 24,
      fontWeight: "500",
      paddingHorizontal: SPACING.lg,
    },
    altKisim: {
      paddingBottom: Platform.OS === "ios" ? 50 : 32,
      paddingHorizontal: SPACING.xl,
      alignItems: "center",
      gap: SPACING.xl,
    },
    dotRow: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.outlineVariant,
    },
    dotActive: {
      width: 24,
      backgroundColor: colors.primary,
    },
    ileriBtn: {
      width: "100%",
      borderRadius: RADIUS.button,
      overflow: "hidden",
    },
    ileriBtnGradient: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: SPACING.lg,
      gap: SPACING.sm,
    },
    ileriBtnText: {
      fontSize: 17,
      fontWeight: "700",
      color: "#fff",
    },
  });
