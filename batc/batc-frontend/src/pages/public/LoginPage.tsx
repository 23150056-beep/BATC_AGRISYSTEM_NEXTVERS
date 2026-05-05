import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, Leaf, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { authApi } from "@/services/api/auth.api";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const IS_DEMO = import.meta.env.VITE_USE_MOCK === "true";

const DEMO_ACCOUNTS = [
  { label: "Admin",  username: "admin",    password: "admin1234",  color: "bg-[#162036] text-white" },
  { label: "Staff",  username: "staff01",  password: "staff1234",  color: "bg-[#3B6D11] text-white" },
  { label: "Farmer", username: "farmer01", password: "farmer1234", color: "bg-[#0C447C] text-white" },
];

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [serverError, setServerError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  async function quickLogin(username: string, password: string) {
    setDemoLoading(username);
    setServerError("");
    try {
      const tokens = await authApi.login({ username, password });
      setTokens(tokens.access, tokens.refresh);
      const user = await authApi.me();
      setUser(user);
      if (user.role === "ADMIN") navigate("/admin/dashboard");
      else if (user.role === "STAFF") navigate("/staff/dashboard");
      else navigate("/app/home");
    } catch {
      setServerError("Demo login failed — please try again.");
    } finally {
      setDemoLoading(null);
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: localStorage.getItem("batc_remember_username") ?? "",
      remember: !!localStorage.getItem("batc_remember_username"),
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError("");
    try {
      const tokens = await authApi.login(values);
      setTokens(tokens.access, tokens.refresh);
      const user = await authApi.me();
      setUser(user);

      if (values.remember) {
        localStorage.setItem("batc_remember_username", values.username);
      } else {
        localStorage.removeItem("batc_remember_username");
      }

      if (user.role === "ADMIN") navigate("/admin/dashboard");
      else if (user.role === "STAFF") navigate("/staff/dashboard");
      else navigate("/app/home");
    } catch (err: any) {
      setFailedAttempts((n) => n + 1);
      // Surface the server's error if it gave one (e.g. throttled)
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 429) {
        setServerError("Too many login attempts. Please wait a minute and try again.");
      } else if (detail) {
        setServerError(detail);
      } else {
        setServerError("Invalid username or password.");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-brand-100)] via-gray-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-[var(--color-brand-600)] shadow-lg shadow-[var(--color-brand-600)]/20">
            <Leaf className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">BATC Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Bauang Agricultural Trade Center</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              {...register("username")}
              autoComplete="username"
              autoFocus
              placeholder="Your username"
              className={cn(
                "w-full px-3 py-2.5 border rounded-md text-sm outline-none transition-colors",
                "focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-[var(--color-brand-500)]",
                errors.username ? "border-red-400" : "border-gray-300"
              )}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Farmers: use the username your barangay encoder gave you (often your mobile number).
            </p>
            {errors.username && (
              <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                className={cn(
                  "w-full px-3 py-2.5 pr-10 border rounded-md text-sm outline-none transition-colors",
                  "focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-[var(--color-brand-500)]",
                  errors.password ? "border-red-400" : "border-gray-300"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                title={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
              <input type="checkbox" {...register("remember")} className="rounded border-gray-300" />
              Remember username
            </label>
          </div>

          {serverError && (
            <div className="bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 rounded-md px-3 py-2 flex items-start gap-2">
              <Lock size={13} className="text-[var(--color-danger)] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-[var(--color-danger)]">{serverError}</p>
                {failedAttempts >= 3 && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    Multiple failed attempts. Contact your barangay encoder if you need a password reset.
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-2.5 rounded-md text-sm font-medium text-white transition-colors bg-[var(--color-brand-600)]",
              isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
            )}
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          Are you a farmer?{" "}
          <Link
            to="/register"
            className="text-[var(--color-brand-600)] hover:underline font-medium"
          >
            Register your account here
          </Link>
        </p>
        <p className="text-center text-[11px] text-gray-400 mt-2">
          BATC Centralized Distribution System · Prototype
        </p>

        {IS_DEMO && (
          <div className="mt-5 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
            <p className="text-center text-xs font-semibold text-amber-700 mb-3">
              🧪 Demo Mode — click to log in instantly
            </p>
            <div className="flex gap-2 justify-center">
              {DEMO_ACCOUNTS.map(({ label, username, password, color }) => (
                <button
                  key={username}
                  type="button"
                  onClick={() => quickLogin(username, password)}
                  disabled={demoLoading !== null}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-semibold transition-opacity",
                    color,
                    demoLoading === username ? "opacity-60" : "hover:opacity-85"
                  )}
                >
                  {demoLoading === username ? "…" : label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
