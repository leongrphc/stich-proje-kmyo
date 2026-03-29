import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import GradientCard from "../../components/GradientCard";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import { hataYonet } from "../../lib/errorHandler";
import { rolEtiketi } from "../../lib/helpers";
import { supabase } from "../../lib/supabase";
import { RADIUS, SPACING, TEMA_MODLARI } from "../../lib/theme";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";

export default function ProfilScreen() {
  const { user, profile, role, fullName, logout, updateProfileDetails, updateAvatarUrl } = useAuth();
  const { colors, shadows, themeMode, updateThemeMode, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(colors, shadows), [colors, shadows]);
  const router = useRouter();

  const [sifreModal, setSifreModal] = useState(false);
  const [bilgiModal, setBilgiModal] = useState(false);
  const [temaModal, setTemaModal] = useState(false);
  const [fotoModal, setFotoModal] = useState(false);
  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState("");
  const [sifreIslem, setSifreIslem] = useState(false);
  const [profilIslem, setProfilIslem] = useState(false);
  const [temaIslem, setTemaIslem] = useState(false);
  const [fotoIslem, setFotoIslem] = useState(false);
  const [ad, setAd] = useState(profile?.ad || user?.user_metadata?.ad || "");
  const [soyad, setSoyad] = useState(profile?.soyad || user?.user_metadata?.soyad || "");

  const avatarUrl = profile?.avatar_url || null;

  const themeLabel = themeMode === TEMA_MODLARI.dark ? "Dark Mode" : "Light Mode";

  const kisiselBilgilerModaliniAc = () => {
    setAd(profile?.ad || user?.user_metadata?.ad || "");
    setSoyad(profile?.soyad || user?.user_metadata?.soyad || "");
    setBilgiModal(true);
  };

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Oturumunuzu kapatmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/login");
            } catch (error) {
              hataYonet(error, "Çıkış Hatası");
            }
          },
        },
      ],
    );
  };

  const handleSifreDegistir = async () => {
    if (!yeniSifre.trim() || !yeniSifreTekrar.trim()) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurunuz.");
      return;
    }
    if (yeniSifre !== yeniSifreTekrar) {
      Alert.alert("Hata", "Şifreler eşleşmiyor.");
      return;
    }
    if (yeniSifre.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setSifreIslem(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: yeniSifre });
      if (error) throw error;
      Alert.alert("Başarılı", "Şifreniz başarıyla güncellendi.");
      sifreModalKapat();
    } catch (error) {
      hataYonet(error, "Şifre Güncelleme");
    } finally {
      setSifreIslem(false);
    }
  };

  const handleProfilKaydet = async () => {
    if (!ad.trim() || !soyad.trim()) {
      Alert.alert("Hata", "Ad ve soyad alanlarını doldurunuz.");
      return;
    }

    setProfilIslem(true);
    try {
      await updateProfileDetails({ ad, soyad });
      setBilgiModal(false);
      Alert.alert("Başarılı", "Kişisel bilgileriniz güncellendi.");
    } catch (error) {
      hataYonet(error, "Profil Güncelleme");
    } finally {
      setProfilIslem(false);
    }
  };

  const handleTemaSec = async (nextMode) => {
    if (nextMode === themeMode || temaIslem) {
      setTemaModal(false);
      return;
    }

    setTemaIslem(true);
    const result = await updateThemeMode(nextMode);
    setTemaIslem(false);

    if (!result.success) {
      hataYonet(result.error, "Tema Güncelleme");
      return;
    }

    setTemaModal(false);
  };

  const sifreModalKapat = () => {
    setSifreModal(false);
    setYeniSifre("");
    setYeniSifreTekrar("");
  };

  const uploadAvatar = async (uri) => {
    setFotoIslem(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, decode(base64), {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await updateAvatarUrl(publicUrl);

      Alert.alert("Başarılı", "Profil fotoğrafınız güncellendi.");
    } catch (error) {
      hataYonet(error, "Fotoğraf Yükleme");
    } finally {
      setFotoIslem(false);
      setFotoModal(false);
    }
  };

  const pickImage = async (fromCamera) => {
    const permResult = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permResult.granted) {
      Alert.alert("İzin Gerekli", fromCamera
        ? "Kamera izni vermeniz gerekmektedir."
        : "Galeri izni vermeniz gerekmektedir.");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const handleRemoveAvatar = async () => {
    setFotoIslem(true);
    try {
      const files = await supabase.storage
        .from("avatars")
        .list(user.id);

      if (files.data?.length) {
        const filePaths = files.data.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("avatars").remove(filePaths);
      }

      await updateAvatarUrl(null);
      Alert.alert("Başarılı", "Profil fotoğrafınız kaldırıldı.");
    } catch (error) {
      hataYonet(error, "Fotoğraf Silme");
    } finally {
      setFotoIslem(false);
      setFotoModal(false);
    }
  };

  const menuSections = [
    {
      title: "GENEL",
      items: [
        {
          icon: "camera-outline",
          label: "Profil Fotoğrafı",
          value: avatarUrl ? "Değiştir" : "Fotoğraf Ekle",
          onPress: () => setFotoModal(true),
        },
        {
          icon: "person-outline",
          label: "Kişisel Bilgiler",
          value: `${profile?.ad || user?.user_metadata?.ad || ""} ${profile?.soyad || user?.user_metadata?.soyad || ""}`.trim(),
          onPress: kisiselBilgilerModaliniAc,
        },
        {
          icon: isDark ? "moon-outline" : "sunny-outline",
          label: "Tema",
          value: themeLabel,
          onPress: () => setTemaModal(true),
        },
        {
          icon: "notifications-outline",
          label: "Bildirimler",
          onPress: () => router.push("/(tabs)/bildirimler"),
        },
      ],
    },
    {
      title: "HESAP",
      items: [
        {
          icon: "lock-closed-outline",
          label: "Şifre Değiştir",
          onPress: () => setSifreModal(true),
        },
      ],
    },
    {
      title: "DİĞER",
      items: [
        {
          icon: "help-circle-outline",
          label: "Yardım & Destek",
          onPress: () => Alert.alert("Bilgi", "Bu özellik yakında eklenecek."),
        },
        {
          icon: "information-circle-outline",
          label: "Hakkında",
          onPress: () =>
            Alert.alert(
              "KMYO Teknik Servis",
              "Versiyon 1.0.0\nKocaeli Meslek Yüksekokulu\nBitirme Projesi - 2026",
            ),
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: SPACING.xxxl }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={isDark ? ["#132847", "#264191", "#1e3a8a"] : ["#00236f", "#1e3a8a", "#264191"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileHeader}
      >
        <View style={styles.avatarWrapper}>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => setFotoModal(true)}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <Text style={styles.avatarText}>
                {profile?.ad?.[0] || user?.user_metadata?.ad?.[0] || "K"}
                {profile?.soyad?.[0] || user?.user_metadata?.soyad?.[0] || ""}
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </View>
        <Text style={styles.fullName}>{fullName}</Text>
        <Text style={styles.email}>{user?.email || ""}</Text>
        <View style={styles.rolPill}>
          <Text style={styles.rolPillText}>{rolEtiketi(role)}</Text>
        </View>
      </LinearGradient>

      {menuSections.map((section) => (
        <View key={section.title} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{section.title}</Text>
          <GradientCard style={styles.menuCard}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={`${section.title}-${item.label}`}
                style={[
                  styles.menuRow,
                  index < section.items.length - 1 && styles.menuRowBorder,
                ]}
                onPress={item.onPress}
                activeOpacity={0.6}
              >
                <View style={styles.menuRowLeft}>
                  <View style={styles.menuIconBg}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuRowText}>{item.label}</Text>
                    {item.value ? <Text style={styles.menuRowValue}>{item.value}</Text> : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textPlaceholder} />
              </TouchableOpacity>
            ))}
          </GradientCard>
        </View>
      ))}

      <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
        <GradientCard style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </GradientCard>
      </TouchableOpacity>

      <SheetModal visible={bilgiModal}>
        <Text style={styles.modalTitle}>Kişisel Bilgiler</Text>
        <Text style={styles.modalSubtitle}>
          Ad ve soyad bilgilerinizi güncellediğinizde hesap genelinde saklanır.
        </Text>

        <View style={styles.modalInputGroup}>
          <Text style={styles.modalInputLabel}>AD</Text>
          <View style={styles.modalInputContainer}>
            <TextInput
              style={styles.modalInput}
              placeholder="Adınız"
              placeholderTextColor={colors.textPlaceholder}
              value={ad}
              onChangeText={setAd}
            />
          </View>
        </View>

        <View style={styles.modalInputGroup}>
          <Text style={styles.modalInputLabel}>SOYAD</Text>
          <View style={styles.modalInputContainer}>
            <TextInput
              style={styles.modalInput}
              placeholder="Soyadınız"
              placeholderTextColor={colors.textPlaceholder}
              value={soyad}
              onChangeText={setSoyad}
            />
          </View>
        </View>

        <View style={styles.modalInputGroup}>
          <Text style={styles.modalInputLabel}>E-POSTA</Text>
          <View style={[styles.modalInputContainer, styles.disabledInputContainer]}>
            <TextInput
              style={styles.modalInput}
              value={user?.email || ""}
              editable={false}
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.modalPrimaryBtn, profilIslem && styles.disabledButton]}
          onPress={handleProfilKaydet}
          disabled={profilIslem}
          activeOpacity={0.8}
        >
          {profilIslem ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalPrimaryBtnText}>Bilgileri Kaydet</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setBilgiModal(false)} activeOpacity={0.7}>
          <Text style={styles.modalCancelBtnText}>Vazgeç</Text>
        </TouchableOpacity>
      </SheetModal>

      <SheetModal visible={temaModal}>
        <Text style={styles.modalTitle}>Tema</Text>
        <Text style={styles.modalSubtitle}>Uygulama görünümünü hemen değiştirebilir ve seçiminizi hesabınıza kaydedebilirsiniz.</Text>

        {[TEMA_MODLARI.light, TEMA_MODLARI.dark].map((mode) => {
          const selected = mode === themeMode;
          const label = mode === TEMA_MODLARI.dark ? "Dark Mode" : "Light Mode";
          const icon = mode === TEMA_MODLARI.dark ? "moon-outline" : "sunny-outline";

          return (
            <TouchableOpacity
              key={mode}
              style={[styles.themeOption, selected && styles.themeOptionActive]}
              onPress={() => handleTemaSec(mode)}
              activeOpacity={0.7}
              disabled={temaIslem}
            >
              <View style={[styles.themeOptionIcon, selected && styles.themeOptionIconActive]}>
                <Ionicons name={icon} size={20} color={selected ? "#fff" : colors.primary} />
              </View>
              <View style={styles.themeOptionTextWrap}>
                <Text style={[styles.themeOptionTitle, selected && styles.themeOptionTitleActive]}>{label}</Text>
                <Text style={[styles.themeOptionDescription, selected && styles.themeOptionDescriptionActive]}>
                  {mode === TEMA_MODLARI.dark ? "Daha koyu ve düşük ışıkta rahat kullanım." : "Aydınlık ve klasik görünüm."}
                </Text>
              </View>
              {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setTemaModal(false)} activeOpacity={0.7}>
          <Text style={styles.modalCancelBtnText}>Kapat</Text>
        </TouchableOpacity>
      </SheetModal>

      <SheetModal visible={sifreModal}>
        <Text style={styles.modalTitle}>Şifre Değiştir</Text>
        <Text style={styles.modalSubtitle}>Yeni şifreniz en az 6 karakter olmalıdır.</Text>

        <View style={styles.modalInputGroup}>
          <Text style={styles.modalInputLabel}>YENİ ŞİFRE</Text>
          <View style={styles.modalInputContainer}>
            <TextInput
              style={styles.modalInput}
              placeholder="Yeni şifrenizi giriniz"
              placeholderTextColor={colors.textPlaceholder}
              value={yeniSifre}
              onChangeText={setYeniSifre}
              secureTextEntry
            />
          </View>
        </View>

        <View style={styles.modalInputGroup}>
          <Text style={styles.modalInputLabel}>YENİ ŞİFRE TEKRAR</Text>
          <View style={styles.modalInputContainer}>
            <TextInput
              style={styles.modalInput}
              placeholder="Şifrenizi tekrar giriniz"
              placeholderTextColor={colors.textPlaceholder}
              value={yeniSifreTekrar}
              onChangeText={setYeniSifreTekrar}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.modalPrimaryBtn, sifreIslem && styles.disabledButton]}
          onPress={handleSifreDegistir}
          disabled={sifreIslem}
          activeOpacity={0.8}
        >
          {sifreIslem ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalPrimaryBtnText}>Şifreyi Güncelle</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.modalCancelBtn} onPress={sifreModalKapat} activeOpacity={0.7}>
          <Text style={styles.modalCancelBtnText}>Vazgeç</Text>
        </TouchableOpacity>
      </SheetModal>

      {/* Fotoğraf Seçenekleri */}
      <SheetModal visible={fotoModal}>
        <Text style={styles.modalTitle}>Profil Fotoğrafı</Text>
        <Text style={styles.modalSubtitle}>Profil fotoğrafınızı değiştirmek için bir seçenek belirleyin.</Text>

        {fotoIslem ? (
          <View style={{ alignItems: "center", paddingVertical: SPACING.xl }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.modalSubtitle, { marginTop: SPACING.md, marginBottom: 0 }]}>Yükleniyor...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.fotoOption}
              onPress={() => pickImage(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.fotoOptionIcon, { backgroundColor: `${colors.primary}14` }]}>
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.fotoOptionText}>Fotoğraf Çek</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textPlaceholder} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fotoOption}
              onPress={() => pickImage(false)}
              activeOpacity={0.7}
            >
              <View style={[styles.fotoOptionIcon, { backgroundColor: `${colors.tamamlandi || colors.success}14` }]}>
                <Ionicons name="images-outline" size={22} color={colors.tamamlandi || colors.success} />
              </View>
              <Text style={styles.fotoOptionText}>Galeriden Seç</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textPlaceholder} />
            </TouchableOpacity>

            {avatarUrl && (
              <TouchableOpacity
                style={styles.fotoOption}
                onPress={handleRemoveAvatar}
                activeOpacity={0.7}
              >
                <View style={[styles.fotoOptionIcon, { backgroundColor: `${colors.danger}14` }]}>
                  <Ionicons name="trash-outline" size={22} color={colors.danger} />
                </View>
                <Text style={[styles.fotoOptionText, { color: colors.danger }]}>Fotoğrafı Kaldır</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textPlaceholder} />
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setFotoModal(false)} activeOpacity={0.7}>
          <Text style={styles.modalCancelBtnText}>Vazgeç</Text>
        </TouchableOpacity>
      </SheetModal>
    </ScrollView>
  );
}

function SheetModal({ children, visible }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = (colors, shadows = {}) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface || colors.background },
    profileHeader: {
      alignItems: "center",
      paddingTop: Platform.OS === "ios" ? 60 : 48,
      paddingBottom: SPACING.xl,
      borderBottomLeftRadius: RADIUS.card,
      borderBottomRightRadius: RADIUS.card,
    },
    avatarWrapper: {
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    avatarCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: "rgba(255,255,255,0.95)",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      ...(shadows.lg || {}),
    },
    avatarImage: {
      width: 88,
      height: 88,
      borderRadius: 44,
    },
    avatarText: {
      fontSize: 34,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 0.37,
    },
    cameraBadge: {
      position: "absolute",
      bottom: 0,
      alignSelf: "center",
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#fff",
    },
    fotoOption: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: RADIUS.card,
      padding: SPACING.base,
      marginBottom: SPACING.sm,
      backgroundColor: colors.surfaceContainerLow || colors.card,
      gap: SPACING.md,
    },
    fotoOptionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    fotoOptionText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: colors.onSurface || colors.text,
      letterSpacing: -0.24,
    },
    fullName: {
      fontSize: 22,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: 0.35,
    },
    email: {
      fontSize: 15,
      color: "rgba(255,255,255,0.76)",
      marginTop: SPACING.xs,
      letterSpacing: -0.24,
    },
    rolPill: {
      backgroundColor: "rgba(255,255,255,0.18)",
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.xs + 2,
      marginTop: SPACING.md,
    },
    rolPillText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: -0.08,
    },
    menuSection: {
      marginTop: SPACING.lg,
      paddingHorizontal: SPACING.base,
    },
    menuSectionTitle: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.outline || colors.textTertiary,
      marginBottom: SPACING.sm,
      paddingLeft: SPACING.xs,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    menuCard: {
      overflow: "hidden",
    },
    menuRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.md + 2,
    },
    menuRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceContainer || colors.borderLight,
    },
    menuRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: SPACING.sm,
    },
    menuTextWrap: {
      flex: 1,
    },
    menuIconBg: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.primaryBg,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.md,
    },
    menuRowText: {
      fontSize: 15,
      color: colors.onSurface || colors.text,
      fontWeight: "500",
    },
    menuRowValue: {
      marginTop: 2,
      fontSize: 13,
      color: colors.textMuted,
      letterSpacing: -0.08,
    },
    logoutBtn: {
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: SPACING.base,
      marginTop: SPACING.xl,
    },
    logoutText: {
      fontSize: 17,
      fontWeight: "400",
      color: colors.danger,
      letterSpacing: -0.41,
    },
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
      letterSpacing: -0.3,
    },
    modalSubtitle: {
      fontSize: 15,
      color: colors.textMuted,
      marginTop: SPACING.xs,
      marginBottom: SPACING.lg,
      letterSpacing: -0.24,
      lineHeight: 21,
    },
    modalInputGroup: { marginBottom: SPACING.base },
    modalInputLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textTertiary,
      marginBottom: SPACING.sm,
      letterSpacing: -0.08,
    },
    modalInputContainer: {
      backgroundColor: colors.surfaceContainerHigh || colors.tertiaryBackground,
      borderRadius: RADIUS.lg,
    },
    disabledInputContainer: {
      opacity: 0.7,
    },
    modalInput: {
      padding: SPACING.base,
      fontSize: 17,
      color: colors.text,
      letterSpacing: -0.41,
    },
    modalPrimaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: RADIUS.button,
      padding: SPACING.base,
      alignItems: "center",
      marginTop: SPACING.sm,
      height: 50,
      justifyContent: "center",
    },
    modalPrimaryBtnText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "600",
      letterSpacing: -0.41,
    },
    modalCancelBtn: {
      alignItems: "center",
      paddingVertical: SPACING.base,
      marginTop: SPACING.xs,
    },
    modalCancelBtnText: {
      fontSize: 17,
      color: colors.danger,
      fontWeight: "400",
      letterSpacing: -0.41,
    },
    disabledButton: {
      opacity: 0.6,
    },
    themeOption: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: RADIUS.card,
      padding: SPACING.base,
      marginBottom: SPACING.md,
      backgroundColor: colors.surfaceContainerLow || colors.card,
      gap: SPACING.md,
    },
    themeOptionActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryBg,
    },
    themeOptionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondaryBackground,
    },
    themeOptionIconActive: {
      backgroundColor: colors.primary,
    },
    themeOptionTextWrap: {
      flex: 1,
    },
    themeOptionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      letterSpacing: -0.24,
    },
    themeOptionTitleActive: {
      color: colors.text,
    },
    themeOptionDescription: {
      marginTop: 3,
      fontSize: 13,
      color: colors.textMuted,
      letterSpacing: -0.08,
      lineHeight: 18,
    },
    themeOptionDescriptionActive: {
      color: colors.textSecondary,
    },
  });
