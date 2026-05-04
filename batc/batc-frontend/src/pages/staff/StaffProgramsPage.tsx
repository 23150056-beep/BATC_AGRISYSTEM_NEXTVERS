import { ProgramsTable } from "@/features/programs/components/ProgramsTable";

export default function StaffProgramsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Programs</h1>
        <p className="text-sm text-gray-500">Browse active agricultural assistance programs.</p>
      </div>
      <ProgramsTable isAdmin={false} />
    </div>
  );
}
