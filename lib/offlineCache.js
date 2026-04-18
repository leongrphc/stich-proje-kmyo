import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "cache_";

/**
 * Veriyi AsyncStorage'a cache'le
 * @param {string} anahtar - Cache anahtarı (ör: "talepler", "ozet", "bildirimler")
 * @param {any} veri - Cache'lenecek veri
 */
export async function cacheVeriKaydet(anahtar, veri) {
  try {
    const key = CACHE_PREFIX + anahtar;
    const json = JSON.stringify(veri);
    await AsyncStorage.setItem(key, json);
  } catch (error) {
    console.warn("Cache kaydetme hatasi:", error.message);
  }
}

/**
 * Cache'den veri oku
 * @param {string} anahtar - Cache anahtarı
 * @returns {any|null} - Cache'deki veri veya null
 */
export async function cacheVeriGetir(anahtar) {
  try {
    const key = CACHE_PREFIX + anahtar;
    const json = await AsyncStorage.getItem(key);
    if (json !== null) {
      return JSON.parse(json);
    }
    return null;
  } catch (error) {
    console.warn("Cache okuma hatasi:", error.message);
    return null;
  }
}

/**
 * Belirli bir cache kaydını sil
 * @param {string} anahtar - Silinecek cache anahtarı
 */
export async function cacheSil(anahtar) {
  try {
    const key = CACHE_PREFIX + anahtar;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn("Cache silme hatasi:", error.message);
  }
}
