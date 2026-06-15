import * as React from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { fetchProfile } from "@/features/auth/api/auth-api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);

  React.useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);

      if (data.session?.user) {
        try {
          const profile = await fetchProfile(data.session.user.id);
          if (!profile) {
            console.warn(
              "[Auth] users jadvalida profil topilmadi. auth.uid():",
              data.session.user.id,
              "email:",
              data.session.user.email
            );
          }
          if (mounted) setProfile(profile);
        } catch (err) {
          console.error("[Auth] Profilni yuklashda xatolik:", err);
          if (mounted) setProfile(null);
        }
      }
      if (mounted) setLoading(false);
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        try {
          const profile = await fetchProfile(session.user.id);
          if (!profile) {
            console.warn(
              "[Auth] users jadvalida profil topilmadi. auth.uid():",
              session.user.id,
              "email:",
              session.user.email
            );
          }
          setProfile(profile);
        } catch (err) {
          console.error("[Auth] Profilni yuklashda xatolik:", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [setSession, setProfile, setLoading]);

  return <>{children}</>;
}
