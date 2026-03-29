import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { RADIUS, SPACING } from "../lib/theme";

export default function TalepBilgiKarti({ talep, durumRengi, oncelikRengi, tarihFormat }) {
  const { colors, shadows } = useAppTheme();
  const styles = useMemo(() => getStyles(colors, shadows), [colors, shadows]);
  const renk = durumRengi(talep.durum);

  const durumLabel = (durum) => {
    const map = {
      "Beklemede": "BEKLEYEN",
      "Devam Ediyor": "İŞLEMDE",
      "Tamamlandi": "TAMAMLANDI",
      "Atandi": "ATANDI",
      "Aksiyon Bekleniyor": "AKSİYON",
      "Onay Bekliyor": "ONAY BEKLİYOR",
      "Kapatildi": "KAPALI",
    };
    return map[durum] || durum?.toUpperCase() || "";
  };

  return (
    <>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={[styles.headerAccent, { backgroundColor: colors.primary }]} />
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <Text style={styles.talepNo}>
              TALEP NO: #{talep.id?.substring(0, 8).toUpperCase() || "TR-0000"}
            </Text>
            <View style={[styles.durumBadge, { backgroundColor: `${renk}18`, borderColor: `${renk}30` }]}>
              <Text style={[styles.durumBadgeText, { color: renk }]}>{durumLabel(talep.durum)}</Text>
            </View>
          </View>
          <Text style={styles.baslik}>{talep.baslik}</Text>
          <Text style={styles.modelInfo}>
            {talep.kategori && `${talep.kategori}`}
            {talep.konum && ` / ${talep.konum}`}
          </Text>
        </View>
      </View>

      {/* Telemetri Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.telemetryScroll}
        contentContainerStyle={styles.telemetryContent}
      >
        <TelemetryModule
          colors={colors}
          shadows={shadows}
          label="KATEGORİ"
          value={talep.kategori || "-"}
          accentColor={colors.primary}
        />
        <TelemetryModule
          colors={colors}
          shadows={shadows}
          label="KONUM"
          value={talep.konum || "-"}
          accentColor={colors.tertiaryColor || colors.warning}
        />
        <TelemetryModule
          colors={colors}
          shadows={shadows}
          label="ÖNCELİK"
          value={talep.oncelik || "-"}
          accentColor={oncelikRengi(talep.oncelik)}
        />
      </ScrollView>

      {/* Detay Bilgileri */}
      <View style={styles.detailCard}>
        <DetailRow styles={styles} colors={colors} icon="person-outline" label="Oluşturan" value={talep.kullanici_ad || talep.kullanici_email || "-"} />
        <DetailRow styles={styles} colors={colors} icon="construct-outline" label="Teknisyen" value={talep.teknisyen_ad || talep.teknisyen || "Atanmadı"} />
        <DetailRow styles={styles} colors={colors} icon="calendar-outline" label="Tarih" value={tarihFormat(talep.created_at, true)} last />
      </View>

      {/* Açıklama */}
      <View style={styles.descriptionCard}>
        <Text style={styles.cardTitle}>Açıklama</Text>
        <Text style={styles.aciklama}>{talep.aciklama}</Text>
      </View>

      {/* Fotoğraf */}
      {talep.foto_url && (() => {
        let urls = [];
        try {
          const parsed = JSON.parse(talep.foto_url);
          urls = Array.isArray(parsed) ? parsed : [talep.foto_url];
        } catch {
          urls = [talep.foto_url];
        }
        return (
          <View style={styles.photoCard}>
            <Text style={styles.cardTitle}>Fotoğraflar ({urls.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoGallery}>
              {urls.map((url, i) => (
                <View key={i} style={styles.photoWrap}>
                  <Image source={{ uri: url }} style={styles.talepFoto} resizeMode="cover" />
                  {urls.length > 1 && (
                    <View style={styles.photoBadge}>
                      <Text style={styles.photoBadgeText}>{i + 1}/{urls.length}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        );
      })()}
    </>
  );
}

function TelemetryModule({ colors, shadows, label, value, accentColor }) {
  return (
    <View style={[telStyles.module, { backgroundColor: colors.surfaceContainerHighest }, shadows.sm]}>
      <Text style={[telStyles.label, { color: colors.outline }]}>{label}</Text>
      <Text style={[telStyles.value, { color: colors.onSurface }]} numberOfLines={1}>{value}</Text>
      <View style={[telStyles.accent, { backgroundColor: accentColor }]} />
    </View>
  );
}

function DetailRow({ styles, colors, icon, label, value, last }) {
  return (
    <View style={[styles.row, !last && styles.rowSeparator]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={16} color={colors.primary} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const telStyles = StyleSheet.create({
  module: {
    width: 140,
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    position: "relative",
    overflow: "hidden",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  accent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});

const getStyles = (colors, shadows) =>
  StyleSheet.create({
    headerCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: RADIUS.card,
      overflow: "hidden",
      flexDirection: "row",
      marginBottom: SPACING.base,
      ...shadows.sm,
    },
    headerAccent: {
      width: 4,
    },
    headerContent: {
      flex: 1,
      padding: SPACING.lg,
    },
    headerTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    talepNo: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.outline,
      letterSpacing: 1,
    },
    durumBadge: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
    },
    durumBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.8,
    },
    baslik: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.onSurface,
      letterSpacing: -0.3,
    },
    modelInfo: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: SPACING.xs,
      fontWeight: "500",
    },
    telemetryScroll: {
      marginBottom: SPACING.base,
      marginHorizontal: -SPACING.base,
    },
    telemetryContent: {
      paddingHorizontal: SPACING.base,
    },
    detailCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: RADIUS.card,
      padding: SPACING.base,
      marginBottom: SPACING.base,
      ...shadows.sm,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: SPACING.md,
    },
    rowSeparator: {
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceContainer,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    rowLabel: {
      fontSize: 14,
      color: colors.outline,
      fontWeight: "500",
    },
    rowValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.onSurface,
      maxWidth: "55%",
      textAlign: "right",
    },
    descriptionCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: RADIUS.card,
      padding: SPACING.lg,
      marginBottom: SPACING.base,
      ...shadows.sm,
    },
    cardTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.outline,
      letterSpacing: 1,
      marginBottom: SPACING.md,
      textTransform: "uppercase",
    },
    aciklama: {
      fontSize: 15,
      color: colors.onSurfaceVariant,
      lineHeight: 22,
    },
    photoCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: RADIUS.card,
      padding: SPACING.lg,
      marginBottom: SPACING.base,
      ...shadows.sm,
    },
    photoGallery: {
      gap: SPACING.md,
    },
    photoWrap: {
      width: 240,
      height: 180,
      borderRadius: RADIUS.lg,
      overflow: "hidden",
    },
    talepFoto: {
      width: "100%",
      height: "100%",
      borderRadius: RADIUS.lg,
    },
    photoBadge: {
      position: "absolute",
      bottom: 8,
      right: 8,
      backgroundColor: "rgba(0,0,0,0.6)",
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
    },
    photoBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#fff",
    },
  });
