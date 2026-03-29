import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://unvkcsbppwumqhaomjgb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmtjc2JwcHd1bXFoYW9tamdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDk4NTUsImV4cCI6MjA4MTIyNTg1NX0.tR1Zga0udjj8b8buAMrEk2e4STwE22TSA9sE0iB3wro";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
