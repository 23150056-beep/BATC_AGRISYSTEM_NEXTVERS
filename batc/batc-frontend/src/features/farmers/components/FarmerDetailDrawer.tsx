import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { farmersApi } from "../api/farmers.api";
import { WizardShell } from "./FarmerWizard/WizardShell";
import { useState } from "react";
import { format } from "date-fns";

interface Props {
  farmerId: number;
  isAdmin: boolean;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-xs text-gray-800 font-medium">{value ?? "—"}</span>
    </div>
  );
}

export function FarmerDetailDrawer({ farmerId, isAdmin, onClose }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: farmer, isLoading } = useQuery({
    queryKey: ["farmer", farmerId],
    queryFn: () => farmersApi.retrieve(farmerId),
  });

  const archiveMut = useMutation({
    mutationFn: () => farmer!.is_archived ? farmersApi.unarchive(farmerId) : farmersApi.archive(farmerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmers"] });
      qc.invalidateQueries({ queryKey: ["farmer", farmerId] });
      toast.success(farmer!.is_archived ? "Farmer unarchived." : "Farmer archived.");
    },
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Farmer Profile</h2>
          <div className="flex items-center gap-2">
            {isAdmin && farmer && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-[#3B6D11] rounded"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => archiveMut.mutate()}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  title={farmer.is_archived ? "Unarchive" : "Archive"}
                >
                  {farmer.is_archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
          {farmer && (
            <>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{farmer.full_name}</h3>
                <p className="text-sm text-gray-500">{farmer.barangay}{farmer.sitio ? `, ${farmer.sitio}` : ""}</p>
                {farmer.is_archived && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">Archived</span>
                )}
              </div>

              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Personal</p>
                <Row label="Sex" value={farmer.sex === "M" ? "Male" : "Female"} />
                <Row label="Date of birth" value={farmer.dob ? format(new Date(farmer.dob), "MMM d, yyyy") : null} />
                <Row label="Civil status" value={farmer.civil_status} />
                <Row label="Education" value={farmer.highest_education?.replace("_", " ")} />
                <Row label="Mobile" value={farmer.mobile_number} />
                <Row label="RSBSA Ref." value={farmer.rsbsa_reference} />
              </section>

              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Special Categories</p>
                <div className="flex gap-2">
                  {farmer.is_4ps && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">4Ps</span>}
                  {farmer.is_pwd && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">PWD</span>}
                  {farmer.is_ip && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">IP</span>}
                  {!farmer.is_4ps && !farmer.is_pwd && !farmer.is_ip && <span className="text-xs text-gray-400">None</span>}
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Farm</p>
                <Row label="Livelihood" value={farmer.livelihood_type.replace("_", " ")} />
                <Row label="Total area" value={`${farmer.farm_area_ha} ha`} />
                <Row label="Household size" value={farmer.household_size} />
              </section>

              {farmer.parcels.length > 0 && (
                <section>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Farm Parcels</p>
                  {farmer.parcels.map((p, i) => (
                    <div key={i} className="text-xs text-gray-700 py-1.5 border-b border-gray-100 last:border-0">
                      {p.area_ha} ha · {p.commodity} · {p.land_type.replace("_", " ")} · {p.ownership_type}
                    </div>
                  ))}
                </section>
              )}

              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">DPA & Meta</p>
                <Row label="DPA Consent" value={farmer.consent_dpa ? `Yes — ${farmer.consent_dpa_at ? format(new Date(farmer.consent_dpa_at), "MMM d, yyyy HH:mm") : ""}` : "No"} />
                <Row label="Encoded by" value={farmer.encoded_by_name} />
                <Row label="Registered" value={format(new Date(farmer.created_at), "MMM d, yyyy")} />
              </section>
            </>
          )}
        </div>
      </aside>

      {editing && farmer && (
        <WizardShell
          editFarmer={{
            id: farmer.id,
            first_name: farmer.first_name,
            middle_name: farmer.middle_name,
            last_name: farmer.last_name,
            suffix: farmer.suffix,
            sex: farmer.sex as any,
            dob: farmer.dob,
            civil_status: farmer.civil_status as any,
            highest_education: farmer.highest_education as any,
            mobile_number: farmer.mobile_number,
            is_4ps: farmer.is_4ps,
            is_pwd: farmer.is_pwd,
            is_ip: farmer.is_ip,
            rsbsa_reference: farmer.rsbsa_reference ?? undefined,
            barangay: farmer.barangay,
            sitio: farmer.sitio,
            livelihood_type: farmer.livelihood_type as any,
            farm_area_ha: farmer.farm_area_ha,
            household_size: farmer.household_size,
            consent_dpa: true,
            linked_user_id: (farmer as any).linked_user_id ?? null,
            parcels: farmer.parcels.map((p) => ({
              area_ha: p.area_ha,
              commodity: p.commodity,
              land_type: p.land_type as any,
              ownership_type: p.ownership_type as any,
            })),
          }}
          onClose={() => {
            setEditing(false);
            qc.invalidateQueries({ queryKey: ["farmer", farmerId] });
          }}
        />
      )}
    </>
  );
}
