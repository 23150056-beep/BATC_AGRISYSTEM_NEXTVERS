import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/services/api/auth.api";
import { useSessionValidation } from "@/hooks/useSessionValidation";

/**
 * Guards every authenticated route.
 *
 * M-1: isAuthenticated() now checks JWT exp client-side (see authStore).
 * M-2: On hard refresh the access token is in localStorage but `user` is null
 *      (Zustand state doesn't survive page reload). Without a loading gate,
 *      RoleRoute sees user=null and redirects to /login while the token is
 *      perfectly valid — a redirect loop.
 *
 *      Fix: if we have a valid token but no user, fetch /auth/me once before
 *      rendering any child routes. Show a spinner until resolved.
 *
 * SECURITY FIX: Added useSessionValidation hook to prevent browser from serving
 * cached authenticated pages. When user navigates back to login page, clicking
 * forward will NOT show cached dashboard - they must log in again.
 */
export function ProtectedRoute() {
  const { isAuthenticated, user, setUser, logout } = useAuthStore();
  const authenticated = isAuthenticated();

  // Prevent browser cache from serving authenticated pages
  useSessionValidation();

  // True only on hard refresh: token exists, user not yet hydrated.
  const [isInitializing, setIsInitializing] = useState(authenticated && !user);

  useEffect(() => {
    if (!authenticated || user) {
      setIsInitializing(false);
      return;
    }
    authApi
      .me()
      .then((me) => setUser(me))
      .catch(() => logout()) // expired / revoked token → clear and let redirect handle it
      .finally(() => setIsInitializing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authenticated) return <Navigate to="/login" replace />;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-[var(--color-brand-600)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Outlet />;
}
