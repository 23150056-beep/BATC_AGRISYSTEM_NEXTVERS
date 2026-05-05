import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, Lock, Sprout } from "lucide-react";
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

      {/* Decorative blurred orbs for depth */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 380, height: 380,
          borderRadius: "50%",
          background: "rgba(52, 168, 83, 0.18)",
          filter: "blur(80px)",
          top: "-80px", left: "-100px",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 280, height: 280,
          borderRadius: "50%",
          background: "rgba(212, 160, 23, 0.14)",
          filter: "blur(70px)",
          bottom: "-60px", right: "-60px",
        }}
      />

      <div className="w-full max-w-[360px] relative z-10">

        {/* Logo + branding */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: "rgba(116, 198, 157, 0.16)",
              border: "1px solid rgba(116, 198, 157, 0.38)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            <Sprout style={{ color: "rgba(183, 228, 199, 0.95)" }} size={30} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(232, 248, 237, 0.96)" }}>
            BATC Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(116, 198, 157, 0.65)" }}>
            Bauang Agricultural Trade Center
          </p>
        </div>

        {/* Glass login card */}
        <div className="glass-card rounded-2xl p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div>
              <label
                className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
                style={{ color: "rgba(27, 67, 50, 0.80)" }}
              >
                Username
              </label>
              <input
                {...register("username")}
                autoComplete="username"
                autoFocus
                placeholder="Enter your username"
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all",
                  "placeholder:text-gray-400",
                  errors.username
                    ? "border border-red-400 bg-white/60 focus:ring-2 focus:ring-red-300"
                    : "border border-white/60 bg-white/55 focus:ring-2 focus:ring-[rgba(64,145,108,0.35)] focus:border-[rgba(64,145,108,0.50)]"
                )}
                style={{ backdropFilter: "blur(8px)" }}
              />
              <p className="text-[11px] mt-1.5" style={{ color: "rgba(27, 67, 50, 0.50)" }}>
                Farmers: use the username your barangay encoder provided.
              </p>
              {errors.username && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
                style={{ color: "rgba(27, 67, 50, 0.80)" }}
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
                    "w-full px-3.5 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all",
                    "placeholder:text-gray-400",
                    errors.password
                      ? "border border-red-400 bg-white/60 focus:ring-2 focus:ring-red-300"
                      : "border border-white/60 bg-white/55 focus:ring-2 focus:ring-[rgba(64,145,108,0.35)] focus:border-[rgba(64,145,108,0.50)]"
                  )}
                  style={{ backdropFilter: "blur(8px)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                  style={{ color: "rgba(27, 67, 50, 0.40)" }}
                  title={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center text-xs">
              <label className="flex items-center gap-2 cursor-pointer" style={{ color: "rgba(27, 67, 50, 0.65)" }}>
                <input type="checkbox" {...register("remember")} className="rounded accent-[#40916c]" />
                Remember my username
              </label>
            </div>

            {serverError && (
              <div
                className="rounded-xl px-4 py-3 flex items-start gap-2.5"
                style={{
                  background: "rgba(180, 35, 24, 0.10)",
                  border: "1px solid rgba(180, 35, 24, 0.25)",
                }}
              >
                <Lock size={14} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-red-700 font-medium">{serverError}</p>
                  {failedAttempts >= 3 && (
                    <p className="text-[11px] mt-1" style={{ color: "rgba(27, 67, 50, 0.55)" }}>
                      Contact your barangay encoder to reset your password.
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-3 rounded-xl text-sm font-semibold text-white transition-all",
                isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:brightness-105 active:scale-[0.98]"
              )}
              style={{
                background: "linear-gradient(135deg, #2d6a4f 0%, #40916c 50%, #52b788 100%)",
                boxShadow: "0 4px 20px rgba(45, 106, 79, 0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.40)" }}>
            <p className="text-center text-xs" style={{ color: "rgba(27, 67, 50, 0.55)" }}>
              Are you a farmer?{" "}
              <Link
                to="/register"
                className="font-semibold hover:underline"
                style={{ color: "#2d6a4f" }}
              >
                Register here
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] mt-4" style={{ color: "rgba(116, 198, 157, 0.35)" }}>
          BATC Centralized Distribution System · Prototype
        </p>

        {/* Demo panel */}
        {IS_DEMO && (
          <div
            className="mt-4 rounded-2xl p-4"
            style={{
              background: "rgba(255, 255, 255, 0.10)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px dashed rgba(212, 160, 23, 0.50)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            }}
          >
            <p
              className="text-center text-[11px] font-bold mb-3 tracking-wide uppercase"
              style={{ color: "rgba(212, 160, 23, 0.90)" }}
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
                    "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all",
                    demoLoading === username ? "opacity-50" : "hover:brightness-115 active:scale-[0.97]"
                  )}
                  style={{
                    background: "rgba(255, 255, 255, 0.16)",
                    border: "1px solid rgba(255, 255, 255, 0.26)",
                    color: "rgba(232, 248, 237, 0.92)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
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
