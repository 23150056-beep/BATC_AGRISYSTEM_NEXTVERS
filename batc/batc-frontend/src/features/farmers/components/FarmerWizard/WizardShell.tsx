import { useState, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { farmerSchema, type FarmerFormValues } from "../../schemas/farmerSchema";
import { farmersApi } from "../../api/farmers.api";
import { Step1Personal } from "./Step1Personal";
import { Step2Address } from "./Step2Address";
import { Step3Farm } from "./Step3Farm";
import { cn } from "@/lib/utils";

const STEPS = ["Personal Info", "Address & RSBSA", "Farm & Consent"];

// Fields that belong to each step — for per-step validation triggering
const STEP_FIELDS: Array<(keyof FarmerFormValues)[]> = [
  ["first_name", "last_name", "sex", "dob", "civil_status", "mobile_number"],
  ["barangay"],
  ["farm_area_ha", "household_size", "consent_dpa"],
];

interface Props {
  onClose: () => void;
  editFarmer?: { id: number } & Partial<FarmerFormValues>;
}

export function WizardShell({ onClose, editFarmer }: Props) {
  const [step, setStep] = useState(0);
  const [justNavigated, setJustNavigated] = useState(false);
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cast the Zod v4 resolver to the output type — zodResolver v5 uses the
  // Zod input type internally but the validated result is always the output type.
  const form = useForm<FarmerFormValues>({
    resolver: zodResolver(farmerSchema) as unknown as Resolver<FarmerFormValues>,
    defaultValues: editFarmer ?? {
      highest_education: "ELEMENTARY",
      livelihood_type: "RICE",
      is_4ps: false, is_pwd: false, is_ip: false,
      household_size: 1,
      parcels: [],
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FarmerFormValues) =>
      editFarmer
        ? farmersApi.update(editFarmer.id, { ...values, farm_area_ha: values.farm_area_ha })
        : farmersApi.create({ ...values, farm_area_ha: values.farm_area_ha }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmers"] });
      toast.success(editFarmer ? "Farmer record updated." : "Farmer registered successfully.");
      onClose();
    },
    onError: (err: any) => {
      // Always log full error for debugging
      console.error("Farmer save error:", err?.response?.status, err?.response?.data);

      const data = err?.response?.data;

      if (!data) { toast.error("Network error. Please try again."); return; }

      // If the backend returned a plain string
      if (typeof data === "string") {
        // Strip HTML tags (Django debug pages)
        const clean = data.replace(/<[^>]+>/g, " ").trim().slice(0, 200);
        toast.error(clean || "Server error. Please try again.");
        return;
      }

      // Standard DRF field errors — check known fields first
      const fieldOrder = [
        "linked_user_id", "mobile_number", "rsbsa_reference", "consent_dpa",
        "first_name", "last_name", "dob", "barangay", "farm_area_ha", "household_size",
      ];
      for (const field of fieldOrder) {
        const val = data[field];
        if (val) {
          const msg = Array.isArray(val) ? val[0] : val;
          toast.error(`${field.replace(/_/g, " ")}: ${msg}`);
          return;
        }
      }

      if (data?.detail) { toast.error(data.detail); return; }
      if (data?.non_field_errors) { toast.error(Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors); return; }

      // Show first key-value pair from any remaining object
      if (typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const val = data[firstKey];
          const msg = Array.isArray(val) ? val[0] : (typeof val === "string" ? val : JSON.stringify(val));
          toast.error(`${firstKey.replace(/_/g, " ")}: ${msg}`);
          return;
        }
      }

      toast.error("Failed to save. Please check all fields and try again.");
    },
  });

  async function handleNext() {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) {
      setJustNavigated(true);
      setStep((s) => s + 1);
      // Re-enable submit after 400ms — long enough to absorb a double-click
      setTimeout(() => setJustNavigated(false), 400);
    }
  }

  function handleBack() {
    setStep((s) => s - 1);
  }

  function onSubmit(values: FarmerFormValues) {
    mutation.mutate(values);
  }

  // Called by RHF when validation fails on submit — scroll to first error
  function onInvalidSubmit() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    toast.error("Please complete all required fields, including the DPA consent at the bottom.");
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">
            {editFarmer ? "Edit Farmer" : "Register Farmer"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-0">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                    i < step ? "bg-[#3B6D11] text-white"
                      : i === step ? "bg-[#3B6D11] text-white ring-4 ring-[#EAF3DE]"
                        : "bg-gray-200 text-gray-500"
                  )}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    i === step ? "text-[#3B6D11]" : "text-gray-400"
                  )}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px flex-1 mx-2", i < step ? "bg-[#3B6D11]" : "bg-gray-200")} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
          <form id="farmer-wizard-form" onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}>
            {step === 0 && <Step1Personal form={form} />}
            {step === 1 && <Step2Address form={form} />}
            {step === 2 && <Step3Farm form={form} />}
          </form>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={step === 0 ? onClose : handleBack}
            className="flex items-center gap-1 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {step === 0 ? "Cancel" : <><ChevronLeft size={14} /> Back</>}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 text-sm text-white rounded-md"
              style={{ backgroundColor: "#3B6D11" }}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="submit"
              form="farmer-wizard-form"
              disabled={mutation.isPending || justNavigated}
              className="px-5 py-2 text-sm text-white rounded-md disabled:opacity-60"
              style={{ backgroundColor: "#3B6D11" }}
            >
              {mutation.isPending ? "Saving…" : editFarmer ? "Update" : "Register Farmer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
