import { useQuery } from "@tanstack/react-query";
import { farmersApi } from "@/features/farmers/api/farmers.api";
import { format } from "date-fns";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-400 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value ?? "—"}</span>
    </div>
  );
}

export function ClientProfilePage() {
  const { data: farmer, isLoading, isError } = useQuery({
    queryKey: ["farmer-me"],
    queryFn: farmersApi.me,
    retry: false,
  });

  if (isLoading) return <div className="p-6 text-sm text-gray-400">Loading profile…</div>;

  if (isError || !farmer) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">No farmer profile is linked to your account yet.</p>
        <p className="text-xs text-gray-400 mt-1">Please visit your barangay agricultural office to register.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{farmer.full_name}</h2>
        <p className="text-sm text-gray-500">{farmer.barangay}{farmer.sitio ? `, Sitio ${farmer.sitio}` : ""}</p>
        <div className="flex gap-2 mt-2">
          {farmer.is_4ps && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">4Ps</span>}
          {farmer.is_pwd && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">PWD</span>}
          {farmer.is_ip && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">IP</span>}
        </div>
      </div>

      <section className="bg-white rounded-lg border border-gray-200 px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Personal Information</p>
        <Row label="Sex" value={farmer.sex === "M" ? "Male" : "Female"} />
        <Row label="Date of birth" value={farmer.dob ? format(new Date(farmer.dob), "MMMM d, yyyy") : null} />
        <Row label="Civil status" value={farmer.civil_status} />
        <Row label="Mobile" value={farmer.mobile_number} />
        <Row label="RSBSA Ref." value={farmer.rsbsa_reference} />
      </section>

      <section className="bg-white rounded-lg border border-gray-200 px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Farm Information</p>
        <Row label="Livelihood" value={farmer.livelihood_type.replace("_", " ")} />
        <Row label="Total farm area" value={`${farmer.farm_area_ha} ha`} />
        <Row label="Household size" value={farmer.household_size} />
      </section>

      {farmer.parcels.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Farm Parcels</p>
          {farmer.parcels.map((p, i) => (
            <div key={i} className="text-sm text-gray-700 py-2 border-b border-gray-100 last:border-0">
              {p.area_ha} ha — {p.commodity} ({p.land_type.replace("_", " ")}, {p.ownership_type})
            </div>
          ))}
        </section>
      )}

      <p className="text-xs text-gray-400 text-center">
        DPA consent given {farmer.consent_dpa_at ? format(new Date(farmer.consent_dpa_at), "MMM d, yyyy") : ""}
      </p>
    </div>
  );
}
