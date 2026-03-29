import { Alert } from "react-native";

export function hataYonet(error, baslik = "Hata") {
  const mesaj = error?.message || "Beklenmeyen bir hata oluştu.";
  console.error(`[${baslik}]`, mesaj);
  Alert.alert(baslik, mesaj);
}

export function onayIste(baslik, mesaj, onayFunc, options = {}) {
  const { iptalText = "İptal", onayText = "Tamam", destructive = false } = options;
  Alert.alert(baslik, mesaj, [
    { text: iptalText, style: "cancel" },
    { text: onayText, style: destructive ? "destructive" : "default", onPress: onayFunc },
  ]);
}
