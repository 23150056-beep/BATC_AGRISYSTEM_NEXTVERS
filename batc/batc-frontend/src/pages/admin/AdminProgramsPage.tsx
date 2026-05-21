import { ProgramsGrid } from "@/features/programs/components/ProgramsGrid";
import { PageHeader } from "@/components/ui";

export default function AdminProgramsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Programs"
        description="Create and manage agricultural assistance programs."
      />
      <ProgramsGrid isAdmin />
    </div>
  );
}
