import { ProgramsGrid } from "@/features/programs/components/ProgramsGrid";
import { PageHeader } from "@/components/ui";

export default function StaffProgramsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Programs"
        description="Browse active agricultural assistance programs."
      />
      <ProgramsGrid isAdmin={false} />
    </div>
  );
}
