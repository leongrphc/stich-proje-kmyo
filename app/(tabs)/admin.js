import { Redirect } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function AdminTabScreen() {
  const { isYonetici } = useAuth();

  if (!isYonetici) {
    return <Redirect href="/(tabs)/profil" />;
  }

  return <Redirect href="/ayarlar" />;
}
