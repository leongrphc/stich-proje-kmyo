import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { RADIUS, RENKLER, SHADOWS, SPACING } from "../lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Hata", "Lütfen e-posta ve şifrenizi giriniz.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Giriş Başarısız", error.message);
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
          {/* Branding */}
          <View style={styles.brandContainer}>
            <LinearGradient
              colors={["#00236f", "#1e3a8a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Ionicons name="construct" size={36} color="#fff" />
            </LinearGradient>
            <Text style={styles.appName}>TEKNİK SERVİS</Text>
            <Text style={styles.appTagline}>
              KMYO Teknik Servis Takip Sistemi
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Hoş Geldiniz</Text>
            <Text style={styles.formSubtitle}>
              Devam etmek için giriş yapın
            </Text>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>E-POSTA</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={RENKLER.outline}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="E-posta adresiniz"
                  placeholderTextColor={RENKLER.outlineVariant}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>ŞİFRE</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={RENKLER.outline}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Şifreniz"
                  placeholderTextColor={RENKLER.outlineVariant}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={RENKLER.outline}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  submitting ? ["#757682", "#757682"] : ["#00236f", "#1e3a8a"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.primaryButton,
                  submitting && styles.buttonDisabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Giriş Yap</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push("/register")}
            activeOpacity={0.7}
          >
            <Text style={styles.registerLinkText}>
              Hesabınız yok mu?{" "}
              <Text style={styles.registerLinkBold}>Kayıt Ol</Text>
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
    justifyContent: "center",
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.base,
    ...SHADOWS.md,
  },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    color: RENKLER.primary,
    letterSpacing: -0.3,
  },
  appTagline: {
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
  formTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: RENKLER.onSurface,
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: 14,
    color: RENKLER.outline,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  inputWrapper: {
    marginBottom: SPACING.base,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: RENKLER.outline,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
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
  registerLink: {
    marginTop: SPACING.xl,
    alignItems: "center",
  },
  registerLinkText: {
    fontSize: 14,
    color: RENKLER.outline,
  },
  registerLinkBold: {
    color: RENKLER.primary,
    fontWeight: "700",
  },
});
