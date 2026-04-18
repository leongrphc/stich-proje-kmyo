import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider, useAppTheme } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { colors } = useAppTheme();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="talep-detay"
        options={{
          headerShown: true,
          title: "TEKNİK SERVİS",
          headerBackTitle: "Geri",
          presentation: "card",
          headerStyle: {
            backgroundColor: colors.surfaceContainerLowest || colors.secondaryBackground,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 20,
            color: colors.primary,
            letterSpacing: -0.5,
          },
          headerShadowVisible: false,
          headerBackTitleStyle: {
            fontSize: 15,
          },
        }}
      />
      <Stack.Screen
        name="ayarlar"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
}
