import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Leaf, AlertTriangle, Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { authApi } from "@/services/api/auth.api";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

const IS_DEMO = import.meta.env.VITE_USE_MOCK === "true";

const DEMO_ACCOUNTS = [
  { label: "Admin",  hint: "Manage users, programs, and reports.",     username: "admin",    password: "admin1234"  },
  { label: "Staff",  hint: "Review applications and run distributions.", username: "staff01",  password: "staff1234"  },
  { label: "Farmer", hint: "Browse programs and submit applications.",  username: "farmer01", password: "farmer1234" },
];

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setTokens, setUser, logout } = useAuthStore();
  const [serverError, setServerError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [capsOn, setCapsOn] = useState(false);

  // SECURITY FIX: When user arrives at login page (including via back button),
  // treat it as an intent to logout. This prevents forward button from showing
  // a cached authenticated page without re-login.
  useEffect(() => {
    // Check if user was previously logged in
    const hasToken = localStorage.getItem("access_token");
    if (hasToken) {
      // User is arriving at login page while having a token
      // This likely means they're navigating back from an authenticated page
      // Clear their session so forward button won't restore the cached page
      logout();
    }
  }, [logout]);

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
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[var(--color-brand-100)] via-gray-50 to-white px-4 py-8">
      {/* Back to landing */}
      <Link
        to="/"
        className="fixed top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:shadow transition-all"
      >
        <ArrowLeft size={13} />
        Back to home
      </Link>

      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-7">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
            style={{
              background: "var(--color-brand-600)",
              boxShadow: "0 10px 24px -8px rgba(59, 109, 17, 0.40)",
            }}
            aria-hidden="true"
          >
            <Leaf className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">BATC Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Bauang Agricultural Trade Center</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
          aria-labelledby="login-heading"
        >
          <h2 id="login-heading" className="sr-only">Sign in</h2>

          {/* Username */}
          <div>
            <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              {...register("username")}
              id="login-username"
              autoComplete="username"
              autoFocus
              placeholder="Your username"
              aria-invalid={errors.username ? "true" : undefined}
              aria-describedby="login-username-hint login-username-error"
              className={cn(
                "w-full px-3 py-2.5 border rounded-md text-sm outline-none transition-colors",
                "focus:ring-2 focus:ring-[var(--color-brand-500)]/40 focus:border-[var(--color-brand-500)]",
                errors.username ? "border-red-400" : "border-gray-300"
              )}
            />
            <p id="login-username-hint" className="text-[11px] text-gray-400 mt-1">
              Farmers: use the username your barangay encoder gave you (often your mobile number).
            </p>
            {errors.username && (
              <p id="login-username-error" role="alert" className="text-xs text-red-600 mt-1 font-medium">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                {...register("password")}
                id="login-password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-invalid={errors.password ? "true" : undefined}
                aria-describedby="login-password-error login-caps-warn"
                onKeyUp={(e) => setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))}
                onKeyDown={(e) => setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))}
                className={cn(
                  "w-full px-3 py-2.5 pr-10 border rounded-md text-sm outline-none transition-colors",
                  "focus:ring-2 focus:ring-[var(--color-brand-500)]/40 focus:border-[var(--color-brand-500)]",
                  errors.password ? "border-red-400" : "border-gray-300"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={0}
                aria-label={showPwd ? "Hide password" : "Show password"}
                aria-pressed={showPwd}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/40"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {capsOn && (
              <p id="login-caps-warn" role="status" className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                <AlertTriangle size={11} /> Caps Lock is on
              </p>
            )}
            {errors.password && (
              <p id="login-password-error" role="alert" className="text-xs text-red-600 mt-1 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("remember")}
                className="rounded border-gray-300 text-[var(--color-brand-600)] focus:ring-[var(--color-brand-500)]/40"
              />
              Remember username
            </label>
          </div>

          {serverError && (
            <div
              role="alert"
              className="bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 rounded-md px-3 py-2.5 flex items-start gap-2"
            >
              <Lock size={13} className="text-[var(--color-danger)] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-[var(--color-danger)] font-medium">{serverError}</p>
                {failedAttempts >= 3 && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    Multiple failed attempts. Contact your barangay encoder if you need a password reset.
                  </p>
                )}
              </div>
            </div>
          )}

          <Button type="submit" block size="lg" loading={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Are you a farmer?{" "}
              <Link to="/register" className="font-semibold text-[var(--color-brand-600)] hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </form>

        {/* Demo panel */}
        {IS_DEMO && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-2.5 text-center">
              Demo Mode · Instant login
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(({ label, hint, username, password }) => (
                <button
                  key={username}
                  type="button"
                  onClick={() => quickLogin(username, password)}
                  disabled={demoLoading !== null}
                  title={hint}
                  aria-label={`Sign in as ${label} — ${hint}`}
                  className={cn(
                    "h-12 rounded-lg text-xs font-semibold transition-all bg-white border border-amber-200",
                    "hover:border-amber-400 hover:shadow-sm hover:-translate-y-0.5",
                    "active:translate-y-0 active:shadow-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
                    demoLoading === username
                      ? "opacity-60 text-amber-700"
                      : "text-gray-800"
                  )}
                >
                  {demoLoading === username ? "Signing in…" : label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-amber-700/80 mt-2 text-center">
              Hover a button to see what each role can do.
            </p>
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400 mt-4">
          BATC Centralized Distribution System · Prototype
        </p>
      </div>
    </div>
  );
}
