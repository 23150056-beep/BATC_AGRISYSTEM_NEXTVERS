import { BarangaySelect } from "@/components/form/BarangaySelect";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props { form: any }

const inputCls = (err?: string) =>
  cn("w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]",
    err ? "border-red-400" : "border-gray-300");

export function Step2Address({ form }: Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
        <BarangaySelect {...register("barangay")} error={errors.barangay?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sitio / Purok</label>
        <input {...register("sitio")} placeholder="Optional" className={inputCls()} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">RSBSA Reference No.</label>
        <input {...register("rsbsa_reference")} placeholder="Leave blank if not yet registered" className={inputCls()} />
        <p className="text-xs text-gray-400 mt-1">Format: XX-XX-XXXXXXXX-XXXXX-X</p>
      </div>
    </div>
  );
}
