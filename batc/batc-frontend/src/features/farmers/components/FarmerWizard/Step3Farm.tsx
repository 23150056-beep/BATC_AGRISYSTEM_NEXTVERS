import { useFieldArray } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { usersApi } from "@/features/users/api/users.api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props {
  form: any;
  /** When true: hides the linked-user dropdown and uses first-person DPA text. */
  isSelfRegistration?: boolean;
}

const inputCls = (err?: string) =>
  cn("w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]",
    err ? "border-red-400" : "border-gray-300");

export function Step3Farm({ form, isSelfRegistration = false }: Props) {
  const { register, control, formState: { errors }, watch } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "parcels" });

  // When editing, the form may already have a linked_user_id — include it in the
  // query so the current account always appears in the dropdown even though it's
  // already linked (available_for_link only returns unlinked accounts otherwise).
  const currentLinkedUserId = watch("linked_user_id");
  const queryParams: Record<string, string> = { available_for_link: "true" };
  if (currentLinkedUserId) queryParams.include_user_id = String(currentLinkedUserId);

  const { data: availableUsers } = useQuery({
    queryKey: ["users", queryParams],
    queryFn: () => usersApi.list(queryParams),
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary livelihood *</label>
          <select {...register("livelihood_type")} className={inputCls()}>
            <option value="RICE">Rice Farming</option>
            <option value="CORN">Corn Farming</option>
            <option value="VEGETABLE">Vegetable Farming</option>
            <option value="FRUIT">Fruit Farming</option>
            <option value="LIVESTOCK">Livestock</option>
            <option value="POULTRY">Poultry</option>
            <option value="FISHERY">Fishery</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total farm area (ha) *</label>
          <input type="number" step="0.0001" {...register("farm_area_ha")} className={inputCls(errors.farm_area_ha?.message)} />
          {errors.farm_area_ha && <p className="text-xs text-red-500 mt-1">{errors.farm_area_ha.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Household size *</label>
          <input type="number" min={1} {...register("household_size")} className={inputCls(errors.household_size?.message)} />
          {errors.household_size && <p className="text-xs text-red-500 mt-1">{errors.household_size.message}</p>}
        </div>
      </div>

      {/* Farm parcels */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Farm Parcels</p>
          <button
            type="button"
            onClick={() => append({ area_ha: "", commodity: "", land_type: "IRRIGATED", ownership_type: "OWNED" })}
            className="flex items-center gap-1 text-xs text-[#3B6D11] hover:text-[#639922]"
          >
            <Plus size={13} /> Add parcel
          </button>
        </div>
        {fields.length === 0 && (
          <p className="text-xs text-gray-400 italic">No parcels added. Click "Add parcel" above.</p>
        )}
        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-5 gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Area (ha)</label>
                <input type="number" step="0.0001" {...register(`parcels.${idx}.area_ha`)} className={inputCls()} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Commodity</label>
                <input {...register(`parcels.${idx}.commodity`)} placeholder="e.g. Rice" className={inputCls()} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Land type</label>
                <select {...register(`parcels.${idx}.land_type`)} className={inputCls()}>
                  <option value="IRRIGATED">Irrigated</option>
                  <option value="RAINFED_UPLAND">Rainfed Upland</option>
                  <option value="RAINFED_LOWLAND">Rainfed Lowland</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ownership</label>
                <select {...register(`parcels.${idx}.ownership_type`)} className={inputCls()}>
                  <option value="OWNED">Owned</option>
                  <option value="TENANT">Tenant</option>
                  <option value="LESSEE">Lessee</option>
                  <option value="CARETAKER">Caretaker</option>
                </select>
              </div>
              <div className="flex items-end justify-center pb-0.5">
                <button type="button" onClick={() => remove(idx)} className="text-gray-400 hover:text-red-500 p-1">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Linked Login Account (optional) — hidden for self-registration */}
      {!isSelfRegistration && (
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-800 mb-1">Link to login account (optional)</p>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Associate this farmer with an existing Farmer account so they can log in and view their applications, claims, and feedback.
            Leave blank if the farmer doesn't need portal access.
          </p>
          <select
            {...register("linked_user_id", {
              setValueAs: (v: unknown) => (v === "" || v == null ? null : Number(v)),
            })}
            className={inputCls()}
            defaultValue=""
          >
            <option value="">— No login account —</option>
            {availableUsers?.results.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} {u.full_name ? `(${u.full_name})` : ""}
              </option>
            ))}
          </select>
          {!availableUsers?.results.length && (
            <p className="text-xs text-amber-600 mt-2">
              No unlinked Farmer accounts available. Create one in the Users page first if you want to link this farmer.
            </p>
          )}
        </div>
      )}

      {/* DPA Consent */}
      <div className="border border-amber-200 bg-amber-50 rounded-md p-4">
        <p className="text-sm font-medium text-gray-800 mb-2">Data Privacy Act Consent</p>
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">
          {isSelfRegistration
            ? "By checking this box, you consent to the collection and processing of your personal data by the Bauang Agricultural Trade Center pursuant to Republic Act No. 10173 (Data Privacy Act of 2012). Your data will be used solely for agricultural program administration and distribution management."
            : "By checking this box, the farmer consents to the collection and processing of their personal data by the Bauang Agricultural Trade Center pursuant to Republic Act No. 10173 (Data Privacy Act of 2012). Data will be used solely for agricultural program administration and distribution management."}
        </p>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register("consent_dpa")}
            className="mt-0.5 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">
            {isSelfRegistration
              ? "I voluntarily consent to the collection and use of my personal data for agricultural program administration. *"
              : "I confirm that the farmer has given voluntary, informed consent to the collection and use of their personal data. *"}
          </span>
        </label>
        {errors.consent_dpa && (
          <p className="text-xs text-red-500 mt-2">{errors.consent_dpa.message}</p>
        )}
      </div>
    </div>
  );
}
