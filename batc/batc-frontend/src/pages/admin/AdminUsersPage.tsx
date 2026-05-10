import { UserTable } from "@/features/users/components/UserTable";
import { PageHeader } from "@/components/ui";

export function AdminUsersPage() {
  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage system accounts and roles."
      />
      <UserTable isAdmin={true} />
    </div>
  );
}
