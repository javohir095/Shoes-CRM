import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { AppUser } from "@/types/database.types";

interface AuthState {
  session: Session | null;
  profile: AppUser | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ session: null, profile: null, isLoading: false }),
}));
