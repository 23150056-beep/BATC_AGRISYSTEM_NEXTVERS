import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import type { Role } from "@/types";

interface RoleRouteProps {
  allowed: Role[];
}

export function RoleRoute({ allowed }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user);
  // ProtectedRoute already handles null user (initializing / unauthenticated).
  // Returning null here prevents an erroneous /login redirect while /auth/me
  // is still in-flight on a hard refresh (M-2).
  if (!user) return null;
  if (!allowed.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
