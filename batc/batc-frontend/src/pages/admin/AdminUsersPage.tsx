import { UserTable } from "@/features/users/components/UserTable";

export function AdminUsersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">Manage system accounts and roles.</p>
      </div>
      <UserTable isAdmin={true} />
    </div>
  );
}
