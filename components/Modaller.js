import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { musaitlikRengi } from "../lib/helpers";
import { RADIUS, SPACING } from "../lib/theme";
import { AKSIYON_TIPLERI } from "./AksiyonKarti";

export function AksiyonModal({ visible, onClose, aksiyonTipi, setAksiyonTipi, aksiyonAciklama, setAksiyonAciklama, aksiyonMaliyet, setAksiyonMaliyet, onGonder }) {
  const { colors, shadows } = useAppTheme();
  const styles = useMemo(() => getStyles(colors, shadows), [colors, shadows]);

  const handleClose = () => {
    setAksiyonTipi("");
    setAksiyonAciklama("");
    setAksiyonMaliyet("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: "85%" }]}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator contentContainerStyle={{ paddingBottom: SPACING.lg }}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Aksiyon Bildir</Text>
              <Text style={styles.modalSubtitle}>Yöneticiden onay gerektiren bir durum bildirin.</Text>

              {AKSIYON_TIPLERI.map((tip) => (
                <TouchableOpacity key={tip.key} style={[styles.aksiyonTipItem, aksiyonTipi === tip.key && styles.aksiyonTipItemActive]} onPress={() => setAksiyonTipi(tip.key)} activeOpacity={0.7}>
                  <View style={[styles.aksiyonTipIcon, { backgroundColor: aksiyonTipi === tip.key ? "rgba(255,255,255,0.2)" : `${colors.pink}14` }]}>
                    <Ionicons name={tip.icon} size={20} color={aksiyonTipi === tip.key ? "#fff" : colors.pink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.aksiyonTipLabel, aksiyonTipi === tip.key && { color: "#fff" }]}>{tip.label}</Text>
                    <Text style={[styles.aksiyonTipDesc, aksiyonTipi === tip.key && { color: "rgba(255,255,255,0.7)" }]}>{tip.desc}</Text>
                  </View>
                  {aksiyonTipi === tip.key ? <Ionicons name="checkmark-circle" size={22} color="#fff" /> : null}
                </TouchableOpacity>
              ))}

              {aksiyonTipi === "maliyet_onayi" && (
                <View style={{ marginTop: SPACING.base }}>
                  <Text style={styles.inputLabel}>TAHMİNİ MALİYET (TL)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} placeholder="Örnek: 2500" placeholderTextColor={colors.textPlaceholder} value={aksiyonMaliyet} onChangeText={setAksiyonMaliyet} keyboardType="numeric" />
                  </View>
                </View>
              )}

              <View style={{ marginTop: SPACING.base }}>
                <Text style={styles.inputLabel}>AÇIKLAMA</Text>
                <View style={[styles.inputContainer, { alignItems: "flex-start" }]}>
                  <TextInput style={[styles.input, { height: 100, textAlignVertical: "top" }]} placeholder="Durumu detaylı açıklayınız..." placeholderTextColor={colors.textPlaceholder} value={aksiyonAciklama} onChangeText={setAksiyonAciklama} multiline />
                </View>
              </View>

              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.pink, marginTop: SPACING.lg }]} onPress={onGonder} activeOpacity={0.8}>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Aksiyon Bildir</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function AtamaModal({ visible, onClose, teknisyenler, onTeknisyenSec }) {
  const { colors, shadows } = useAppTheme();
  const styles = useMemo(() => getStyles(colors, shadows), [colors, shadows]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: "65%" }]}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: SPACING.lg }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Teknisyen Seç</Text>

              {teknisyenler.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="construct-outline" size={40} color={colors.textPlaceholder} />
                  <Text style={styles.emptyText}>Kayıtlı teknisyen bulunamadı</Text>
                </View>
              ) : (
                teknisyenler.map((t) => (
                  <TouchableOpacity key={t.id} style={styles.teknisyenItem} onPress={() => onTeknisyenSec(t)} activeOpacity={0.6}>
                    <View style={styles.teknisyenHeader}>
                      <View style={styles.teknisyenKimlik}>
                        <View style={styles.teknisyenAvatar}>
                          <Ionicons name="construct-outline" size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.teknisyenAd}>{t.ad || ""} {t.soyad || ""}</Text>
                          <Text style={styles.teknisyenEmail}>{t.email}</Text>
                        </View>
                      </View>
                      <View style={[styles.musaitlikPill, { backgroundColor: `${musaitlikRengi(t.musaitlik)}18` }]}>
                        <Text style={[styles.musaitlikText, { color: musaitlikRengi(t.musaitlik) }]}>{t.musaitlik || "Belirsiz"}</Text>
                      </View>
                    </View>

                    <View style={styles.teknisyenMetaRow}>
                      <View style={styles.metaPill}>
                        <Ionicons name="folder-outline" size={14} color={colors.textTertiary} />
                        <Text style={styles.metaPillText}>{t.acik_talep_sayisi || 0} açık talep</Text>
                      </View>
                    </View>

                    <View style={styles.uzmanlikRow}>
                      {(t.uzmanlik_alanlari || []).length > 0 ? (
                        (t.uzmanlik_alanlari || []).map((alan) => (
                          <View key={`${t.id}-${alan}`} style={styles.uzmanlikChip}>
                            <Text style={styles.uzmanlikChipText}>{alan}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.uzmanlikBos}>Uzmanlık alanı eklenmemiş</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Kapat</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = (colors, shadows) =>
  StyleSheet.create({
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
      marginBottom: SPACING.xs,
      letterSpacing: -0.3,
    },
    modalSubtitle: {
      fontSize: 15,
      color: colors.textMuted,
      marginBottom: SPACING.lg,
      letterSpacing: -0.24,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: SPACING.xxl,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 15,
      marginTop: SPACING.md,
      letterSpacing: -0.24,
    },
    teknisyenItem: {
      padding: SPACING.base,
      borderRadius: RADIUS.card,
      backgroundColor: colors.surfaceContainerLow || colors.card,
      marginBottom: SPACING.md,
      ...shadows.sm,
    },
    teknisyenHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: SPACING.md,
    },
    teknisyenKimlik: { flexDirection: "row", flex: 1 },
    teknisyenAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryBg,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.md,
    },
    teknisyenAd: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      letterSpacing: -0.24,
    },
    teknisyenEmail: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
      letterSpacing: -0.08,
    },
    musaitlikPill: {
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
    },
    musaitlikText: { fontSize: 12, fontWeight: "600" },
    teknisyenMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    metaPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      backgroundColor: colors.quaternaryFill,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
    },
    metaPillText: {
      fontSize: 13,
      color: colors.textTertiary,
      fontWeight: "500",
      letterSpacing: -0.08,
    },
    uzmanlikRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    uzmanlikChip: {
      backgroundColor: colors.primaryBg,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
    },
    uzmanlikChipText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "600",
    },
    uzmanlikBos: {
      fontSize: 13,
      color: colors.textMuted,
      letterSpacing: -0.08,
    },
    aksiyonTipItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: SPACING.base,
      borderRadius: RADIUS.card,
      backgroundColor: colors.surfaceContainerLow || colors.card,
      marginBottom: SPACING.sm,
      gap: SPACING.md,
    },
    aksiyonTipItemActive: {
      backgroundColor: colors.pink,
      borderColor: colors.pink,
    },
    aksiyonTipIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    aksiyonTipLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      letterSpacing: -0.24,
    },
    aksiyonTipDesc: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      letterSpacing: 0.07,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textTertiary,
      marginBottom: SPACING.sm,
      letterSpacing: -0.08,
    },
    inputContainer: {
      backgroundColor: colors.surfaceContainerHigh || colors.tertiaryBackground,
      borderRadius: RADIUS.lg,
    },
    input: {
      padding: SPACING.base,
      fontSize: 17,
      color: colors.text,
      letterSpacing: -0.41,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: RADIUS.button,
      padding: SPACING.base,
      height: 50,
      gap: SPACING.sm,
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "600",
      letterSpacing: -0.41,
    },
    cancelBtn: {
      alignItems: "center",
      paddingVertical: SPACING.base,
    },
    cancelBtnText: {
      fontSize: 17,
      color: colors.danger,
      fontWeight: "400",
      letterSpacing: -0.41,
    },
  });
