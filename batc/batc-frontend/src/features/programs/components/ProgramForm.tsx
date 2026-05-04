import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import { programsApi, type Program } from "../api/programs.api";
import { inventoryApi } from "@/features/inventory/api/inventory.api";
import { cn } from "@/lib/utils";

const BAUANG_BARANGAYS = [
  "Baccuit Norte","Baccuit Sur","Bagbag","Ballay","Bella Union","Bili","Bungro",
  "Cabaroan (Poro)","Calumbaya","Carmay","Casilagan","Central East (Poblacion)",
  "Central West (Poblacion)","Dili","Disso-or","Guerrero","Lasip","Lingsat",
  "Mabanbanag","Maoasoas","Pagdalagan Norte","Pagdalagan Sur","Palina East",
  "Palina West","Penroad (Sao-it)","Piayong","Picinan","Pindangan East",
  "Pindangan West","Quintarong","Rabon","Ramot","San Agustin (Pugo)","San Felipe",
  "San Isidro (Baraoas)","San Juan","San Luis","Santa Monica","Sapilang",
];

const schema = z.object({
  name: z.string().min(1, "Required"),
  code: z.string().min(1, "Required").max(30),
  source_agency: z.string().optional(),
  start_date: z.string().min(1, "Required"),
  end_date: z.string().min(1, "Required"),
  target_barangays: z.array(z.string()).default([]),
  items: z.array(z.object({
    inventory_item: z.coerce.number().min(1, "Select an item"),
    qty_per_beneficiary: z.string().min(1, "Required"),
    max_per_farmer: z.string().optional(),
  })).default([]),
  criteria: z.array(z.object({
    field: z.string().min(1, "Required"),
    operator: z.string().min(1, "Required"),
    value: z.string().default(""),
    fail_message: z.string().optional().default(""),
  })).default([]),
});

type FormValues = z.infer<typeof schema>;

const CRITERION_FIELDS = [
  { value: "livelihood_type", label: "Livelihood Type", ops: ["eq"] },
  { value: "is_4ps", label: "4Ps Beneficiary", ops: ["is_true"] },
  { value: "is_pwd", label: "PWD", ops: ["is_true"] },
  { value: "is_ip", label: "Indigenous People", ops: ["is_true"] },
  { value: "farm_area_ha", label: "Farm Area (ha)", ops: ["gte", "lte"] },
  { value: "household_size", label: "Household Size", ops: ["gte", "lte", "eq"] },
];

const LIVELIHOOD_OPTIONS = ["RICE","CORN","VEGETABLE","FRUIT","LIVESTOCK","POULTRY","FISHERY","OTHER"];

const inputCls = (err?: string) =>
  cn("w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]",
    err ? "border-red-400" : "border-gray-300");

interface Props {
  program?: Program;
  onClose: () => void;
}

export function ProgramForm({ program, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!program;

  const { data: itemsData } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: () => inventoryApi.listItems(),
  });
  const inventoryItems = itemsData?.results ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { target_barangays: [], items: [], criteria: [] },
  });

  useEffect(() => {
    if (program) {
      setValue("name", program.name);
      setValue("code", program.code);
      setValue("source_agency", program.source_agency);
      setValue("start_date", program.start_date);
      setValue("end_date", program.end_date);
      setValue("target_barangays", program.target_barangays);
      setValue("items", (program.items ?? []).map((i) => ({
        inventory_item: i.inventory_item,
        qty_per_beneficiary: i.qty_per_beneficiary,
        max_per_farmer: i.max_per_farmer ?? "",
      })));
      setValue("criteria", (program.criteria ?? []).map((c) => ({
        field: c.field, operator: c.operator, value: c.value, fail_message: c.fail_message,
      })));
    }
  }, [program, setValue]);

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: "items" });
  const { fields: criteriaFields, append: appendCriterion, remove: removeCriterion } = useFieldArray({ control, name: "criteria" });

  const watchedBarangays = watch("target_barangays");
  const watchedCriteria = watch("criteria");

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? programsApi.update(program!.id, values)
        : programsApi.create(values as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["programs"] });
      toast.success(isEdit ? "Program updated." : "Program created.");
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.code?.[0] ?? err?.response?.data?.detail ?? "Save failed.";
      toast.error(msg);
    },
  });

  function toggleBarangay(b: string) {
    const current = watchedBarangays ?? [];
    setValue("target_barangays", current.includes(b) ? current.filter((x) => x !== b) : [...current, b]);
  }

  function getCriterionOps(fieldName: string) {
    return CRITERION_FIELDS.find((f) => f.value === fieldName)?.ops ?? ["eq", "gte", "lte", "is_true"];
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{isEdit ? "Edit Program" : "Create Program"}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">

            {/* Basic fields */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program name *</label>
                  <input {...register("name")} className={inputCls(errors.name?.message)} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input {...register("code")} placeholder="e.g. RSA-2026-Q1" className={inputCls(errors.code?.message)} />
                  {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source agency</label>
                  <input {...register("source_agency")} placeholder="e.g. DA Region I" className={inputCls()} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start date *</label>
                    <input type="date" {...register("start_date")} className={inputCls(errors.start_date?.message)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End date *</label>
                    <input type="date" {...register("end_date")} className={inputCls(errors.end_date?.message)} />
                  </div>
                </div>
              </div>
            </section>

            {/* Target barangays */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Target Barangays
                </h3>
                <span className="text-xs text-gray-400">
                  {(watchedBarangays ?? []).length === 0 ? "All barangays" : `${(watchedBarangays ?? []).length} selected`}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto border border-gray-200 rounded-md p-2">
                {BAUANG_BARANGAYS.map((b) => (
                  <label key={b} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={(watchedBarangays ?? []).includes(b)}
                      onChange={() => toggleBarangay(b)}
                      className="rounded border-gray-300 text-[#3B6D11]"
                    />
                    {b}
                  </label>
                ))}
              </div>
            </section>

            {/* Program items */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Program Items</h3>
                <button type="button" onClick={() => appendItem({ inventory_item: 0, qty_per_beneficiary: "", max_per_farmer: "" })}
                  className="flex items-center gap-1 text-xs text-[#3B6D11] hover:text-[#639922]">
                  <Plus size={13} /> Add item
                </button>
              </div>
              {itemFields.length === 0 && <p className="text-xs text-gray-400 italic">No items added.</p>}
              <div className="space-y-2">
                {itemFields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-7 gap-2 items-center p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="col-span-3">
                      <select {...register(`items.${idx}.inventory_item`)} className={inputCls()}>
                        <option value={0}>Select item…</option>
                        {inventoryItems.map((i) => (
                          <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input {...register(`items.${idx}.qty_per_beneficiary`)} placeholder="Qty / beneficiary" type="number" step="0.01" className={inputCls()} />
                    </div>
                    <div className="col-span-1">
                      <input {...register(`items.${idx}.max_per_farmer`)} placeholder="Max" type="number" step="0.01" className={inputCls()} />
                    </div>
                    <button type="button" onClick={() => removeItem(idx)} className="flex justify-center text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Eligibility criteria */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Eligibility Criteria</h3>
                <button type="button" onClick={() => appendCriterion({ field: "livelihood_type", operator: "eq", value: "", fail_message: "" })}
                  className="flex items-center gap-1 text-xs text-[#3B6D11] hover:text-[#639922]">
                  <Plus size={13} /> Add criterion
                </button>
              </div>
              {criteriaFields.length === 0 && <p className="text-xs text-gray-400 italic">No criteria — all farmers in target barangays are eligible.</p>}
              <div className="space-y-2">
                {criteriaFields.map((field, idx) => {
                  const selectedField = watchedCriteria?.[idx]?.field ?? "";
                  const selectedOp = watchedCriteria?.[idx]?.operator ?? "";
                  const ops = getCriterionOps(selectedField);
                  const needsValue = selectedOp !== "is_true";
                  const isLivelihood = selectedField === "livelihood_type";
                  return (
                    <div key={field.id} className="grid grid-cols-8 gap-2 items-center p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="col-span-2">
                        <select {...register(`criteria.${idx}.field`)} className={inputCls()}>
                          {CRITERION_FIELDS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <select {...register(`criteria.${idx}.operator`)} className={inputCls()}>
                          {ops.map((op) => (
                            <option key={op} value={op}>{op}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        {needsValue && (
                          isLivelihood ? (
                            <select {...register(`criteria.${idx}.value`)} className={inputCls()}>
                              {LIVELIHOOD_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                            </select>
                          ) : (
                            <input {...register(`criteria.${idx}.value`)} placeholder="Value" className={inputCls()} />
                          )
                        )}
                      </div>
                      <div className="col-span-1">
                        <input {...register(`criteria.${idx}.fail_message`)} placeholder="Fail msg" className={inputCls()} />
                      </div>
                      <button type="button" onClick={() => removeCriterion(idx)} className="flex justify-center text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-md">Cancel</button>
            <button type="submit" disabled={mutation.isPending}
              className="px-5 py-2 text-sm text-white rounded-md disabled:opacity-60"
              style={{ backgroundColor: "#3B6D11" }}>
              {mutation.isPending ? "Saving…" : isEdit ? "Update" : "Create Program"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
