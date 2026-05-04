import { UserTable } from "@/features/users/components/UserTable";

export function StaffUsersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">Directory of system accounts.</p>
      </div>
      <UserTable isAdmin={false} />
    </div>
  );
}
