import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Leaf, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

import { selfRegistrationSchema, type SelfRegistrationValues } from "@/features/farmers/schemas/farmerSchema";
import { farmersApi } from "@/features/farmers/api/farmers.api";
import { useAuthStore } from "@/stores/authStore";
import { Step0Account } from "@/features/farmers/components/FarmerWizard/Step0Account";
import { Step1Personal } from "@/features/farmers/components/FarmerWizard/Step1Personal";
import { Step2Address } from "@/features/farmers/components/FarmerWizard/Step2Address";
import { Step3Farm } from "@/features/farmers/components/FarmerWizard/Step3Farm";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Step metadata
// ---------------------------------------------------------------------------
const STEPS = ["Account", "Personal Info", "Address", "Farm & Consent"];

/**
 * Fields validated on each step's "Next" click.
 * The schema uses .refine() for confirm_password — trigger both to surface the
 * cross-field error immediately without waiting for the final submit.
 */
const STEP_FIELDS: Array<(keyof SelfRegistrationValues)[]> = [
  ["username", "password", "confirm_password"],
  ["first_name", "last_name", "sex", "dob", "civil_status", "mobile_number"],
  ["barangay"],
  ["farm_area_ha", "household_size", "consent_dpa"],
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export function FarmerRegisterPage() {
  const navigate = useNavigate();
  const { setTokens, setUser, isAuthenticated } = useAuthStore();
  const [step, setStep]               = useState(0);
  const [submitting, setSubmitting]   = useState(false);
  const [justNavigated, setJustNavigated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // If already authenticated, redirect to the appropriate dashboard
  if (isAuthenticated()) {
    const storedUser = useAuthStore.getState().user;
    if (storedUser?.role === "ADMIN")  navigate("/admin/dashboard",  { replace: true });
    else if (storedUser?.role === "STAFF") navigate("/staff/dashboard", { replace: true });
    else navigate("/app/home", { replace: true });
  }

  const form = useForm<SelfRegistrationValues>({
    resolver: zodResolver(selfRegistrationSchema) as unknown as Resolver<SelfRegistrationValues>,
    defaultValues: {
      highest_education: "ELEMENTARY",
      livelihood_type:   "RICE",
      is_4ps:  false,
      is_pwd:  false,
      is_ip:   false,
      household_size: 1,
      parcels: [],
    },
  });

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------
  async function handleNext() {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) {
      setJustNavigated(true);
      setStep((s) => s + 1);
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setJustNavigated(false), 400);
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ------------------------------------------------------------------
  // Submit
  // ------------------------------------------------------------------
  async function onSubmit(values: SelfRegistrationValues) {
    setSubmitting(true);
    try {
      // confirm_password is only for frontend validation — strip it before sending
      const { confirm_password: _, linked_user_id: __, ...payload } = values as any;
      const result = await farmersApi.selfRegister({
        ...payload,
        username:         values.username,
        password:         values.password,
        confirm_password: values.confirm_password,
      });

      // Auto-login: persist tokens and user in the store
      setTokens(result.access, result.refresh);
      setUser(result.user);

      toast.success("Registration successful! Welcome to the BATC portal.");
      navigate("/app/home", { replace: true });
    } catch (err: any) {
      console.error("Registration error:", err?.response?.status, err?.response?.data);
      const data = err?.response?.data;

      if (!data) { toast.error("Network error. Please try again."); return; }

      if (typeof data === "string") {
        const clean = data.replace(/<[^>]+>/g, " ").trim().slice(0, 200);
        toast.error(clean || "Server error. Please try again.");
        return;
      }

      // Map field errors back to the correct step and scroll there
      const STEP0_FIELDS = ["username", "password", "confirm_password"];
      const STEP1_FIELDS = ["first_name", "last_name", "sex", "dob", "civil_status", "mobile_number"];
      const STEP2_FIELDS = ["barangay", "sitio", "rsbsa_reference"];

      const fieldOrder = [
        "username", "password", "confirm_password",
        "mobile_number", "first_name", "last_name", "dob",
        "rsbsa_reference", "barangay",
        "farm_area_ha", "household_size", "consent_dpa",
      ];

      for (const field of fieldOrder) {
        const val = data[field];
        if (val) {
          const msg = Array.isArray(val) ? val[0] : val;
          toast.error(`${field.replace(/_/g, " ")}: ${msg}`);

          // Jump to the step that owns this field
          if (STEP0_FIELDS.includes(field)) setStep(0);
          else if (STEP1_FIELDS.includes(field)) setStep(1);
          else if (STEP2_FIELDS.includes(field)) setStep(2);
          else setStep(3);
          return;
        }
      }

      if (data?.detail)           { toast.error(data.detail); return; }
      if (data?.non_field_errors) {
        const m = data.non_field_errors;
        toast.error(Array.isArray(m) ? m[0] : m);
        return;
      }

      if (typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const val = data[firstKey];
          const msg = Array.isArray(val) ? val[0] : (typeof val === "string" ? val : JSON.stringify(val));
          toast.error(`${firstKey.replace(/_/g, " ")}: ${msg}`);
          return;
        }
      }

      toast.error("Registration failed. Please check your information and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function onInvalidSubmit() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    toast.error("Please complete all required fields, including the DPA consent at the bottom.");
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-brand-100)] via-gray-50 to-white flex flex-col items-center justify-center px-4 py-8">
      {/* Brand header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3 bg-[var(--color-brand-600)] shadow-lg shadow-[var(--color-brand-600)]/20">
          <Leaf className="text-white" size={22} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Farmer Registration</h1>
        <p className="text-xs text-gray-500 mt-1">Bauang Agricultural Trade Center — BATC Portal</p>
      </div>

      {/* Wizard card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
        {/* Step indicator */}
        <div className="px-6 py-4 border-b bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-0">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors",
                    i < step
                      ? "bg-[#3B6D11] text-white"
                      : i === step
                        ? "bg-[#3B6D11] text-white ring-4 ring-[#EAF3DE]"
                        : "bg-gray-200 text-gray-500"
                  )}>
                    {i < step ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span className={cn(
                    "text-xs font-medium whitespace-nowrap hidden sm:block",
                    i === step ? "text-[#3B6D11]" : "text-gray-400"
                  )}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "h-px flex-1 mx-2 transition-colors",
                    i < step ? "bg-[#3B6D11]" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 sm:hidden">
            Step {step + 1} of {STEPS.length}: <span className="font-medium text-gray-600">{STEPS[step]}</span>
          </p>
        </div>

        {/* Step content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6" style={{ maxHeight: "60vh" }}>
          <form
            id="register-form"
            onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}
          >
            {step === 0 && <Step0Account form={form} />}
            {step === 1 && <Step1Personal form={form} />}
            {step === 2 && <Step2Address form={form} />}
            {step === 3 && <Step3Farm form={form} isSelfRegistration />}
          </form>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={step === 0 ? () => navigate("/login") : handleBack}
            className="flex items-center gap-1 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            {step === 0 ? (
              "Back to Login"
            ) : (
              <><ChevronLeft size={14} /> Back</>
            )}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 text-sm text-white rounded-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#3B6D11" }}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="submit"
              form="register-form"
              disabled={submitting || justNavigated}
              className="px-5 py-2 text-sm text-white rounded-md disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#3B6D11" }}
            >
              {submitting ? "Registering…" : "Complete Registration"}
            </button>
          )}
        </div>
      </div>

      {/* Login link */}
      <p className="text-xs text-gray-500 mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-[var(--color-brand-600)] hover:underline font-medium">
          Sign in here
        </Link>
      </p>
    </div>
  );
}
