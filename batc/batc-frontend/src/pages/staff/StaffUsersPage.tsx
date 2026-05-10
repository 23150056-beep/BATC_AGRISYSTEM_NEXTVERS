import { UserTable } from "@/features/users/components/UserTable";
import { PageHeader } from "@/components/ui";

export function StaffUsersPage() {
  return (
    <div>
      <PageHeader
        title="Users"
        description="Directory of system accounts."
      />
      <UserTable isAdmin={false} />
    </div>
  );
}
