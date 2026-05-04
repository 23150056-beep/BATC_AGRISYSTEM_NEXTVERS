import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  DRAFT:     "bg-[#F1EFE8] text-[#5F5E5A]",
  ACTIVE:    "bg-[#EAF3DE] text-[#27500A]",
  SUSPENDED: "bg-[#FAEEDA] text-[#633806]",
  COMPLETED: "bg-[#E6F1FB] text-[#0C447C]",
};

export function ProgramStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", styles[status] ?? styles.DRAFT)}>
      {status}
    </span>
  );
}
