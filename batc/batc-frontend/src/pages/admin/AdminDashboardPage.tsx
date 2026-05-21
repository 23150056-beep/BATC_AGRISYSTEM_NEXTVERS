import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, ClipboardList, Truck, AlertTriangle, CheckCircle2, Package,
  ArrowUpRight, ArrowDownRight, ArrowRight, FileCheck, Calendar, Plus,
  type LucideIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { dashboardApi, type WeeklyTrendPoint, type ScheduleEntry, type ActivityEntry } from "@/features/dashboard/api/dashboard.api";
import { announcementsApi } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { Card, CardHeader, CardTitle, Badge, Button, EmptyState, Skeleton, statusTone } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

/* ----------------------------- KPI stat tile ----------------------------- */

const ACCENT: Record<string, string> = {
  green: "bg-[#EAF3DE] text-[#3B6D11]",
  amber: "bg-amber-50  text-amber-700",
  blue:  "bg-[#E6F1FB] text-[#0C447C]",
  navy:  "bg-[#162036]/[0.08] text-[#162036]",
  red:   "bg-red-50    text-red-700",
};

interface StatTileProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: keyof typeof ACCENT;
  trend?: number | null;
  trendLabel?: string;
  to?: string;
}

function StatTile({ label, value, icon: Icon, accent = "green", trend, trendLabel, to }: StatTileProps) {
  const body = (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all group">
      <div className="flex items-center gap-2.5">
        <div className={cn("p-2 rounded-md shrink-0", ACCENT[accent])} aria-hidden="true">
          <Icon size={16} strokeWidth={2} />
        </div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex-1 truncate">{label}</p>
        {to && (
          <ArrowUpRight
            size={12}
            className="text-gray-300 group-hover:text-[var(--color-brand-600)] transition-colors shrink-0"
          />
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-gray-900 leading-none tabular-nums">{value}</p>
        {trend !== undefined && trend !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-semibold",
              trend >= 0 ? "text-emerald-600" : "text-red-600",
            )}
            aria-label={`${trend >= 0 ? "Up" : "Down"} ${Math.abs(trend)} percent ${trendLabel ?? ""}`}
          >
            {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {trendLabel && trend !== null && trend !== undefined && (
        <p className="text-[10px] text-gray-400 mt-1.5">{trendLabel}</p>
      )}
    </div>
  );
  return to ? (
    <Link
      to={to}
      aria-label={`${label}: ${value}. View details.`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/40"
    >
      {body}
    </Link>
  ) : (
    <div role="group" aria-label={`${label}: ${value}`}>{body}</div>
  );
}

/* --------------------------- Attention strip card ------------------------ */

const ATTENTION_PALETTE = {
  amber: { bg: "bg-amber-50",    ring: "ring-amber-200",       icon: "bg-amber-100 text-amber-700",         text: "text-amber-900", body: "text-amber-800/80" },
  red:   { bg: "bg-red-50",      ring: "ring-red-200",         icon: "bg-red-100 text-red-700",             text: "text-red-900",   body: "text-red-800/80" },
  blue:  { bg: "bg-[#E6F1FB]",   ring: "ring-[#0C447C]/20",    icon: "bg-[#cfe1f4] text-[#0C447C]",         text: "text-[#0C447C]", body: "text-[#0C447C]/80" },
  green: { bg: "bg-[#EAF3DE]",   ring: "ring-[#3B6D11]/20",    icon: "bg-[#d9ebbf] text-[#3B6D11]",         text: "text-[#27500A]", body: "text-[#3B6D11]/80" },
} as const;

interface AttentionCardProps {
  tone: keyof typeof ATTENTION_PALETTE;
  icon: LucideIcon;
  count: number | string;
  label: string;
  hint: string;
  cta: string;
  to: string;
}

function AttentionCard({ tone, icon: Icon, count, label, hint, cta, to }: AttentionCardProps) {
  const p = ATTENTION_PALETTE[tone];
  return (
    <Link
      to={to}
      className={cn(
        "rounded-xl p-4 ring-1 ring-inset flex items-center gap-3 transition-all hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2",
        p.bg, p.ring,
      )}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", p.icon)} aria-hidden="true">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className={cn("text-xl font-bold tabular-nums leading-none", p.text)}>{count}</p>
          <p className={cn("text-sm font-semibold truncate", p.text)}>{label}</p>
        </div>
        <p className={cn("text-xs mt-1 truncate", p.body)}>{hint}</p>
      </div>
      <span className={cn("text-xs font-semibold inline-flex items-center gap-0.5 shrink-0", p.text)}>
        {cta} <ArrowRight size={11} strokeWidth={2} />
      </span>
    </Link>
  );
}

/* ---------------------------- Trend mini-chart --------------------------- */

function TrendChart({ trend }: { trend: WeeklyTrendPoint[] }) {
  const max = Math.max(...trend.map((p) => p.count), 1);
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height: 128 }}>
        {trend.map((p, i) => {
          const isLast = i === trend.length - 1;
          const h = Math.round((p.count / max) * 96);
          return (
            <div key={p.week_start} className="flex-1 flex flex-col justify-end items-center gap-1.5">
              <span
                className={cn(
                  "text-[10px] font-semibold tabular-nums",
                  isLast ? "text-[var(--color-brand-600)]" : "text-gray-400",
                )}
              >
                {p.count}
              </span>
              <div
                className="w-full rounded-t transition-colors"
                style={{
                  height: `${Math.max(h, 2)}px`,
                  background: isLast ? "var(--color-brand-600)" : "#cde0a6",
                }}
                title={`${p.week_label}: ${p.count} delivered`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-2">
        {trend.map((p) => (
          <span key={p.week_start} className="flex-1 text-[10px] text-gray-400 text-center font-mono">
            {p.week_label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Today schedule ---------------------------- */

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled", DELIVERED: "Delivered", DELAYED: "Delayed",
  RESCHEDULED: "Rescheduled", OUT_OF_STOCK: "Out of stock", UNAVAILABLE: "Unavailable",
};

function ScheduleList({ items }: { items: ScheduleEntry[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[var(--color-brand-600)]" strokeWidth={2} aria-hidden="true" />
          <CardTitle>Today's distributions</CardTitle>
        </div>
        <Link to="/admin/distribution" className="text-xs font-semibold text-[var(--color-brand-600)] hover:underline inline-flex items-center gap-0.5">
          View schedule <ArrowUpRight size={11} />
        </Link>
      </CardHeader>
      {items.length === 0 ? (
        <EmptyState
          compact
          icon={<Calendar size={18} />}
          title="Nothing scheduled today"
          description="New distributions for today will appear here."
        />
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((s) => (
            <div key={s.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/60">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{s.title}</p>
                <p className="text-xs text-gray-500 truncate">
                  {s.farmer_name}{s.barangay ? ` · ${s.barangay}` : ""}
                </p>
              </div>
              <Badge tone={statusTone(s.status)} dot>{STATUS_LABELS[s.status] ?? s.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------ Activity feed ---------------------------- */

const ACTION_VERB: Record<string, { verb: string; target: string }> = {
  APPLICATION_APPROVED:    { verb: "approved",   target: "Application" },
  APPLICATION_SUBMITTED:   { verb: "submitted",  target: "Application" },
  APPLICATION_REJECTED:    { verb: "rejected",   target: "Application" },
  APPLICATION_CANCELLED:   { verb: "cancelled",  target: "Application" },
  DISTRIBUTION_CREATED:    { verb: "scheduled",  target: "Distribution" },
  DISTRIBUTION_DELIVERED:  { verb: "delivered",  target: "Distribution" },
  DISTRIBUTION_DELAYED:    { verb: "delayed",    target: "Distribution" },
  DISTRIBUTION_OUT_OF_STOCK: { verb: "marked out-of-stock", target: "Distribution" },
};

const TONE_DOT: Record<ActivityEntry["tone"], string> = {
  green: "#2f7d32", blue: "#0c447c", red: "#b42318", navy: "#162036", amber: "#c2682e",
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

function ActivityFeed({ items }: { items: ActivityEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      {items.length === 0 ? (
        <EmptyState
          compact
          title="No activity yet"
          description="Approvals, distributions, and registrations will show here."
        />
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((a) => {
            const verb = ACTION_VERB[a.action] ?? { verb: a.action.toLowerCase().replace(/_/g, " "), target: "" };
            const targetLabel = verb.target && a.target_id ? `${verb.target} #${a.target_id}` : verb.target;
            const initials = a.actor.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "·";
            return (
              <li key={a.id} className="px-5 py-3 flex items-start gap-3">
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold flex items-center justify-center">
                    {initials}
                  </div>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white"
                    style={{ background: TONE_DOT[a.tone] }}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug">
                    <span className="font-semibold text-gray-900">{a.actor}</span>{" "}
                    {verb.verb}{" "}
                    {targetLabel && <span className="font-medium text-gray-900">{targetLabel}</span>}
                    {a.notes && <span className="text-gray-500"> — {a.notes}</span>}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{relativeTime(a.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ---------------------------------- Page --------------------------------- */

export function AdminDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-admin"],
    queryFn: () => dashboardApi.admin(),
    refetchInterval: 60_000,
  });

  const { data: announcements } = useQuery({
    queryKey: ["announcements", "ADMIN"],
    queryFn: () => announcementsApi.list(),
  });

  const today = useMemo(
    () => new Date().toLocaleDateString("en-PH", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }),
    [],
  );

  const greetingName = useMemo(() => {
    const fn = user?.first_name?.trim();
    if (fn) return fn;
    if (user?.username) return user.username;
    return "back";
  }, [user]);

  // Fallback for trend chart while loading
  const trend: WeeklyTrendPoint[] = data?.weekly_delivered_trend ?? [];

  // Attention card hints
  const oldestHint =
    !data?.pending_applications
      ? "All caught up."
      : data.oldest_pending_days <= 0
        ? "All under 24 hours."
        : `Oldest waiting ${data.oldest_pending_days} day${data.oldest_pending_days === 1 ? "" : "s"}.`;

  const lowStockHint = data?.low_stock_items
    ? "Below distribution threshold."
    : "All items stocked above threshold.";

  const nextDistribution = data?.next_distribution;
  const distributionsHint = !data?.distributions_today
    ? "Nothing on today's calendar."
    : nextDistribution
      ? `Next: ${nextDistribution.title}${nextDistribution.barangay ? ` · ${nextDistribution.barangay}` : ""}`
      : `${data.distributions_today} on the schedule.`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brand-600)]">
            Admin · Overview
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight mt-1">
            Welcome back, {greetingName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Calendar size={13} strokeWidth={2} />}
            onClick={() => navigate("/admin/reports")}
          >
            This week
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus size={14} strokeWidth={2.25} />}
            onClick={() => navigate("/admin/announcements")}
          >
            New announcement
          </Button>
        </div>
      </header>

      {/* Needs your attention */}
      <section aria-labelledby="needs-attention">
        <h2 id="needs-attention" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
          Needs your attention
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[78px] rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <AttentionCard
              tone={data?.pending_applications ? "amber" : "green"}
              icon={FileCheck}
              count={data?.pending_applications ?? 0}
              label="pending applications"
              hint={oldestHint}
              cta="Review"
              to="/admin/applications"
            />
            <AttentionCard
              tone={data?.low_stock_items ? "red" : "green"}
              icon={AlertTriangle}
              count={data?.low_stock_items ?? 0}
              label="low-stock items"
              hint={lowStockHint}
              cta="Inventory"
              to="/admin/inventory"
            />
            <AttentionCard
              tone={data?.distributions_today ? "blue" : "green"}
              icon={Truck}
              count={data?.distributions_today ?? 0}
              label="distributions today"
              hint={distributionsHint}
              cta="Schedule"
              to="/admin/distribution"
            />
          </div>
        )}
      </section>

      {/* KPI row */}
      <section aria-labelledby="kpi-row">
        <h2 id="kpi-row" className="sr-only">Key performance indicators</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[96px] rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile
              label="Total Farmers"
              value={(data?.total_farmers ?? 0).toLocaleString()}
              icon={Users}
              accent="green"
              to="/admin/farmers"
            />
            <StatTile
              label="Active Programs"
              value={data?.active_programs ?? 0}
              icon={ClipboardList}
              accent="blue"
              to="/admin/programs"
            />
            <StatTile
              label="Delivered (mo)"
              value={(data?.delivered_this_month ?? 0).toLocaleString()}
              icon={CheckCircle2}
              accent="green"
              trend={data?.delivered_mom_pct ?? null}
              trendLabel="vs. previous 30 days"
            />
            <StatTile
              label="Inventory Items"
              value={(data?.inventory_items ?? 0).toLocaleString()}
              icon={Package}
              accent="navy"
              to="/admin/inventory"
            />
          </div>
        )}
      </section>

      {/* Trend + schedule */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-1">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Distributions per week</CardTitle>
              <p className="text-[11px] text-gray-500 mt-0.5">Last 8 weeks · units delivered</p>
            </div>
            {data?.delivered_mom_pct !== null && data?.delivered_mom_pct !== undefined && (
              <Badge tone={data.delivered_mom_pct >= 0 ? "green" : "red"} dot>
                {data.delivered_mom_pct >= 0 ? "+" : ""}{data.delivered_mom_pct}% MoM
              </Badge>
            )}
          </CardHeader>
          <div className="px-5 py-4">
            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-md" />
            ) : trend.every((p) => p.count === 0) ? (
              <EmptyState
                compact
                title="No deliveries yet"
                description="Weekly delivered totals will appear here once distributions run."
              />
            ) : (
              <TrendChart trend={trend} />
            )}
          </div>
        </Card>

        <div className="xl:col-span-2">
          {isLoading ? (
            <Card><div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}
            </div></Card>
          ) : (
            <ScheduleList items={data?.today_schedule ?? []} />
          )}
        </div>
      </div>

      {/* Activity + announcements */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {isLoading ? (
          <Card><div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}
          </div></Card>
        ) : (
          <ActivityFeed items={data?.recent_activity ?? []} />
        )}

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent announcements</CardTitle>
            <Link
              to="/admin/announcements"
              className="text-xs font-semibold text-[var(--color-brand-600)] hover:underline inline-flex items-center gap-0.5"
            >
              Manage <ArrowUpRight size={11} />
            </Link>
          </CardHeader>
          <div className="p-3 space-y-3">
            {announcements?.results.slice(0, 3).map((a) => (
              <AnnouncementCard key={a.id} announcement={a} showAudience />
            ))}
            {!announcements?.results.length && (
              <EmptyState
                compact
                title="No announcements yet"
                description="Create your first announcement to keep farmers and staff informed."
              />
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
