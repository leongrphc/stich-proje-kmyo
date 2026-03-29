import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { RADIUS, SPACING } from "../lib/theme";
import GradientCard from "./GradientCard";

const AKSIYON_TIPLERI = [
  { key: "maliyet_onayi", label: "Maliyet Onayı", icon: "cash-outline", desc: "Tahmini maliyet belirlendi, onay gerekli" },
  { key: "parca_onayi", label: "Parça Onayı", icon: "build-outline", desc: "Farklı/pahalı parça kullanılacak" },
  { key: "yetki_gerekli", label: "Yetki Gerekli", icon: "shield-outline", desc: "Garanti, özel erişim, fiziksel müdahale" },
  { key: "bilgi_gerekli", label: "Bilgi Gerekli", icon: "information-circle-outline", desc: "Kullanıcıdan şifre, erişim izni vs." },
];

export { AKSIYON_TIPLERI };

export default function AksiyonKarti({ talep }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  if (talep.durum !== "Aksiyon Bekleniyor" || !talep.aksiyon_tipi) return null;

  return (
    <GradientCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.warningIcon}>
          <Ionicons name="alert-circle" size={20} color={colors.pink} />
        </View>
        <Text style={styles.cardTitle}>Aksiyon Bekleniyor</Text>
      </View>
      <View style={styles.aksiyonRow}>
        <Text style={styles.aksiyonLabel}>Tip</Text>
        <Text style={styles.aksiyonValue}>
          {AKSIYON_TIPLERI.find((t) => t.key === talep.aksiyon_tipi)?.label || talep.aksiyon_tipi}
        </Text>
      </View>
      {talep.tahmini_maliyet && (
        <View style={styles.aksiyonRow}>
          <Text style={styles.aksiyonLabel}>Tahmini Maliyet</Text>
          <Text style={[styles.aksiyonValue, { color: colors.danger, fontWeight: "700" }]}>{talep.tahmini_maliyet} TL</Text>
        </View>
      )}
      <View style={{ marginTop: SPACING.sm }}>
        <Text style={styles.aksiyonLabel}>Açıklama</Text>
        <Text style={[styles.aksiyonValue, { marginTop: SPACING.xs }]}>{talep.aksiyon_aciklama}</Text>
      </View>
    </GradientCard>
  );
}

export function Btn({ color, icon, text, onPress }) {
  return (
    <TouchableOpacity style={[buttonStyles.actionBtn, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={buttonStyles.actionBtnText}>{text}</Text>
    </TouchableOpacity>
  );
}

const buttonStyles = StyleSheet.create({
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.button,
    padding: SPACING.md + 2,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.24,
  },
});

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      marginBottom: SPACING.base,
      backgroundColor: colors.errorContainer || `${colors.pink}14`,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
      gap: SPACING.sm,
    },
    warningIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${colors.pink}14`,
      justifyContent: "center",
      alignItems: "center",
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.onErrorContainer || colors.pink,
    },
    aksiyonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    aksiyonLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.outline || colors.textMuted,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    aksiyonValue: {
      fontSize: 14,
      color: colors.onSurface || colors.text,
      fontWeight: "600",
    },
  });
