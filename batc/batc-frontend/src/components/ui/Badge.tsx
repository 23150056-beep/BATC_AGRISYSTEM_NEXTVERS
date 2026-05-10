import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200",
        green:   "bg-[#e6f4e8] text-[#2f7d32] ring-1 ring-inset ring-[#2f7d32]/20",
        amber:   "bg-[#faeeda] text-[#a55522] ring-1 ring-inset ring-[#c2682e]/30",
        red:     "bg-[#fde8e6] text-[#b42318] ring-1 ring-inset ring-[#b42318]/25",
        blue:    "bg-[#e6f1fb] text-[#0c447c] ring-1 ring-inset ring-[#0c447c]/20",
        purple:  "bg-[#f3e8ff] text-[#6b21a8] ring-1 ring-inset ring-[#6b21a8]/20",
        navy:    "bg-[#162036]/8 text-[#162036] ring-1 ring-inset ring-[#162036]/15",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0",
        md: "text-[11px] px-2 py-0.5",
        lg: "text-xs px-2.5 py-1",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ tone, size, className, dot, children }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current opacity-70"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/** Maps a status string to a tone. Useful for mapping API status enums. */
export function statusTone(status?: string): BadgeProps["tone"] {
  if (!status) return "neutral";
  const s = status.toUpperCase();
  if (["APPROVED", "FULFILLED", "DELIVERED", "ACTIVE", "COMPLETED", "PAID", "READY"].includes(s)) return "green";
  if (["PENDING", "SCHEDULED", "IN_REVIEW", "PROCESSING", "DRAFT"].includes(s)) return "amber";
  if (["REJECTED", "DELAYED", "FAILED", "CANCELLED", "OUT_OF_STOCK", "EXPIRED"].includes(s)) return "red";
  if (["LOW_STOCK", "WARNING"].includes(s)) return "amber";
  if (["INFO", "NEW"].includes(s)) return "blue";
  return "neutral";
}
