import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props { form: any }

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (err?: string) =>
  cn("w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]",
    err ? "border-red-400" : "border-gray-300");

export function Step1Personal({ form }: Props) {
  const { register, formState: { errors } } = form;
  const e = errors;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <Field label="First name *" error={e.first_name?.message}>
            <input {...register("first_name")} className={inputCls(e.first_name?.message)} />
          </Field>
        </div>
        <div className="col-span-1">
          <Field label="Middle name" error={e.middle_name?.message}>
            <input {...register("middle_name")} className={inputCls()} />
          </Field>
        </div>
        <div className="col-span-1">
          <Field label="Last name *" error={e.last_name?.message}>
            <input {...register("last_name")} className={inputCls(e.last_name?.message)} />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1">
          <Field label="Suffix">
            <input {...register("suffix")} placeholder="Jr., Sr., III" className={inputCls()} />
          </Field>
        </div>
        <div className="col-span-1">
          <Field label="Sex *" error={e.sex?.message}>
            <select {...register("sex")} className={inputCls(e.sex?.message)}>
              <option value="">—</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Date of birth *" error={e.dob?.message}>
            <input type="date" {...register("dob")} className={inputCls(e.dob?.message)} />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Civil status *" error={e.civil_status?.message}>
          <select {...register("civil_status")} className={inputCls(e.civil_status?.message)}>
            <option value="">—</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="WIDOWED">Widowed</option>
            <option value="SEPARATED">Separated</option>
            <option value="COMMON_LAW">Common-law</option>
          </select>
        </Field>
        <Field label="Highest education" error={e.highest_education?.message}>
          <select {...register("highest_education")} className={inputCls()}>
            <option value="NONE">No formal education</option>
            <option value="ELEMENTARY">Elementary</option>
            <option value="HIGH_SCHOOL">High School</option>
            <option value="VOCATIONAL">Vocational / Technical</option>
            <option value="COLLEGE">College</option>
            <option value="POST_GRAD">Post-graduate</option>
          </select>
        </Field>
      </div>

      <Field label="Mobile number *" error={e.mobile_number?.message}>
        <input {...register("mobile_number")} placeholder="09XXXXXXXXX" className={inputCls(e.mobile_number?.message)} />
      </Field>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Special categories</p>
        <div className="flex gap-6">
          {([["is_4ps", "4Ps Beneficiary"], ["is_pwd", "PWD"], ["is_ip", "Indigenous People"]] as const).map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" {...register(name)} className="rounded border-gray-300 text-[#3B6D11]" />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
