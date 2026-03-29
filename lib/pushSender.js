import { supabase } from "./supabase";

// Expo Push API üzerinden bildirim gönder
export async function sendPushNotification({ aliciId, baslik, mesaj, data = {} }) {
  try {
    const { data: token, error } = await supabase.rpc("get_push_token", {
      target_user_id: aliciId,
    });

    if (error) {
      console.error("Push token sorgu hatasi:", error.message);
      return;
    }
    if (!token) return;

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: token,
        title: baslik,
        body: mesaj,
        sound: "default",
        data,
        channelId: "default",
      }),
    });

    if (!response.ok) {
      console.error("Expo Push API hatasi:", response.status);
    }
  } catch (error) {
    console.error("Push bildirim gonderilemedi:", error.message);
  }
}

// Birden fazla kullanıcıya push gönder
export async function sendBulkPushNotification({ aliciIdler, baslik, mesaj, data = {} }) {
  if (!aliciIdler || aliciIdler.length === 0) return;

  try {
    const { data: tokens, error } = await supabase.rpc("get_push_tokens", {
      user_ids: aliciIdler,
    });

    if (error) {
      console.error("Push tokens sorgu hatasi:", error.message);
      return;
    }
    if (!tokens?.length) return;

    const messages = tokens
      .filter((t) => t.push_token)
      .map((t) => ({
        to: t.push_token,
        title: baslik,
        body: mesaj,
        sound: "default",
        data,
        channelId: "default",
      }));

    if (messages.length === 0) return;

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error("Expo Push API hatasi:", response.status);
    }
  } catch (error) {
    console.error("Toplu push bildirim gonderilemedi:", error.message);
  }
}
