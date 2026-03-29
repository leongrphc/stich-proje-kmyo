import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Bildirim geldiğinde foreground'da nasıl gösterilecek
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Android için bildirim kanalı
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "Varsayılan",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#00236f",
    sound: "default",
  });
}

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.warn("Push bildirim sadece fiziksel cihazda çalışır.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Bildirim izni verilmedi.");
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (error) {
    console.error("Push token alinamadi:", error.message);
    return null;
  }
}

export async function savePushToken(userId, token) {
  if (!userId || !token) return;

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ expo_push_token: token })
      .eq("id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Push token kaydedilemedi:", error.message);
  }
}

export async function removePushToken(userId) {
  if (!userId) return;

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ expo_push_token: null })
      .eq("id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Push token silinemedi:", error.message);
  }
}
