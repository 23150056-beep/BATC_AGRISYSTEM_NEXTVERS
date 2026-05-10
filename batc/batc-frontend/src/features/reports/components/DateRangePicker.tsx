import { Calendar } from "lucide-react";

export interface DateRange {
  from: string; // ISO yyyy-mm-dd
  to: string;
}

interface Props {
  value: DateRange;
  onChange: (next: DateRange) => void;
  /** Show preset buttons (Last 7 / 30 / 90 days, This year). */
  showPresets?: boolean;
}

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function preset(days: number): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days + 1);
  return { from: toIso(from), to: toIso(to) };
}

function thisYear(): DateRange {
  const now = new Date();
  return {
    from: toIso(new Date(now.getFullYear(), 0, 1)),
    to:   toIso(now),
  };
}

export function DateRangePicker({ value, onChange, showPresets = true }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}
          aria-hidden="true"
        >
          <Calendar size={14} />
        </div>
        <div>
          <p className="text-[11px] font-medium text-gray-600 leading-none">Date range</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-none">
            Filters all reports below
          </p>
        </div>
      </div>

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

      {showPresets && (
        <div className="flex flex-wrap gap-1.5 ml-auto">
          {([
            { label: "7d",   range: preset(7) },
            { label: "30d",  range: preset(30) },
            { label: "90d",  range: preset(90) },
            { label: "YTD",  range: thisYear() },
          ] as const).map((p) => {
            const active = value.from === p.range.from && value.to === p.range.to;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange(p.range)}
                aria-pressed={active}
                className={
                  "px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors " +
                  (active
                    ? "bg-[var(--color-brand-600)] text-white border-[var(--color-brand-600)]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50")
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
