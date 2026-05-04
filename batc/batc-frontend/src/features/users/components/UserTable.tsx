import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, ArchiveRestore, Archive, KeyRound, Pencil } from "lucide-react";
import { usersApi, type UserItem } from "../api/users.api";
import { UserRoleBadge } from "./UserRoleBadge";
import { UserFormModal } from "./UserFormModal";
import { cn } from "@/lib/utils";

interface UserTableProps {
  isAdmin: boolean;
}

export function UserTable({ isAdmin }: UserTableProps) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalUser, setModalUser] = useState<UserItem | null | "new">(null);
  const [confirmArchive, setConfirmArchive] = useState<UserItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users", { search, role: roleFilter, page }],
    queryFn: () => usersApi.list({ search: search || undefined, role: roleFilter || undefined, page }),
  });

  const archiveMut = useMutation({
    mutationFn: (u: UserItem) => u.is_archived ? usersApi.unarchive(u.id) : usersApi.archive(u.id),
    onSuccess: (_, u) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(u.is_archived ? "User unarchived." : "User archived.");
      setConfirmArchive(null);
    },
  });

  const resetMut = useMutation({
    mutationFn: (id: number) => usersApi.resetPassword(id),
    onSuccess: () => {
      toast.success("Password has been reset to the default: farmer1234");
    },
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#639922]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#639922]"
        >
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
          <option value="CLIENT">Farmer</option>
        </select>
        {isAdmin && (
          <button
            onClick={() => setModalUser("new")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-md"
            style={{ backgroundColor: "#3B6D11" }}
          >
            <Plus size={14} />
            Add User
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Username</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!isLoading && data?.results.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
            )}
            {data?.results.map((user) => (
              <tr key={user.id} className={cn("hover:bg-gray-50", user.is_archived && "opacity-50")}>
                <td className="px-4 py-3 font-medium text-gray-900">{user.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{user.username}</td>
                <td className="px-4 py-3 text-gray-600">{user.email || "—"}</td>
                <td className="px-4 py-3"><UserRoleBadge role={user.role} /></td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-xs font-medium",
                    user.is_archived ? "text-gray-400" : "text-green-700"
                  )}>
                    {user.is_archived ? "Archived" : "Active"}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModalUser(user)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => resetMut.mutate(user.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                        title="Reset password"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmArchive(user)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                        title={user.is_archived ? "Unarchive" : "Archive"}
                      >
                        {user.is_archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.count > 25 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.count} total</span>
          <div className="flex gap-2">
            <button
              disabled={!data.previous}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={!data.next}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {modalUser !== null && (
        <UserFormModal
          user={modalUser === "new" ? null : modalUser}
          onClose={() => setModalUser(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["users"] }); setModalUser(null); }}
        />
      )}

      {/* Archive confirm */}
      {confirmArchive && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">
              {confirmArchive.is_archived ? "Unarchive" : "Archive"} user?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {confirmArchive.is_archived
                ? `${confirmArchive.full_name} will be reactivated.`
                : `${confirmArchive.full_name} will be deactivated and cannot log in.`}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmArchive(null)} className="px-4 py-2 text-sm border rounded-md">
                Cancel
              </button>
              <button
                onClick={() => archiveMut.mutate(confirmArchive)}
                className="px-4 py-2 text-sm text-white rounded-md"
                style={{ backgroundColor: confirmArchive.is_archived ? "#3B6D11" : "#dc2626" }}
              >
                {confirmArchive.is_archived ? "Unarchive" : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
