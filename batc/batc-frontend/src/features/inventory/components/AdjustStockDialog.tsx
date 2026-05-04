import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { inventoryApi, type StockBatch } from "../api/inventory.api";
import { cn } from "@/lib/utils";

const schema = z.object({
  quantity: z.string().min(1, "Required"),
  reference_note: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

const inputCls = (err?: string) =>
  cn("w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]",
    err ? "border-red-400" : "border-gray-300");

interface Props {
  batch: StockBatch;
  onClose: () => void;
  onSaved: () => void;
}

export function AdjustStockDialog({ batch, onClose, onSaved }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mut = useMutation({
    mutationFn: (values: FormValues) => inventoryApi.adjustBatch(batch.id, values),
    onSuccess: () => {
      toast.success("Batch adjusted.");
      onSaved();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Adjustment failed.");
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Adjust Batch — {batch.lot_number}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="px-6 pt-4 text-sm text-gray-600">
          Current qty: <span className="font-medium text-gray-900">{Number(batch.current_qty).toLocaleString()}</span>
        </div>

        <form onSubmit={handleSubmit((v) => mut.mutate(v))} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity change <span className="text-gray-400 font-normal">(use negative to decrease)</span>
            </label>
            <input type="number" step="0.01" {...register("quantity")} placeholder="e.g. -5 or 10" className={inputCls(errors.quantity?.message)} />
            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason / reference *</label>
            <input {...register("reference_note")} placeholder="e.g. Damaged goods write-off" className={inputCls(errors.reference_note?.message)} />
            {errors.reference_note && <p className="text-xs text-red-500 mt-1">{errors.reference_note.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-md">Cancel</button>
            <button type="submit" disabled={mut.isPending}
              className="px-5 py-2 text-sm text-white rounded-md disabled:opacity-60"
              style={{ backgroundColor: "#3B6D11" }}>
              {mut.isPending ? "Saving…" : "Apply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
