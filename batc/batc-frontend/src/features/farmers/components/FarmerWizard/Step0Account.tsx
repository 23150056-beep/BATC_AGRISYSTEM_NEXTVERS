import { useState } from "react";
import { Eye, EyeOff, User, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props { form: any }

const inputCls = (err?: string) =>
  cn(
    "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]",
    err ? "border-red-400" : "border-gray-300"
  );

export function Step0Account({ form }: Props) {
  const { register, formState: { errors } } = form;
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-5">
      {/* Intro card */}
      <div className="flex items-start gap-3 bg-[#EAF3DE] border border-[#3B6D11]/20 rounded-lg p-4">
        <User size={18} className="text-[#3B6D11] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#27500A]">Create your portal account</p>
          <p className="text-xs text-[#3B6D11] mt-0.5 leading-relaxed">
            Choose a username and password you will use to log in and track your
            applications, claims, and announcements.
          </p>
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username *
        </label>
        <input
          {...register("username")}
          autoComplete="username"
          placeholder="e.g. juandelacruz or 09XXXXXXXXX"
          className={inputCls(errors.username?.message)}
        />
        {errors.username ? (
          <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">
            Tip: you can use your mobile number as your username for easy recall.
            Letters, numbers, and underscores only — no spaces.
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <div className="relative">
          <input
            {...register("password")}
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className={cn(inputCls(errors.password?.message), "pr-10")}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm password *
        </label>
        <div className="relative">
          <input
            {...register("confirm_password")}
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your password"
            className={cn(inputCls(errors.confirm_password?.message), "pr-10")}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.confirm_password && (
          <p className="text-xs text-red-500 mt-1">{errors.confirm_password.message}</p>
        )}
      </div>

      {/* Security note */}
      <div className="flex items-start gap-2 text-xs text-gray-500">
        <KeyRound size={13} className="shrink-0 mt-0.5" />
        <p>
          Keep your password safe. Never share it with anyone. You can request a
          reset from the BATC office if you forget it.
        </p>
      </div>
    </div>
  );
}
