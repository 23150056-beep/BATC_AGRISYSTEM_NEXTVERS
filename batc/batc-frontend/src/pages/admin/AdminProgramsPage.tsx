import { ProgramsTable } from "@/features/programs/components/ProgramsTable";

export default function AdminProgramsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Programs</h1>
        <p className="text-sm text-gray-500">Create and manage agricultural assistance programs.</p>
      </div>
      <ProgramsTable isAdmin />
    </div>
  );
}
