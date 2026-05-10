import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Building-block skeleton — wrap with your own layout to match the actual
 * content shape. Always reserve space to avoid layout shift (CLS).
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-pulse rounded-md bg-gray-200/70",
        className
      )}
      {...props}
    />
  );
}

/** Pre-shaped skeleton row that mimics a list item with avatar + two text lines. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton className="w-9 h-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2.5 w-1/5" />
      </div>
    </div>
  );
}

/** Skeleton for stat-card style tile. */
export function SkeletonStat() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
      <Skeleton className="w-11 h-11 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/** Skeleton table rows for use inside an existing <tbody>. */
export function SkeletonTableRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-gray-100">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className="h-3 w-full max-w-[12rem]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
