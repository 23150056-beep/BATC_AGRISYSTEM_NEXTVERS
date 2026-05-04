import { cn } from "@/lib/utils";
import type { UserRole } from "../api/users.api";

const styles: Record<UserRole, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  STAFF: "bg-blue-100 text-blue-800",
  CLIENT: "bg-[#EAF3DE] text-[#27500A]",
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
  CLIENT: "Farmer",
};

export function UserRoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", styles[role])}>
      {ROLE_LABELS[role]}
    </span>
  );
}
