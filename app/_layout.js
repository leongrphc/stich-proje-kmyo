import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider, useAppTheme } from "../context/ThemeContext";
import {
  registerForPushNotifications,
  savePushToken,
} from "../lib/pushNotifications";

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
  const { user } = useAuth();
  const router = useRouter();
  const notificationResponseListener = useRef(null);

  // Push token kaydı
  useEffect(() => {
    if (!user) return;

    registerForPushNotifications().then((token) => {
      if (token) savePushToken(user.id, token);
    });
  }, [user]);

  // Bildirime tıklanınca yönlendirme
  useEffect(() => {
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.talepId) {
          router.push({ pathname: "/talep-detay", params: { id: data.talepId } });
        }
      });

    return () => {
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(notificationResponseListener.current);
      }
    };
  }, [router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
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
