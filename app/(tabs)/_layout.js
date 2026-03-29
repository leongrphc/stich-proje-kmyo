import { Ionicons } from "@expo/vector-icons";
import { Tabs, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import { okunmamisSayisiGetir } from "../../lib/bildirimler";

export default function TabLayout() {
  const { isStaff, isYonetici } = useAuth();
  const { colors } = useAppTheme();
  const [okunmamisSayisi, setOkunmamisSayisi] = useState(0);

  const bildirimSayisiniGuncelle = async () => {
    try {
      const sayi = await okunmamisSayisiGetir();
      setOkunmamisSayisi(sayi);
    } catch {
      // Bildirim sayisi alinamadi
    }
  };

  useFocusEffect(
    useCallback(() => {
      bildirimSayisiniGuncelle();
      const interval = setInterval(bildirimSayisiniGuncelle, 30000);
      return () => clearInterval(interval);
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLowest || colors.card,
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.05,
              shadowRadius: 20,
            },
            android: {
              elevation: 12,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: colors.surfaceContainerLowest || colors.card,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: "800",
          fontSize: 20,
          color: colors.primary,
          letterSpacing: -0.5,
          textTransform: "uppercase",
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Panel",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="talepler"
        options={{
          title: "Talepler",
          headerTitle: "TEKNİK SERVİS",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "document-text" : "document-text-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="yeni-talep"
        options={{
          title: "Yeni Kayıt",
          headerTitle: "Yeni Kayıt",
          href: isStaff ? null : "/(tabs)/yeni-talep",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bildirimler"
        options={{
          title: "Bildirimler",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "notifications" : "notifications-outline"} size={22} color={color} />
          ),
          tabBarBadge: okunmamisSayisi > 0 ? okunmamisSayisi : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.danger,
            fontSize: 11,
            fontWeight: "600",
            minWidth: 18,
            height: 18,
            lineHeight: 18,
            borderRadius: 9,
          },
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Yönetim",
          href: isYonetici ? "/(tabs)/admin" : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "shield-checkmark" : "shield-checkmark-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
