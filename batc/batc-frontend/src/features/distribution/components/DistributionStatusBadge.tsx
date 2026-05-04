import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  SCHEDULED:    "bg-[#E6F1FB] text-[#0C447C]",
  DELIVERED:    "bg-[#EAF3DE] text-[#27500A]",
  DELAYED:      "bg-[#FAEEDA] text-[#633806]",
  RESCHEDULED:  "bg-[#F1EFE8] text-[#444441]",
  OUT_OF_STOCK: "bg-[#FCEBEB] text-[#791F1F]",
  UNAVAILABLE:  "bg-[#FCEBEB] text-[#791F1F]",
};

export function DistributionStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", styles[status] ?? "bg-gray-100 text-gray-600")}>
      {status.replace("_", " ")}
    </span>
  );
}
