import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { RADIUS, SPACING } from "../lib/theme";

const TUR_CONFIG = {
  yorum: { icon: "chatbubble-outline", label: "Yorum" },
  durum_degisikligi: { icon: "swap-horizontal", label: "Durum Değişikliği" },
  atama: { icon: "person-add", label: "Teknisyen Atama" },
  onay: { icon: "checkmark-circle", label: "Onay" },
  red: { icon: "close-circle", label: "Red" },
  aksiyon: { icon: "alert-circle", label: "Aksiyon" },
};

function turRengi(tur, colors) {
  switch (tur) {
    case "durum_degisikligi": return colors.orange || "#FF9500";
    case "atama": return colors.purple || "#AF52DE";
    case "onay": return colors.success || "#34C759";
    case "red": return colors.danger || "#ba1a1a";
    case "aksiyon": return colors.pink || "#FF2D55";
    default: return colors.primary;
  }
}

function zamanFarki(tarih) {
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
  return t.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function TimelineListesi({ yorumlar }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  if (!yorumlar || yorumlar.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>İŞ AKIŞI ({yorumlar.length})</Text>

      {yorumlar.map((y, index) => {
        const isLast = index === yorumlar.length - 1;
        const config = TUR_CONFIG[y.tur] || TUR_CONFIG.yorum;
        const renk = turRengi(y.tur, colors);
        const isSistem = y.tur !== "yorum";

        return (
          <View key={y.id} style={styles.timelineRow}>
            {/* Sol: çizgi + ikon */}
            <View style={styles.lineColumn}>
              <View style={[styles.iconCircle, { backgroundColor: `${renk}18`, borderColor: `${renk}40` }]}>
                <Ionicons name={config.icon} size={14} color={renk} />
              </View>
              {!isLast && <View style={[styles.verticalLine, { backgroundColor: `${renk}20` }]} />}
            </View>

            {/* Sağ: içerik */}
            <View style={[styles.contentBox, isSistem && { backgroundColor: `${renk}08` }]}>
              <View style={styles.headerRow}>
                <View style={[styles.turBadge, { backgroundColor: `${renk}14` }]}>
                  <Text style={[styles.turText, { color: renk }]}>{config.label}</Text>
                </View>
                <Text style={styles.zamanText}>{zamanFarki(y.created_at)}</Text>
              </View>

              <Text style={styles.yazanText}>
                {y.yazan_ad || "Kullanıcı"}
                {y.yazan_rol && <Text style={styles.rolSuffix}> · {y.yazan_rol}</Text>}
              </Text>

              <Text style={styles.yorumMetin} numberOfLines={isSistem ? 2 : 4}>
                {y.mesaj_tipi === "voice" ? "🎙️ Sesli mesaj" : y.yorum}
              </Text>

              {y.updated_at && new Date(y.updated_at).getTime() - new Date(y.created_at).getTime() > 1000 && (
                <Text style={styles.duzenlendiText}>düzenlendi</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      marginBottom: SPACING.base,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.outline || colors.textMuted,
      marginBottom: SPACING.md,
      letterSpacing: 1,
    },
    timelineRow: {
      flexDirection: "row",
      minHeight: 64,
    },
    lineColumn: {
      width: 36,
      alignItems: "center",
    },
    iconCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1.5,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surfaceContainerLowest,
      zIndex: 1,
    },
    verticalLine: {
      width: 2,
      flex: 1,
      marginTop: -2,
      marginBottom: -2,
      borderRadius: 1,
    },
    contentBox: {
      flex: 1,
      marginLeft: SPACING.sm,
      marginBottom: SPACING.md,
      padding: SPACING.md,
      borderRadius: RADIUS.card,
      backgroundColor: colors.surfaceContainerLow || colors.tertiaryBackground,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.xs,
    },
    turBadge: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: RADIUS.sm,
    },
    turText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    zamanText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: "500",
    },
    yazanText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.onSurface || colors.text,
      marginBottom: SPACING.xs,
    },
    rolSuffix: {
      fontWeight: "500",
      color: colors.textMuted,
      fontSize: 12,
    },
    yorumMetin: {
      fontSize: 14,
      color: colors.onSurfaceVariant || colors.textTertiary,
      lineHeight: 20,
    },
    duzenlendiText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "500",
      marginTop: SPACING.xs,
      fontStyle: "italic",
    },
  });
