import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import { yoneticilereBildirim } from "../../lib/bildirimler";
import { hataYonet } from "../../lib/errorHandler";
import { supabase } from "../../lib/supabase";
import { RADIUS, SPACING } from "../../lib/theme";

export default function YeniTalepScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, shadows, isDark } = useAppTheme();
  const styles = useMemo(
    () => getStyles(colors, shadows, isDark),
    [colors, shadows, isDark],
  );
  const [submitting, setSubmitting] = useState(false);
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [konum, setKonum] = useState("");
  const [kategori, setKategori] = useState("");
  const [oncelik, setOncelik] = useState("");
  const [fotolar, setFotolar] = useState([]);

  const kategoriler = [
    "Bilgisayar",
    "Yazıcı",
    "Projeksiyon",
    "Ağ / İnternet",
    "Klima",
    "Elektrik",
    "Diğer",
  ];

  const oncelikler = ["Düşük", "Orta", "Yüksek"];

  const oncelikRengi = (o) => {
    switch (o) {
      case "Düşük":
        return colors.success;
      case "Orta":
        return colors.warning;
      case "Yüksek":
        return colors.danger;
      default:
        return colors.outline;
    }
  };

  const MAX_FOTO = 5;

  const fotografSec = async (kaynak) => {
    if (fotolar.length >= MAX_FOTO) {
      Alert.alert("Limit", `En fazla ${MAX_FOTO} fotoğraf ekleyebilirsiniz.`);
      return;
    }

    let result;
    if (kaynak === "kamera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Kamera izni gereklidir.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Galeri izni gereklidir.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
      });
    }
    if (!result.canceled && result.assets?.[0]) {
      setFotolar((prev) => [...prev, result.assets[0]]);
    }
  };

  const fotografSil = (index) => {
    setFotolar((prev) => prev.filter((_, i) => i !== index));
  };

  const fotografEkle = () => {
    if (fotolar.length >= MAX_FOTO) {
      Alert.alert("Limit", `En fazla ${MAX_FOTO} fotoğraf ekleyebilirsiniz.`);
      return;
    }
    Alert.alert("Fotoğraf Ekle", "Kaynak seçin", [
      { text: "İptal", style: "cancel" },
      { text: "Galeriden Seç", onPress: () => fotografSec("galeri") },
      { text: "Fotoğraf Çek", onPress: () => fotografSec("kamera") },
    ]);
  };

  const handleSubmit = async () => {
    if (!baslik.trim()) {
      Alert.alert("Hata", "Lütfen talep başlığını giriniz.");
      return;
    }
    if (!aciklama.trim()) {
      Alert.alert("Hata", "Lütfen açıklama giriniz.");
      return;
    }
    if (!konum.trim()) {
      Alert.alert("Hata", "Lütfen konum giriniz.");
      return;
    }
    if (!kategori) {
      Alert.alert("Hata", "Lütfen kategori seçiniz.");
      return;
    }
    if (!oncelik) {
      Alert.alert("Hata", "Lütfen öncelik seçiniz.");
      return;
    }

    setSubmitting(true);
    try {
      let fotoUrl = null;
      if (fotolar.length > 0) {
        const urls = [];
        for (const f of fotolar) {
          try {
            const arraybuffer = await fetch(f.uri).then((res) =>
              res.arrayBuffer(),
            );
            const fileExt = f.uri.split(".").pop() || "jpg";
            const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from("talep-fotograflari")
              .upload(fileName, arraybuffer, {
                contentType: f.mimeType || `image/${fileExt}`,
              });

            if (uploadError) {
              console.error("Foto yukleme hatasi:", uploadError.message);
            } else {
              const { data: urlData } = supabase.storage
                .from("talep-fotograflari")
                .getPublicUrl(fileName);
              urls.push(urlData.publicUrl);
            }
          } catch (fotoErr) {
            console.error("Foto yukleme hatasi:", fotoErr.message);
          }
        }
        fotoUrl = urls.length === 1 ? urls[0] : JSON.stringify(urls);
      }

      const { data: insertData, error } = await supabase
        .from("talepler")
        .insert({
          baslik: baslik.trim(),
          aciklama: aciklama.trim(),
          kategori,
          konum: konum.trim(),
          oncelik,
          durum: "Beklemede",
          kullanici_id: user.id,
          kullanici_ad:
            `${user.user_metadata?.ad || ""} ${user.user_metadata?.soyad || ""}`.trim(),
          kullanici_email: user.email,
          foto_url: fotoUrl,
        })
        .select("id")
        .single();

      if (error) throw error;

      const kullaniciAd =
        `${user.user_metadata?.ad || ""} ${user.user_metadata?.soyad || ""}`.trim();
      await yoneticilereBildirim({
        gonderenId: user.id,
        gonderenAd: kullaniciAd || user.email,
        talepId: insertData?.id || null,
        baslik: "Yeni Talep",
        mesaj: `${kullaniciAd || user.email} yeni bir talep oluşturdu: "${baslik.trim()}"`,
        tur: "yeni_talep",
      });

      Alert.alert("Başarılı", "Talep başarıyla oluşturuldu!", [
        {
          text: "Tamam",
          onPress: () => {
            setBaslik("");
            setAciklama("");
            setKonum("");
            setKategori("");
            setOncelik("");
            setFotolar([]);
            router.push("/(tabs)/talepler");
          },
        },
      ]);
    } catch (error) {
      hataYonet(error, "Talep Oluşturma");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Başlık */}
        <SectionHeading title="Talep Bilgileri" color={colors.primary} />
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>BAŞLIK</Text>
            <TextInput
              style={styles.input}
              placeholder="Ör: Yazıcı arızası"
              placeholderTextColor={colors.outlineVariant}
              value={baslik}
              onChangeText={setBaslik}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>KONUM</Text>
            <TextInput
              style={styles.input}
              placeholder="Ör: İstanbul / Kadıköy Ofis - 3. Kat No: 305"
              placeholderTextColor={colors.outlineVariant}
              value={konum}
              onChangeText={setKonum}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>AÇIKLAMA</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Arıza detaylarını buraya yazın..."
              placeholderTextColor={colors.outlineVariant}
              value={aciklama}
              onChangeText={setAciklama}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Kategori */}
        <SectionHeading
          title="Kategori"
          color={colors.tertiaryColor || colors.primary}
        />
        <View style={styles.formCard}>
          <View style={styles.chipGrid}>
            {kategoriler.map((k) => (
              <TouchableOpacity
                key={k}
                style={[styles.chip, kategori === k && styles.chipActive]}
                onPress={() => setKategori(k)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    kategori === k && styles.chipTextActive,
                  ]}
                >
                  {k}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Öncelik */}
        <SectionHeading title="Öncelik" color={colors.outline} />
        <View style={styles.formCard}>
          <View style={styles.priorityRow}>
            {oncelikler.map((o) => (
              <TouchableOpacity
                key={o}
                style={[
                  styles.priorityBtn,
                  {
                    borderColor: oncelikRengi(o),
                    backgroundColor:
                      oncelik === o ? oncelikRengi(o) : "transparent",
                  },
                ]}
                onPress={() => setOncelik(o)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.priorityText,
                    { color: oncelik === o ? "#fff" : oncelikRengi(o) },
                  ]}
                >
                  {o}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fotoğraf */}
        <SectionHeading
          title={`Cihaz Görselleri (${fotolar.length}/${MAX_FOTO})`}
          color={colors.outline}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoScroll}
          contentContainerStyle={styles.photoSection}
        >
          {fotolar.map((f, i) => (
            <View key={i} style={styles.photoPreviewWrap}>
              <Image source={{ uri: f.uri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.photoRemoveBtn}
                onPress={() => fotografSil(i)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
              <View style={styles.photoBadge}>
                <Text style={styles.photoBadgeText}>{i + 1}</Text>
              </View>
            </View>
          ))}
          {fotolar.length < MAX_FOTO && (
            <TouchableOpacity
              style={styles.photoAddBtn}
              onPress={fotografEkle}
              activeOpacity={0.7}
            >
              <Ionicons
                name="camera-outline"
                size={28}
                color={colors.outline}
              />
              <Text style={styles.photoAddText}>RESİM EKLE</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isDark ? ["#264191", "#1e3a8a"] : ["#00236f", "#1e3a8a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitGradient}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>
                  Talebi Kaydet ve Gönder
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelBtnText}>Vazgeç</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionHeading({ title, color }) {
  const { colors } = useAppTheme();
  return (
    <View style={sectionStyles.wrap}>
      <View style={[sectionStyles.accent, { backgroundColor: color }]} />
      <Text style={[sectionStyles.text, { color: color || colors.primary }]}>
        {title}
      </Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  accent: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  text: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
});

const getStyles = (colors, shadows, isDark) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
    stepRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    stepActive: {
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.sm + 2,
      borderRadius: RADIUS.lg,
    },
    stepActiveText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: 1,
    },
    stepLine: {
      width: 24,
      height: 2,
      backgroundColor: colors.outlineVariant,
    },
    stepInactive: {
      backgroundColor: colors.surfaceContainerHighest,
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.sm + 2,
      borderRadius: RADIUS.lg,
    },
    stepInactiveText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.onSurfaceVariant,
      letterSpacing: 1,
    },
    formCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: RADIUS.card,
      padding: SPACING.lg,
      ...shadows.sm,
    },
    inputGroup: {
      marginBottom: SPACING.lg,
    },
    inputLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.outline,
      letterSpacing: 1.5,
      marginBottom: SPACING.sm,
      marginLeft: 2,
    },
    input: {
      backgroundColor: colors.surfaceContainerHigh,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.md + 2,
      fontSize: 15,
      color: colors.onSurface,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
    },
    chip: {
      backgroundColor: colors.surfaceContainerHigh,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.sm + 2,
    },
    chipActive: {
      backgroundColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontWeight: "600",
    },
    chipTextActive: { color: "#fff" },
    priorityRow: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    priorityBtn: {
      flex: 1,
      borderWidth: 1.5,
      borderRadius: RADIUS.button,
      paddingVertical: SPACING.md,
      alignItems: "center",
    },
    priorityText: {
      fontSize: 14,
      fontWeight: "700",
    },
    photoScroll: {
      marginBottom: SPACING.sm,
    },
    photoSection: {
      flexDirection: "row",
      gap: SPACING.md,
      paddingRight: SPACING.md,
    },
    photoAddBtn: {
      width: 100,
      height: 100,
      borderRadius: RADIUS.card,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainer,
      justifyContent: "center",
      alignItems: "center",
      gap: SPACING.xs,
    },
    photoAddText: {
      fontSize: 9,
      fontWeight: "700",
      color: colors.outline,
      letterSpacing: 0.5,
    },
    photoPreviewWrap: {
      width: 100,
      height: 100,
      borderRadius: RADIUS.card,
      overflow: "hidden",
    },
    photoPreview: {
      width: "100%",
      height: "100%",
    },
    photoRemoveBtn: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: RADIUS.lg,
      backgroundColor: "rgba(186,26,26,0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    photoBadge: {
      position: "absolute",
      bottom: 4,
      left: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    photoBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#fff",
    },
    submitBtn: {
      marginTop: SPACING.xl,
      borderRadius: RADIUS.card,
      overflow: "hidden",
      ...shadows.lg,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitGradient: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: SPACING.lg,
      gap: SPACING.sm,
    },
    submitBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    cancelBtn: {
      alignItems: "center",
      paddingVertical: SPACING.base,
      marginTop: SPACING.sm,
    },
    cancelBtnText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.outline,
    },
  });
