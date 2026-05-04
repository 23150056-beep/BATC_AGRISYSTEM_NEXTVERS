import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  SUBMITTED:    "bg-[#E6F1FB] text-[#0C447C]",
  UNDER_REVIEW: "bg-[#FAEEDA] text-[#633806]",
  APPROVED:     "bg-[#EAF3DE] text-[#27500A]",
  REJECTED:     "bg-[#FCEBEB] text-[#791F1F]",
  CANCELLED:    "bg-[#F1EFE8] text-[#5F5E5A]",
  FULFILLED:    "bg-[#EAF3DE] text-[#27500A]",
};

export function ApplicationStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", styles[status] ?? "bg-gray-100 text-gray-600")}>
      {status.replace("_", " ")}
    </span>
  );
}
