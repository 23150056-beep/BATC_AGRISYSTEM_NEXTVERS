import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sprout } from "lucide-react";
import { programsApi } from "@/features/programs/api/programs.api";
import { applicationsApi } from "@/features/applications/api/applications.api";
import { farmersApi } from "@/features/farmers/api/farmers.api";
import { ProgramStatusBadge } from "@/features/programs/components/ProgramStatusBadge";
import { MissingFarmerNotice } from "@/features/farmers/components/MissingFarmerNotice";
import { Button, Card, EmptyState, Skeleton } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/errors";

export function ClientProgramsPage() {
  const qc = useQueryClient();

  const { data: myFarmer, isLoading: farmerLoading, isError: farmerError } = useQuery({
    queryKey: ["farmer-me"],
    queryFn: () => farmersApi.me(),
    retry: false,
  });

  const { data: programs, isLoading } = useQuery({
    queryKey: ["programs", { status: "ACTIVE", eligible_for_me: true }],
    queryFn: () => programsApi.list({ status: "ACTIVE", eligible_for_me: "true" }),
    enabled: !!myFarmer,
  });

  const { data: myApps } = useQuery({
    queryKey: ["applications-mine"],
    queryFn: () => applicationsApi.mine(),
    enabled: !!myFarmer,
  });

  const applyMut = useMutation({
    mutationFn: (programId: number) =>
      applicationsApi.create({ farmer: myFarmer!.id, program: programId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications-mine"] });
      toast.success("Application submitted.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Application failed.")),
  });

  const appliedIds = new Set(myApps?.map((a) => a.program));

  if (farmerLoading) {
    return (
      <div className="p-4 md:p-0 space-y-3">
        <Skeleton className="h-4 w-36 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full mt-2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (farmerError || !myFarmer) {
    return (
      <div className="p-4 md:p-0 space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brand-600)]">Programs</p>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mt-1">Active Programs</h2>
        </div>
        <MissingFarmerNotice
          description="Once your barangay encoder links your profile, eligible programs will appear here automatically."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-0 space-y-3">
        <Skeleton className="h-4 w-36 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full mt-2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0 space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brand-600)]">Programs</p>
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mt-1">Active Programs</h2>
        <p className="text-sm text-gray-500 mt-0.5">Programs you're eligible to apply for.</p>
      </div>

      {!programs?.results.length ? (
        <Card>
          <EmptyState
            compact
            icon={<Sprout size={20} />}
            title="No eligible programs right now"
            description="New programs are added regularly — check back soon."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {programs.results.map((program) => {
            const applied = appliedIds.has(program.id);
            return (
              <Card key={program.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{program.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{program.code}</p>
                    {program.source_agency && (
                      <p className="text-xs text-gray-500 mt-0.5">{program.source_agency}</p>
                    )}
                  </div>
                  <ProgramStatusBadge status={program.status} />
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {program.start_date} – {program.end_date}
                </p>
                <Button
                  block
                  disabled={applied || applyMut.isPending}
                  loading={applyMut.isPending}
                  variant={applied ? "secondary" : "primary"}
                  onClick={() => !applied && applyMut.mutate(program.id)}
                >
                  {applied ? "Applied ✓" : "Apply Now"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
