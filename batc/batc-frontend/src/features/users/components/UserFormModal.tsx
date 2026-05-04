import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { usersApi, type UserItem } from "../api/users.api";
import { cn } from "@/lib/utils";

const baseSchema = z.object({
  username: z.string().min(3, "Min 3 characters"),
  email: z.string().email("Invalid email").or(z.literal("")),
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  role: z.enum(["ADMIN", "STAFF", "CLIENT"]),
  password: z.string().optional(),
});

const createSchema = baseSchema.extend({
  password: z.string().min(8, "Min 8 characters"),
});

type FormValues = z.infer<typeof baseSchema>;

interface Props {
  user: UserItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function UserFormModal({ user, onClose, onSaved }: Props) {
  const isNew = user === null;
  const schema = isNew ? createSchema : baseSchema;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "CLIENT" },
  });

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isNew
        ? usersApi.create({ ...values, password: values.password! })
        : usersApi.update(user!.id, values),
    onSuccess: () => {
      toast.success(isNew ? "User created." : "User updated.");
      onSaved();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.username?.[0] ?? err?.response?.data?.detail ?? "Something went wrong.";
      toast.error(msg);
    },
  });

  const field = (name: keyof FormValues, label: string, type = "text") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        {...register(name)}
        className={cn(
          "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]",
          errors[name] ? "border-red-400" : "border-gray-300"
        )}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]?.message as string}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{isNew ? "Add User" : "Edit User"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {field("first_name", "First name")}
            {field("last_name", "Last name")}
          </div>
          {field("username", "Username")}
          {field("email", "Email")}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              {...register("role")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]"
            >
              <option value="CLIENT">Farmer</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {isNew && field("password", "Password", "password")}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-md">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm text-white rounded-md disabled:opacity-60"
              style={{ backgroundColor: "#3B6D11" }}
            >
              {mutation.isPending ? "Saving…" : isNew ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
