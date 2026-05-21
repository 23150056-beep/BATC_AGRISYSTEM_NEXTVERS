import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem("access_token"),
  refreshToken: localStorage.getItem("refresh_token"),

  setTokens(access, refresh) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    set({ accessToken: access, refreshToken: refresh });
  },

  setUser(user) {
    set({ user });
  },

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("_auth_check_time");
    set({ user: null, accessToken: null, refreshToken: null });
    
    // SECURITY FIX: Clear session storage to prevent cached page access
    if (typeof window !== "undefined") {
      sessionStorage.clear();
    }
  },

  isAuthenticated() {
    const token = get().accessToken;
    if (!token) return false;
    // M-1: check the JWT exp claim client-side so an already-expired token
    // doesn't pass the guard and trigger a wasted /auth/me round-trip.
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) return false;
    } catch {
      // malformed token → treat as unauthenticated
      return false;
    }
    return true;
  },
}));

// Cross-tab sync: when the user logs out (or in) in another tab, propagate the
// change to this tab's store. Without this, a stale token sits in memory until
// the next 401 forces a refresh — recoverable but noisy (Finding #25).
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "access_token" || e.key === "refresh_token") {
      const access  = localStorage.getItem("access_token");
      const refresh = localStorage.getItem("refresh_token");
      if (!access) {
        // Logged out elsewhere
        useAuthStore.setState({ user: null, accessToken: null, refreshToken: null });
      } else {
        useAuthStore.setState({ accessToken: access, refreshToken: refresh });
      }
    }
  });
}
