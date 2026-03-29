import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { rolEtiketi, sureFormatla, tarihFormat } from "../lib/helpers";
import { supabase } from "../lib/supabase";
import { RADIUS, SPACING } from "../lib/theme";
import GradientCard from "./GradientCard";

const SES_BUCKET = "talep-sesleri";

export default function YorumListesi({
  yorumlar,
  yeniYorum,
  setYeniYorum,
  onGonder,
  scrollRef,
  canVoiceRecord = false,
  kayitYapiliyor = false,
  sesYukleniyor = false,
  onSesKaydiBaslat,
  onSesKaydiBitir,
  onSesKaydiIptal,
  currentUserId,
  onYorumDuzenle,
  onYorumSil,
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const aktifSesRef = useRef(null);
  const [aktifSesId, setAktifSesId] = useState(null);
  const [sesCaliyor, setSesCaliyor] = useState(false);
  const [indirilenSesId, setIndirilenSesId] = useState(null);
  const [duzenlenenYorumId, setDuzenlenenYorumId] = useState(null);
  const [duzenlenenMetin, setDuzenlenenMetin] = useState("");

  useEffect(() => {
    return () => {
      aktifSesRef.current?.unloadAsync().catch(() => null);
    };
  }, []);

  const duzenlemeBaslat = (yorum) => {
    setDuzenlenenYorumId(yorum.id);
    setDuzenlenenMetin(yorum.yorum || "");
  };

  const duzenlemeIptal = () => {
    setDuzenlenenYorumId(null);
    setDuzenlenenMetin("");
  };

  const duzenlemeKaydet = async () => {
    const temizMetin = duzenlenenMetin.trim();
    if (!temizMetin || !duzenlenenYorumId) return;

    const basarili = await onYorumDuzenle?.(duzenlenenYorumId, temizMetin);
    if (basarili) {
      duzenlemeIptal();
    }
  };

  const handleSesOynat = async (yorumId, sesPath) => {
    if (!sesPath) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });

      if (aktifSesRef.current && aktifSesId === yorumId) {
        if (sesCaliyor) {
          await aktifSesRef.current.pauseAsync();
          setSesCaliyor(false);
        } else {
          await aktifSesRef.current.playAsync();
          setSesCaliyor(true);
        }
        return;
      }

      if (aktifSesRef.current) {
        await aktifSesRef.current.unloadAsync();
        aktifSesRef.current = null;
      }

      setIndirilenSesId(yorumId);

      const { data, error } = await supabase.storage.from(SES_BUCKET).createSignedUrl(sesPath, 60 * 60);
      if (error) throw error;

      const { sound } = await Audio.Sound.createAsync(
        { uri: data.signedUrl },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;

          if (status.didJustFinish) {
            aktifSesRef.current?.unloadAsync().catch(() => null);
            aktifSesRef.current = null;
            setAktifSesId(null);
            setSesCaliyor(false);
            return;
          }

          setSesCaliyor(status.isPlaying);
        },
      );

      aktifSesRef.current = sound;
      setAktifSesId(yorumId);
      setSesCaliyor(true);
    } catch (error) {
      console.error("Ses oynatılamadı:", error.message);
      setAktifSesId(null);
      setSesCaliyor(false);
    } finally {
      setIndirilenSesId(null);
    }
  };

  return (
    <GradientCard style={styles.card}>
      <Text style={styles.cardTitle}>Notlar / Yorumlar ({yorumlar.length})</Text>

      {yorumlar.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={32} color={colors.textPlaceholder} />
          <Text style={styles.emptyText}>Henüz yorum yok</Text>
        </View>
      ) : (
        yorumlar.map((y) => (
          <View key={y.id} style={[styles.yorumItem, y.tur !== "yorum" && styles.yorumSistem]}>
            <View style={styles.yorumTopRow}>
              <View style={styles.yorumHeader}>
                <Text style={styles.yorumYazan}>{y.yazan_ad || "Kullanıcı"}</Text>
                <View style={styles.rolChip}>
                  <Text style={styles.yorumRol}>{rolEtiketi(y.yazan_rol)}</Text>
                </View>
              </View>

              {y.tur === "yorum" && y.yazan_id === currentUserId && (
                <View style={styles.yorumActions}>
                  {y.mesaj_tipi !== "voice" && (
                    <TouchableOpacity onPress={() => duzenlemeBaslat(y)} style={styles.actionTouchable} activeOpacity={0.7}>
                      <Ionicons name="create-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => onYorumSil?.(y)} style={styles.actionTouchable} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {duzenlenenYorumId === y.id ? (
              <View style={styles.editBox}>
                <View style={styles.editInputContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={duzenlenenMetin}
                    onChangeText={setDuzenlenenMetin}
                    multiline
                    placeholder="Yorumu güncelleyin..."
                    placeholderTextColor={colors.textPlaceholder}
                  />
                </View>
                <View style={styles.editActionRow}>
                  <TouchableOpacity style={styles.editCancelBtn} onPress={duzenlemeIptal} activeOpacity={0.7}>
                    <Text style={styles.editCancelText}>Vazgeç</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.editSaveBtn, !duzenlenenMetin.trim() && { opacity: 0.5 }]} onPress={duzenlemeKaydet} disabled={!duzenlenenMetin.trim()} activeOpacity={0.8}>
                    <Text style={styles.editSaveText}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : y.mesaj_tipi === "voice" ? (
              <View style={styles.voiceBox}>
                <View style={styles.voiceMeta}>
                  <View style={styles.voiceIconBg}>
                    <Ionicons name="mic" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.voiceLabel}>Sesli mesaj</Text>
                  {y.ses_suresi_ms ? <Text style={styles.voiceDuration}>{sureFormatla(y.ses_suresi_ms)}</Text> : null}
                </View>

                <TouchableOpacity style={[styles.voicePlayBtn, !y.ses_path && styles.voicePlayBtnDisabled]} onPress={() => handleSesOynat(y.id, y.ses_path)} disabled={!y.ses_path || indirilenSesId === y.id} activeOpacity={0.8}>
                  {indirilenSesId === y.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name={aktifSesId === y.id && sesCaliyor ? "pause" : "play"} size={16} color="#fff" />
                  )}
                  <Text style={styles.voicePlayText}>
                    {indirilenSesId === y.id ? "Hazırlanıyor" : aktifSesId === y.id && sesCaliyor ? "Duraklat" : "Sesi Oynat"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.yorumText}>{y.yorum}</Text>
            )}

            <View style={styles.yorumFooter}>
              <Text style={styles.yorumTarih}>{tarihFormat(y.created_at, true)}</Text>
              {y.updated_at && new Date(y.updated_at).getTime() - new Date(y.created_at).getTime() > 1000 ? <Text style={styles.duzenlendiText}>Düzenlendi</Text> : null}
            </View>
          </View>
        ))
      )}

      {canVoiceRecord && (
        <View style={styles.voiceComposer}>
          {kayitYapiliyor ? (
            <>
              <View style={styles.voiceRecordingInfo}>
                <View style={styles.recordDot} />
                <Text style={styles.voiceRecordingText}>Ses kaydı devam ediyor...</Text>
              </View>
              <View style={styles.voiceActionRow}>
                <TouchableOpacity style={styles.voiceCancelBtn} onPress={onSesKaydiIptal} activeOpacity={0.7}>
                  <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                  <Text style={styles.voiceCancelText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.voiceSendBtn} onPress={onSesKaydiBitir} activeOpacity={0.8}>
                  <Ionicons name="stop-circle-outline" size={18} color="#fff" />
                  <Text style={styles.voiceSendText}>Kaydı Gönder</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity style={[styles.voiceStartBtn, sesYukleniyor && styles.voiceStartBtnDisabled]} onPress={onSesKaydiBaslat} disabled={sesYukleniyor} activeOpacity={0.7}>
              {sesYukleniyor ? (
                <>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.voiceStartText}>Ses yükleniyor...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="mic" size={18} color={colors.primary} />
                  <Text style={styles.voiceStartText}>Sesli mesaj bırak</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.yorumInputRow}>
        <View style={styles.yorumInputContainer}>
          <TextInput
            style={styles.yorumTextInput}
            placeholder="Not veya yorum ekleyin..."
            placeholderTextColor={colors.textPlaceholder}
            value={yeniYorum}
            onChangeText={setYeniYorum}
            multiline
            onFocus={() => {
              setTimeout(() => {
                scrollRef?.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />
        </View>
        <TouchableOpacity style={[styles.sendBtn, !yeniYorum.trim() && styles.sendBtnDisabled]} onPress={onGonder} disabled={!yeniYorum.trim()} activeOpacity={0.7}>
          <Ionicons name="arrow-up" size={20} color={yeniYorum.trim() ? "#fff" : colors.textPlaceholder} />
        </TouchableOpacity>
      </View>
    </GradientCard>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: { marginBottom: SPACING.base },
    cardTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.outline || colors.textMuted,
      marginBottom: SPACING.md,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: SPACING.xl,
    },
    emptyText: {
      color: colors.outline || colors.textMuted,
      fontSize: 14,
      marginTop: SPACING.sm,
    },
    yorumItem: {
      backgroundColor: colors.surfaceContainerLow || colors.tertiaryBackground,
      borderRadius: RADIUS.card,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    yorumSistem: {
      borderLeftColor: colors.warning,
      backgroundColor: `${colors.warning}08`,
    },
    yorumTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    yorumHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.xs,
    },
    yorumYazan: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.onSurface || colors.text,
    },
    rolChip: {
      backgroundColor: colors.primaryBg,
      borderRadius: RADIUS.sm,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
    },
    yorumRol: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "600",
    },
    yorumActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    actionTouchable: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.quaternaryFill,
      justifyContent: "center",
      alignItems: "center",
    },
    yorumText: {
      fontSize: 14,
      color: colors.onSurfaceVariant || colors.textTertiary,
      lineHeight: 21,
    },
    yorumFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: SPACING.sm,
    },
    yorumTarih: {
      fontSize: 12,
      color: colors.textMuted,
      letterSpacing: 0.07,
    },
    duzenlendiText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "500",
    },
    editBox: { marginTop: SPACING.xs },
    editInputContainer: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.input,
      borderWidth: 0.5,
      borderColor: `${colors.primary}40`,
    },
    editInput: {
      minHeight: 80,
      padding: SPACING.md,
      fontSize: 15,
      color: colors.text,
      textAlignVertical: "top",
      letterSpacing: -0.24,
    },
    editActionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: SPACING.sm,
      gap: SPACING.sm,
    },
    editCancelBtn: {
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.sm,
      backgroundColor: colors.quaternaryFill,
    },
    editCancelText: {
      color: colors.textTertiary,
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: -0.08,
    },
    editSaveBtn: {
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.sm,
      backgroundColor: colors.primary,
    },
    editSaveText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: -0.08,
    },
    voiceBox: {
      borderRadius: RADIUS.md,
      backgroundColor: colors.primaryBg,
      padding: SPACING.md,
      marginTop: SPACING.xs,
    },
    voiceMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    voiceIconBg: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: `${colors.primary}18`,
      justifyContent: "center",
      alignItems: "center",
    },
    voiceLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
      letterSpacing: -0.08,
    },
    voiceDuration: {
      fontSize: 12,
      color: colors.textMuted,
      marginLeft: "auto",
    },
    voicePlayBtn: {
      marginTop: SPACING.sm,
      backgroundColor: colors.primary,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.sm + 2,
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: SPACING.sm,
    },
    voicePlayBtnDisabled: { opacity: 0.5 },
    voicePlayText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: -0.08,
    },
    voiceComposer: {
      borderWidth: 0.5,
      borderColor: colors.borderLight,
      borderRadius: RADIUS.md,
      backgroundColor: colors.tertiaryBackground,
      padding: SPACING.md,
      marginTop: SPACING.md,
    },
    voiceStartBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
    },
    voiceStartBtnDisabled: { opacity: 0.6 },
    voiceStartText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: "500",
      letterSpacing: -0.24,
    },
    voiceRecordingInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    recordDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.danger,
    },
    voiceRecordingText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "500",
      letterSpacing: -0.24,
    },
    voiceActionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: SPACING.md,
      gap: SPACING.sm,
    },
    voiceCancelBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: `${colors.danger}30`,
      borderRadius: RADIUS.button,
      paddingVertical: SPACING.md,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      backgroundColor: `${colors.danger}08`,
      gap: SPACING.sm,
    },
    voiceCancelText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: -0.24,
    },
    voiceSendBtn: {
      flex: 1,
      borderRadius: RADIUS.button,
      paddingVertical: SPACING.md,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      backgroundColor: colors.primary,
      gap: SPACING.sm,
    },
    voiceSendText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: -0.24,
    },
    yorumInputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginTop: SPACING.md,
      gap: SPACING.sm,
    },
    yorumInputContainer: {
      flex: 1,
      backgroundColor: colors.surfaceContainerHigh || colors.tertiaryBackground,
      borderRadius: RADIUS.card,
    },
    yorumTextInput: {
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.md,
      fontSize: 17,
      color: colors.text,
      maxHeight: 80,
      letterSpacing: -0.41,
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    sendBtnDisabled: {
      backgroundColor: colors.quaternaryFill,
    },
  });
