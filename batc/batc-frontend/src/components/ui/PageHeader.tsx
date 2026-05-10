import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Optional content below the title row (e.g. tabs, filters). */
  children?: ReactNode;
  className?: string;
}

/**
 * Consistent page header used at the top of every authenticated page.
 *
 *     <PageHeader
 *       title="Farmers"
 *       description="Registered farmer profiles in Bauang."
 *       actions={<Button>Register Farmer</Button>}
 *     />
 */
export function PageHeader({ title, description, actions, children, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 leading-tight">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
