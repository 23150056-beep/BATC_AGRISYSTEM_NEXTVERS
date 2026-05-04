import { forwardRef } from "react";
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

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const BarangaySelect = forwardRef<HTMLSelectElement, Props>(
  ({ error, className, ...props }, ref) => (
    <div>
      <select
        ref={ref}
        className={cn(
          "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]",
          error ? "border-red-400" : "border-gray-300",
          className
        )}
        {...props}
      >
        <option value="">Select barangay…</option>
        {BAUANG_BARANGAYS.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
);

BarangaySelect.displayName = "BarangaySelect";
