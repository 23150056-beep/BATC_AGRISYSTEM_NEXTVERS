import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, AlertCircle, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { authApi } from "@/services/api/auth.api";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const IS_DEMO = import.meta.env.VITE_USE_MOCK === "true";

const DEMO_ACCOUNTS = [
  { label: "Admin",  username: "admin",    password: "admin1234"  },
  { label: "Staff",  username: "staff01",  password: "staff1234"  },
  { label: "Farmer", username: "farmer01", password: "farmer1234" },
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
    <div className="agri-bg-login min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

      {/* Extra bokeh orbs for depth on login screen */}
      <div className="absolute pointer-events-none" style={{
        width: 500, height: 500, borderRadius: "50%",
        background: "rgba(34, 140, 80, 0.22)", filter: "blur(90px)",
        top: "-120px", left: "-140px",
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 360, height: 360, borderRadius: "50%",
        background: "rgba(200, 140, 0, 0.18)", filter: "blur(80px)",
        bottom: "-80px", right: "-80px",
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 240, height: 240, borderRadius: "50%",
        background: "rgba(0, 160, 100, 0.14)", filter: "blur(60px)",
        top: "40%", right: "10%",
      }} />

      <div className="w-full max-w-[380px] relative z-10">

        {/* Logo + branding */}
        <div className="text-center mb-7">
          <div
            className="inline-flex items-center justify-center w-18 h-18 rounded-2xl mb-4"
            style={{
              width: 72, height: 72,
              background: "rgba(116, 198, 157, 0.18)",
              border: "1px solid rgba(116, 198, 157, 0.42)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.18)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Sprout style={{ color: "rgba(190, 235, 210, 0.98)" }} size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "rgba(235, 252, 242, 0.99)" }}>
            BATC Portal
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "rgba(160, 220, 188, 0.90)" }}>
            Bauang Agricultural Trade Center
          </p>
        </div>

        {/* Glass login card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: "rgba(255, 255, 255, 0.11)",
            backdropFilter: "blur(36px) saturate(200%)",
            WebkitBackdropFilter: "blur(36px) saturate(200%)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.32)",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Username */}
            <div>
              <label
                className="block text-xs font-bold mb-2 tracking-widest uppercase"
                style={{ color: "rgba(200, 240, 218, 0.95)" }}
              >
                Username
              </label>
              <input
                {...register("username")}
                autoComplete="username"
                autoFocus
                placeholder="Enter your username"
                className={cn(
                  "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all font-medium",
                  errors.username
                    ? "border border-red-400/70 focus:ring-2 focus:ring-red-400/40"
                    : "border focus:ring-2 focus:ring-[rgba(116,198,157,0.45)] focus:border-[rgba(116,198,157,0.60)]"
                )}
                style={{
                  background: "rgba(255,255,255,0.10)",
                  backdropFilter: "blur(8px)",
                  borderColor: errors.username ? undefined : "rgba(255,255,255,0.22)",
                  color: "rgba(232, 252, 240, 0.97)",
                }}
              />
              <p className="text-[11px] mt-1.5" style={{ color: "rgba(170, 218, 195, 0.78)" }}>
                Farmers: use the username your barangay encoder provided.
              </p>
              {errors.username && (
                <p className="text-xs text-red-400 mt-1 font-medium">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-bold mb-2 tracking-widest uppercase"
                style={{ color: "rgba(200, 240, 218, 0.95)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={cn(
                    "w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all font-medium",
                    errors.password
                      ? "border border-red-400/70 focus:ring-2 focus:ring-red-400/40"
                      : "border focus:ring-2 focus:ring-[rgba(116,198,157,0.45)] focus:border-[rgba(116,198,157,0.60)]"
                  )}
                  style={{
                    background: "rgba(255,255,255,0.10)",
                    backdropFilter: "blur(8px)",
                    borderColor: errors.password ? undefined : "rgba(255,255,255,0.22)",
                    color: "rgba(232, 252, 240, 0.97)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all"
                  style={{ color: "rgba(180, 228, 205, 0.70)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(200, 240, 218, 0.95)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(180, 228, 205, 0.70)")}
                  title={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center text-xs">
              <label
                className="flex items-center gap-2 cursor-pointer select-none"
                style={{ color: "rgba(190, 232, 210, 0.90)" }}
              >
                <input type="checkbox" {...register("remember")} className="rounded accent-[#52b788]" />
                Remember my username
              </label>
            </div>

            {/* Server error */}
            {serverError && (
              <div
                className="rounded-xl px-4 py-3 flex items-start gap-2.5"
                style={{
                  background: "rgba(220, 50, 40, 0.14)",
                  border: "1px solid rgba(220, 80, 70, 0.35)",
                }}
              >
                <AlertCircle size={15} style={{ color: "rgba(255,130,120,0.95)" }} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "rgba(255, 155, 145, 0.97)" }}>{serverError}</p>
                  {failedAttempts >= 3 && (
                    <p className="text-[11px] mt-1" style={{ color: "rgba(220, 180, 175, 0.82)" }}>
                      Contact your barangay encoder to reset your password.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sign in button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-3.5 rounded-xl text-sm font-bold text-white tracking-wide transition-all",
                isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:brightness-110 hover:shadow-lg active:scale-[0.98]"
              )}
              style={{
                background: "linear-gradient(135deg, #1b5e38 0%, #2d7a52 40%, #40916c 75%, #52b788 100%)",
                boxShadow: "0 6px 24px rgba(34, 140, 80, 0.50), inset 0 1px 0 rgba(255,255,255,0.20)",
                letterSpacing: "0.04em",
              }}
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Register link */}
          <div
            className="mt-5 pt-4 text-center"
            style={{ borderTop: "1px solid rgba(255,255,255,0.14)" }}
          >
            <p className="text-xs" style={{ color: "rgba(185, 230, 208, 0.88)" }}>
              Are you a farmer?{" "}
              <Link
                to="/register"
                className="font-bold hover:underline"
                style={{ color: "rgba(130, 210, 170, 0.99)" }}
              >
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer caption */}
        <p className="text-center text-[11px] mt-5" style={{ color: "rgba(140, 200, 170, 0.65)" }}>
          BATC Centralized Distribution System · Prototype
        </p>

        {/* Demo panel */}
        {IS_DEMO && (
          <div
            className="mt-4 rounded-2xl p-4"
            style={{
              background: "rgba(255, 255, 255, 0.10)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px dashed rgba(212, 175, 55, 0.60)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
            }}
          >
            <p
              className="text-center text-[11px] font-bold mb-3 tracking-widest uppercase"
              style={{ color: "rgba(230, 190, 60, 0.95)" }}
            >
              Demo Mode — instant login
            </p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map(({ label, username, password }) => (
                <button
                  key={username}
                  type="button"
                  onClick={() => quickLogin(username, password)}
                  disabled={demoLoading !== null}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all",
                    demoLoading === username ? "opacity-50" : "hover:brightness-115 active:scale-[0.97]"
                  )}
                  style={{
                    background: "rgba(255, 255, 255, 0.16)",
                    border: "1px solid rgba(255, 255, 255, 0.28)",
                    color: "rgba(232, 252, 240, 0.97)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
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
