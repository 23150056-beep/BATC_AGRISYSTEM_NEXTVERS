import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { inventoryApi, type InventoryItem } from "../api/inventory.api";
import { cn } from "@/lib/utils";

const schema = z.object({
  lot_number: z.string().min(1, "Required"),
  received_date: z.string().min(1, "Required"),
  expiry_date: z.string().optional(),
  quantity: z.string().min(1, "Required"),
  reference_note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputCls = (err?: string) =>
  cn("w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]",
    err ? "border-red-400" : "border-gray-300");

interface Props {
  item: InventoryItem;
  onClose: () => void;
  onSaved: () => void;
}

export function ReceiveStockDialog({ item, onClose, onSaved }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { received_date: new Date().toISOString().split("T")[0] },
  });

  const mut = useMutation({
    mutationFn: (values: FormValues) => inventoryApi.receiveStock(item.id, values),
    onSuccess: () => {
      toast.success("Stock received.");
      onSaved();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to receive stock.");
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Receive Stock — {item.name}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <form onSubmit={handleSubmit((v) => mut.mutate(v))} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lot number *</label>
              <input {...register("lot_number")} className={inputCls(errors.lot_number?.message)} />
              {errors.lot_number && <p className="text-xs text-red-500 mt-1">{errors.lot_number.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity ({item.unit}) *</label>
              <input type="number" step="0.01" {...register("quantity")} className={inputCls(errors.quantity?.message)} />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received date *</label>
              <input type="date" {...register("received_date")} className={inputCls(errors.received_date?.message)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry date</label>
              <input type="date" {...register("expiry_date")} className={inputCls()} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference note</label>
            <input {...register("reference_note")} placeholder="e.g. DR-2026-001" className={inputCls()} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-md">Cancel</button>
            <button type="submit" disabled={mut.isPending}
              className="px-5 py-2 text-sm text-white rounded-md disabled:opacity-60"
              style={{ backgroundColor: "#3B6D11" }}>
              {mut.isPending ? "Saving…" : "Receive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
