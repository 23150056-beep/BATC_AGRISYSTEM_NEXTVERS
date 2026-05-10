import { type ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Compact variant — for inline empty cells in tables, sidebars, etc. */
  compact?: boolean;
}

/**
 * A meaningful empty state with icon, title, description and optional action.
 * Use this in lists, tables, search results — anywhere you'd otherwise show
 * "No data" or generic italic gray text.
 */
export function EmptyState({
  icon,
  title = "Nothing here yet",
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-14 px-6",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full flex items-center justify-center mb-3",
          compact ? "w-10 h-10" : "w-14 h-14",
          "bg-[var(--color-brand-100)] text-[var(--color-brand-600)]"
        )}
        aria-hidden="true"
      >
        {icon ?? <Inbox size={compact ? 18 : 24} />}
      </div>
      <p className={cn("font-semibold text-gray-900", compact ? "text-sm" : "text-base")}>
        {title}
      </p>
      {description && (
        <p className={cn("text-gray-500 mt-1 max-w-sm", compact ? "text-xs" : "text-sm")}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
