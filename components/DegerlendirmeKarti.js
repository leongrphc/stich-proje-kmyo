import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { RADIUS, SPACING } from "../lib/theme";
import GradientCard from "./GradientCard";

export default function DegerlendirmeKarti({ talep, degerlendirme, form, setForm, kaydediliyor, onKaydet }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  if (talep.durum !== "Tamamlandi") return null;

  return (
    <GradientCard style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Değerlendirme</Text>
          <Text style={styles.subtitle}>{talep.teknisyen_ad || "Atanan teknisyen"} için hizmet kalitesini puanlayın.</Text>
        </View>
        {degerlendirme && (
          <View style={styles.savedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.savedBadgeText}>Kaydedildi</Text>
          </View>
        )}
      </View>

      <YildizSatiri styles={styles} colors={colors} label="Teknisyen Puanı" value={form.teknisyen_puani} onChange={(puan) => setForm((onceki) => ({ ...onceki, teknisyen_puani: puan }))} />
      <YildizSatiri styles={styles} colors={colors} label="Çözüm Kalitesi" value={form.cozum_puani} onChange={(puan) => setForm((onceki) => ({ ...onceki, cozum_puani: puan }))} />

      <Text style={styles.label}>GERİ BİLDİRİM</Text>
      <View style={styles.textAreaContainer}>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          value={form.geri_bildirim}
          onChangeText={(text) => setForm((onceki) => ({ ...onceki, geri_bildirim: text }))}
          placeholder="Süreç, iletişim veya çözüm hakkında kısa bir not bırakın."
          placeholderTextColor={colors.textPlaceholder}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity style={[styles.submitBtn, (!form.teknisyen_puani || !form.cozum_puani || kaydediliyor) && styles.submitBtnDisabled]} onPress={onKaydet} disabled={!form.teknisyen_puani || !form.cozum_puani || kaydediliyor} activeOpacity={0.8}>
        {kaydediliyor ? <ActivityIndicator color="#fff" /> : <><Ionicons name="star" size={18} color="#fff" /><Text style={styles.submitBtnText}>{degerlendirme ? "Değerlendirmeyi Güncelle" : "Değerlendirmeyi Kaydet"}</Text></>}
      </TouchableOpacity>
    </GradientCard>
  );
}

function YildizSatiri({ styles, colors, label, value, onChange }) {
  return (
    <View style={styles.ratingBlock}>
      <View style={styles.ratingHeader}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.scoreText}>{value ? `${value}/5` : "Seçilmedi"}</Text>
      </View>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((item) => {
          const aktif = item <= value;
          return (
            <TouchableOpacity key={`${label}-${item}`} onPress={() => onChange(item)} style={[styles.starBtn, aktif && styles.starBtnActive]} activeOpacity={0.7}>
              <Ionicons name={aktif ? "star" : "star-outline"} size={24} color={aktif ? "#FF9500" : colors.textPlaceholder} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: { marginBottom: SPACING.base },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: SPACING.md,
      marginBottom: SPACING.lg,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.onSurface || colors.text,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: SPACING.xs,
      lineHeight: 18,
      letterSpacing: -0.08,
    },
    savedBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${colors.success}14`,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      gap: SPACING.xs,
    },
    savedBadgeText: {
      fontSize: 12,
      color: colors.success,
      fontWeight: "600",
    },
    ratingBlock: { marginBottom: SPACING.lg },
    ratingHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    label: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.outline || colors.textTertiary,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    scoreText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: "500",
    },
    starRow: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    starBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.quaternaryFill,
    },
    starBtnActive: {
      backgroundColor: "#FF950018",
    },
    textAreaContainer: {
      backgroundColor: colors.surfaceContainerHigh || colors.tertiaryBackground,
      borderRadius: RADIUS.lg,
      marginTop: SPACING.sm,
    },
    textArea: {
      minHeight: 100,
      padding: SPACING.base,
      fontSize: 17,
      color: colors.text,
      letterSpacing: -0.41,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: RADIUS.button,
      paddingVertical: SPACING.base,
      marginTop: SPACING.base,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: SPACING.sm,
      height: 50,
    },
    submitBtnDisabled: { opacity: 0.5 },
    submitBtnText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 17,
      letterSpacing: -0.41,
    },
  });
