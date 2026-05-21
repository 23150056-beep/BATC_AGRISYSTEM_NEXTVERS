import { CalendarRange } from "lucide-react";

export interface DateRange {
  from: string; // ISO yyyy-mm-dd
  to: string;
}

interface Props {
  value: DateRange;
  onChange: (next: DateRange) => void;
  /** Reserved for future use; the design intentionally omits preset chips. */
  showPresets?: boolean;
  variant?: "inline" | "card";
  /** Pass true while the consumer is refetching to show a subtle indicator. */
  isFetching?: boolean;
}

/**
 * Inline date-range pill matching the design — but the change commits
 * immediately so users don't have to click an extra "Apply" button. The
 * previous Apply-button flow was confusing: users picked dates but didn't
 * realize they needed to commit, so reports appeared "stuck" on the old
 * window. Native `<input type="date">` only fires onChange when a valid
 * date is selected, so we don't spam the API while typing.
 */
export function DateRangePicker({
  value,
  onChange,
  variant = "inline",
  isFetching = false,
}: Props) {
  function setFrom(from: string) {
    // Guard: if the user picks a from-date after the current to-date, push
    // to-date forward to match so the request stays valid.
    if (from && value.to && from > value.to) {
      onChange({ from, to: from });
    } else {
      onChange({ from, to: value.to });
    }
  }
  function setTo(to: string) {
    if (to && value.from && to < value.from) {
      onChange({ from: to, to });
    } else {
      onChange({ from: value.from, to });
    }
  }

  if (variant === "card") {
    return <CardVariant value={value} onChange={onChange} />;
  }

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-2.5 py-1.5">
      <CalendarRange size={13} className="text-gray-400 shrink-0" aria-hidden="true" />
      <span className="text-[11px] text-gray-400 uppercase tracking-wide shrink-0">Range</span>
      <input
        type="date"
        value={value.from}
        max={value.to || undefined}
        onChange={(e) => setFrom(e.target.value)}
        className="text-xs font-mono outline-none border-0 bg-transparent w-[120px] text-gray-800 cursor-pointer"
        aria-label="From date"
      />
      <span className="text-gray-300" aria-hidden="true">→</span>
      <input
        type="date"
        value={value.to}
        min={value.from || undefined}
        onChange={(e) => setTo(e.target.value)}
        className="text-xs font-mono outline-none border-0 bg-transparent w-[120px] text-gray-800 cursor-pointer"
        aria-label="To date"
      />
      {isFetching && (
        <span
          className="inline-flex items-center gap-1 text-[10px] text-[var(--color-brand-700,#27500A)] ml-1"
          aria-live="polite"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500,#639922)] animate-pulse" />
          Updating
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Older card variant kept for callers that haven't migrated yet.             */
/* -------------------------------------------------------------------------- */

function CardVariant({ value, onChange }: { value: DateRange; onChange: (n: DateRange) => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-end gap-3">
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">From</label>
          <input
            type="date"
            value={value.from}
            max={value.to || undefined}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="px-2 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/30 focus:border-[var(--color-brand-500)]"
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">To</label>
          <input
            type="date"
            value={value.to}
            min={value.from || undefined}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="px-2 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/30 focus:border-[var(--color-brand-500)]"
          />
        </div>
      </div>
    </div>
  );
}
