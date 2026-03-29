import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { RENKLER, SHADOWS, RADIUS, SPACING } from "../lib/theme";

export default function RegisterScreen() {
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!ad.trim() || !soyad.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurunuz.");
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert("Hata", "Şifreler eşleşmiyor.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setSubmitting(true);
    try {
      await register(ad.trim(), soyad.trim(), email.trim(), password);
      Alert.alert(
        "Başarılı",
        "Kayıt işlemi tamamlandı. Giriş yapabilirsiniz.",
        [{ text: "Tamam", onPress: () => router.replace("/login") }],
      );
    } catch (error) {
      Alert.alert("Kayıt Başarısız", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={RENKLER.primary} />
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>KMYO Teknik Servis Takip Sistemi</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Name Row */}
            <View style={styles.row}>
              <View style={[styles.inputWrapper, { flex: 1, marginRight: SPACING.sm }]}>
                <Text style={styles.inputLabel}>Ad</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Adınız"
                    placeholderTextColor={RENKLER.textPlaceholder}
                    value={ad}
                    onChangeText={setAd}
                  />
                </View>
              </View>
              <View style={[styles.inputWrapper, { flex: 1, marginLeft: SPACING.sm }]}>
                <Text style={styles.inputLabel}>Soyad</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Soyadınız"
                    placeholderTextColor={RENKLER.textPlaceholder}
                    value={soyad}
                    onChangeText={setSoyad}
                  />
                </View>
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>E-posta</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={RENKLER.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ornek@email.com"
                  placeholderTextColor={RENKLER.textPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Şifre</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={RENKLER.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={RENKLER.textPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={RENKLER.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Confirm */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Şifre Tekrar</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={RENKLER.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifrenizi tekrar giriniz"
                  placeholderTextColor={RENKLER.textPlaceholder}
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Kayıt Ol</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLinkText}>
              Zaten hesabınız var mı?{" "}
              <Text style={styles.loginLinkBold}>Giriş Yap</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RENKLER.surface,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 50 : 20,
    marginBottom: SPACING.lg,
  },
  backText: {
    fontSize: 17,
    color: RENKLER.primary,
    fontWeight: "400",
    marginLeft: SPACING.xs,
  },
  headerContainer: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: RENKLER.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: RENKLER.outline,
    marginTop: SPACING.xs,
    letterSpacing: 0.5,
    fontWeight: "500",
  },
  formCard: {
    backgroundColor: RENKLER.surfaceContainerLowest,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    ...SHADOWS.sm,
  },
  row: {
    flexDirection: "row",
  },
  inputWrapper: {
    marginBottom: SPACING.base,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: RENKLER.outline,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RENKLER.surfaceContainerHigh,
    borderRadius: RADIUS.lg,
  },
  inputIcon: {
    paddingLeft: SPACING.base,
  },
  input: {
    flex: 1,
    padding: SPACING.base,
    fontSize: 15,
    color: RENKLER.onSurface,
  },
  eyeBtn: {
    paddingRight: SPACING.base,
    paddingVertical: SPACING.base,
  },
  primaryButton: {
    backgroundColor: RENKLER.primary,
    borderRadius: RADIUS.button,
    padding: SPACING.base,
    alignItems: "center",
    marginTop: SPACING.sm,
    height: 50,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  loginLink: {
    marginTop: SPACING.xl,
    alignItems: "center",
  },
  loginLinkText: {
    fontSize: 15,
    color: RENKLER.textMuted,
    letterSpacing: -0.24,
  },
  loginLinkBold: {
    color: RENKLER.primary,
    fontWeight: "600",
  },
});
