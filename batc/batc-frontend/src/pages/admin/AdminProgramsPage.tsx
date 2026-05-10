import { ProgramsTable } from "@/features/programs/components/ProgramsTable";
import { PageHeader } from "@/components/ui";

export default function AdminProgramsPage() {
  return (
    <div>
      <PageHeader
        title="Programs"
        description="Create and manage agricultural assistance programs."
      />
      <ProgramsTable isAdmin />
    </div>
  );
}
