import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Profil yuklenemedi:", error.message);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }, []);

  const setupUser = useCallback(async (sessionUser) => {
    setUser(sessionUser);
    const p = await fetchProfile(sessionUser.id);
    if (p) {
      setProfile(p);
      setRole(p.rol);
    } else {
      setProfile(null);
      setRole(sessionUser.user_metadata?.rol || "kullanici");
    }
  }, [fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    const SESSION_TIMEOUT_MS = 8000;

    const sessionPromise = supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        await setupUser(session.user);
      }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("getSession timeout")), SESSION_TIMEOUT_MS)
    );

    Promise.race([sessionPromise, timeoutPromise])
      .catch((err) => {
        console.warn("Auth oturumu alinamadi, devam ediliyor:", err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        await setupUser(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
      if (loading) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setupUser]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const register = async (ad, soyad, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { ad, soyad, rol: "kullanici" },
      },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfileDetails = async ({ ad, soyad }) => {
    if (!user) throw new Error("Kullanici bulunamadi.");

    const temizAd = (ad || "").trim();
    const temizSoyad = (soyad || "").trim();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ ad: temizAd, soyad: temizSoyad, email: user.email })
      .eq("id", user.id);

    if (profileError) throw profileError;

    const { data, error: authError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        ad: temizAd,
        soyad: temizSoyad,
      },
    });

    if (authError) throw authError;

    if (data?.user) {
      setUser(data.user);
    }

    await refreshProfile();
  };

  const refreshProfile = async () => {
    if (!user) return null;

    const p = await fetchProfile(user.id);
    if (p) {
      setProfile(p);
      setRole(p.rol);
      return p;
    }

    setProfile(null);
    setRole(user.user_metadata?.rol || "kullanici");
    return null;
  };

  const updateAvatarUrl = async (avatarUrl) => {
    if (!user) throw new Error("Kullanici bulunamadi.");

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (error) throw error;
    await refreshProfile();
  };

  const isYonetici = role === "yonetici";
  const isTeknisyen = role === "teknisyen";
  const isKullanici = role === "kullanici";
  const isStaff = role === "yonetici" || role === "teknisyen";

  // Kullanicinin tam adini dondur
  const fullName = profile
    ? `${profile.ad || ""} ${profile.soyad || ""}`.trim()
    : user?.user_metadata?.ad || "Kullanici";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        fullName,
        loading,
        login,
        register,
        logout,
        updateProfileDetails,
        updateAvatarUrl,
        refreshProfile,
        isYonetici,
        isTeknisyen,
        isKullanici,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth, AuthProvider icinde kullanilmalidir.");
  }
  return context;
}
