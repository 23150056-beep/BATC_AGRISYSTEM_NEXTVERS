import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "../api/inventory.api";
import { cn } from "@/lib/utils";

interface Props {
  itemId: number;
}

const typeStyle: Record<string, string> = {
  RECEIVE:    "bg-[#EAF3DE] text-[#27500A]",
  RELEASE:    "bg-[#FAEEDA] text-[#633806]",
  ADJUSTMENT: "bg-[#E6F1FB] text-[#0C447C]",
};

export function MovementLedger({ itemId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory-movements", itemId],
    queryFn: () => inventoryApi.getMovements(itemId),
  });

  if (isLoading) return <p className="text-sm text-gray-400 py-4">Loading…</p>;
  if (!data?.results.length) return <p className="text-sm text-gray-400 italic py-4">No movements recorded.</p>;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
          <tr>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-left">Reference</th>
            <th className="px-3 py-2 text-left">By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.results.map((m) => (
            <tr key={m.id}>
              <td className="px-3 py-2 text-gray-500 text-xs">
                {new Date(m.created_at).toLocaleDateString()}
              </td>
              <td className="px-3 py-2">
                <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium", typeStyle[m.movement_type] ?? "bg-gray-100 text-gray-600")}>
                  {m.movement_type}
                </span>
              </td>
              <td className={cn("px-3 py-2 text-right font-medium tabular-nums", Number(m.quantity) < 0 ? "text-red-600" : "text-green-700")}>
                {Number(m.quantity) > 0 ? "+" : ""}{Number(m.quantity).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-gray-600 text-xs">{m.reference_note || "—"}</td>
              <td className="px-3 py-2 text-gray-500 text-xs">{m.created_by_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
