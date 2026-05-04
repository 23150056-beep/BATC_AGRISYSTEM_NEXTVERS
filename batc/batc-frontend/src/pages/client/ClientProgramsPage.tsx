import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { programsApi } from "@/features/programs/api/programs.api";
import { applicationsApi } from "@/features/applications/api/applications.api";
import { farmersApi } from "@/features/farmers/api/farmers.api";
import { ProgramStatusBadge } from "@/features/programs/components/ProgramStatusBadge";

export function ClientProgramsPage() {
  const qc = useQueryClient();

  const { data: myFarmer, isLoading: farmerLoading, isError: farmerError } = useQuery({
    queryKey: ["farmer-me"],
    queryFn: () => farmersApi.me(),
    retry: false,  // a 404 here means "no profile linked" — not transient
  });

  const { data: programs, isLoading } = useQuery({
    queryKey: ["programs", { status: "ACTIVE", eligible_for_me: true }],
    queryFn: () => programsApi.list({ status: "ACTIVE", eligible_for_me: "true" }),
    enabled: !!myFarmer,  // don't fetch programs until we know there's a farmer profile
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
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Application failed."),
  });

  const appliedIds = new Set(myApps?.map((a) => a.program));

  if (farmerLoading) return <div className="p-4 text-gray-400">Loading…</div>;

  // No farmer profile linked — surface the actual reason instead of an empty list (Finding #29)
  if (farmerError || !myFarmer) {
    return (
      <div className="p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Active Programs</h2>
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-center">
          <p className="text-sm font-semibold text-amber-800 mb-1">Your account is not linked to a farmer profile yet</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Visit your barangay encoder or BATC office to complete your farmer registration.
            Once linked, eligible programs will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-4 text-gray-400">Loading programs…</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Active Programs</h2>
      {programs?.results.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No programs match your eligibility right now. Check back later — new programs are added regularly.
        </p>
      )}
      {programs?.results.map((program) => {
        const applied = appliedIds.has(program.id);
        return (
          <div key={program.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{program.name}</h3>
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
            <button
              disabled={applied || !myFarmer || applyMut.isPending}
              onClick={() => applyMut.mutate(program.id)}
              className="w-full py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{ backgroundColor: applied ? "#639922" : "#3B6D11" }}>
              {applied ? "Applied" : "Apply Now"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
