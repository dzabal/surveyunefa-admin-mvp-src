import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext(null);

function normalizeProfile(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || "",
    role: row.role,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("id", userId)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      setProfile(null);
      setProfileError(error.message || "No se pudo cargar el perfil administrativo.");
      return null;
    }

    const nextProfile = normalizeProfile(data);
    setProfile(nextProfile);
    setProfileError(nextProfile ? "" : "Tu usuario no tiene un perfil administrativo activo.");
    return nextProfile;
  };

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        setProfileError(error.message || "No se pudo validar la sesion.");
      }

      setSession(data.session);
      await loadProfile(data.session?.user?.id);
      setLoading(false);
    }

    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadProfile(nextSession?.user?.id);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      loading,
      profileError,
      refreshProfile: () => loadProfile(session?.user?.id),
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          throw new Error(error.message || "No se pudo iniciar sesion.");
        }
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
      },
    }),
    [loading, profile, profileError, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
