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
    <div className="agri-bg-login min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo + title */}
        <div className="text-center mb-7">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: "rgba(116, 198, 157, 0.18)",
              border: "1px solid rgba(116, 198, 157, 0.35)",
              boxShadow: "0 4px 24px rgba(10, 28, 18, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <Leaf style={{ color: "rgba(183, 228, 199, 0.95)" }} size={28} />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: "rgba(232, 248, 237, 0.96)" }}>
            BATC Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(116, 198, 157, 0.65)" }}>
            Bauang Agricultural Trade Center
          </p>
        </div>

        {/* Glass login card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="glass-card space-y-4 rounded-2xl p-6"
        >
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "rgba(30, 70, 45, 0.9)" }}>
              Username
            </label>
            <input
              {...register("username")}
              autoComplete="username"
              autoFocus
              placeholder="Your username"
              className={cn(
                "w-full px-3 py-2.5 rounded-md text-sm outline-none transition-all",
                "focus:ring-2 focus:ring-[var(--color-agri-500)]/50",
                errors.username ? "border border-red-400" : "border border-white/50"
              )}
              style={{ background: "rgba(255,255,255,0.55)" }}
            />
            <p className="text-[11px] mt-1" style={{ color: "rgba(30, 70, 45, 0.5)" }}>
              Farmers: use the username your barangay encoder gave you.
            </p>
            {errors.username && (
              <p className="text-xs text-red-600 mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "rgba(30, 70, 45, 0.9)" }}>
              Password
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                className={cn(
                  "w-full px-3 py-2.5 pr-10 rounded-md text-sm outline-none transition-all",
                  "focus:ring-2 focus:ring-[var(--color-agri-500)]/50",
                  errors.password ? "border border-red-400" : "border border-white/50"
                )}
                style={{ background: "rgba(255,255,255,0.55)" }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 transition-colors"
                style={{ color: "rgba(30, 70, 45, 0.45)" }}
                title={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center text-xs">
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: "rgba(30, 70, 45, 0.65)" }}>
              <input type="checkbox" {...register("remember")} className="rounded" />
              Remember username
            </label>
          </div>

          {serverError && (
            <div
              className="rounded-md px-3 py-2 flex items-start gap-2"
              style={{ background: "rgba(180, 35, 24, 0.08)", border: "1px solid rgba(180, 35, 24, 0.2)" }}
            >
              <Lock size={13} className="text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-red-700">{serverError}</p>
                {failedAttempts >= 3 && (
                  <p className="text-[11px] mt-1" style={{ color: "rgba(30, 70, 45, 0.55)" }}>
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
              "w-full py-2.5 rounded-md text-sm font-semibold text-white transition-all",
              isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:brightness-110 active:scale-[0.98]"
            )}
            style={{
              background: "linear-gradient(135deg, var(--color-agri-600) 0%, var(--color-agri-500) 100%)",
              boxShadow: "0 2px 12px rgba(45, 106, 79, 0.35)",
            }}
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs mt-4" style={{ color: "rgba(116, 198, 157, 0.55)" }}>
          Are you a farmer?{" "}
          <Link
            to="/register"
            className="font-medium hover:underline"
            style={{ color: "rgba(183, 228, 199, 0.85)" }}
          >
            Register your account here
          </Link>
        </p>
        <p className="text-center text-[11px] mt-2" style={{ color: "rgba(116, 198, 157, 0.35)" }}>
          BATC Centralized Distribution System · Prototype
        </p>

        {IS_DEMO && (
          <div
            className="mt-5 rounded-xl p-4"
            style={{
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px dashed rgba(212, 160, 23, 0.45)",
            }}
          >
            <p className="text-center text-xs font-semibold mb-3" style={{ color: "rgba(212, 160, 23, 0.9)" }}>
              Demo Mode — click to log in instantly
            </p>
            <div className="flex gap-2 justify-center">
              {DEMO_ACCOUNTS.map(({ label, username, password }) => (
                <button
                  key={username}
                  type="button"
                  onClick={() => quickLogin(username, password)}
                  disabled={demoLoading !== null}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                    demoLoading === username ? "opacity-60" : "hover:brightness-110 active:scale-[0.97]"
                  )}
                  style={{
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    color: "rgba(232, 248, 237, 0.9)",
                  }}
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
