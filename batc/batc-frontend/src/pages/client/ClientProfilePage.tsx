import { useQuery } from "@tanstack/react-query";
import { farmersApi } from "@/features/farmers/api/farmers.api";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { Card, Skeleton } from "@/components/ui";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-400 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value ?? "—"}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <Card className="px-4 py-1">{children}</Card>
    </section>
  );
}

export function ClientProfilePage() {
  const { data: farmer, isLoading, isError } = useQuery({
    queryKey: ["farmer-me"],
    queryFn: farmersApi.me,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <Card className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-3.5 w-full" />)}
        </Card>
        <Card className="p-4 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-3.5 w-full" />)}
        </Card>
      </div>
    );
  }

  if (isError || !farmer) {
    return (
      <div className="p-4">
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-center">
          <AlertTriangle className="mx-auto text-amber-500 mb-2" size={28} />
          <p className="text-sm font-semibold text-amber-800 mb-1">No farmer profile linked</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Please visit your barangay agricultural office to register as a farmer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Profile header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{farmer.full_name}</h2>
        <p className="text-sm text-gray-500">
          {farmer.barangay}{farmer.sitio ? `, Sitio ${farmer.sitio}` : ""}
        </p>
        {(farmer.is_4ps || farmer.is_pwd || farmer.is_ip) && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {farmer.is_4ps && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">4Ps</span>
            )}
            {farmer.is_pwd && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">PWD</span>
            )}
            {farmer.is_ip && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">IP</span>
            )}
          </div>
        )}
      </div>

      <SectionCard title="Personal Information">
        <Row label="Sex" value={farmer.sex === "M" ? "Male" : "Female"} />
        <Row label="Date of birth" value={farmer.dob ? format(new Date(farmer.dob), "MMMM d, yyyy") : null} />
        <Row label="Civil status" value={farmer.civil_status} />
        <Row label="Mobile" value={farmer.mobile_number} />
        <Row label="RSBSA Ref." value={farmer.rsbsa_reference} />
      </SectionCard>

      <SectionCard title="Farm Information">
        <Row label="Livelihood" value={farmer.livelihood_type.replace("_", " ")} />
        <Row label="Total farm area" value={`${farmer.farm_area_ha} ha`} />
        <Row label="Household size" value={farmer.household_size} />
      </SectionCard>

      {farmer.parcels.length > 0 && (
        <SectionCard title="Farm Parcels">
          {farmer.parcels.map((p, i) => (
            <div key={i} className="text-sm text-gray-700 py-2.5 border-b border-gray-100 last:border-0">
              <span className="font-medium">{p.area_ha} ha</span>
              {" — "}
              {p.commodity}{" "}
              <span className="text-gray-500 text-xs">
                ({p.land_type.replace("_", " ")}, {p.ownership_type})
              </span>
            </div>
          ))}
        </SectionCard>
      )}

      <p className="text-xs text-gray-400 text-center pb-2">
        DPA consent given{" "}
        {farmer.consent_dpa_at ? format(new Date(farmer.consent_dpa_at), "MMM d, yyyy") : ""}
      </p>
    </div>
  );
}
