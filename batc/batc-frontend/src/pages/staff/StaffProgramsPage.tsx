import { ProgramsTable } from "@/features/programs/components/ProgramsTable";
import { PageHeader } from "@/components/ui";

export default function StaffProgramsPage() {
  return (
    <div>
      <PageHeader
        title="Programs"
        description="Browse active agricultural assistance programs."
      />
      <ProgramsTable isAdmin={false} />
    </div>
  );
}
