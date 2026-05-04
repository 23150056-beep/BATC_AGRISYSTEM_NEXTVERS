import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  // ProtectedRoute handles the null/loading case — see M-2 fix
  if (!user) return null;
  if (user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "STAFF") return <Navigate to="/staff/dashboard" replace />;
  return <Navigate to="/app/home" replace />;
}
