import { Link, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  Leaf, Sprout, Users, ClipboardList, Truck, BarChart3,
  MapPin, Phone, Mail, ChevronRight, ShieldCheck, Wheat,
} from "lucide-react";

// ── Brand colour helpers (matches CSS tokens) ────────────────────────────────
const brand = {
  600: "#3B6D11",
  500: "#639922",
  200: "#b4d48a",
  100: "#EAF3DE",
  50:  "#F7FAF3",
};

// ── Small components ─────────────────────────────────────────────────────────

function NavBar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: brand[600] }}
          >
            <Leaf size={15} className="text-white" />
          </div>
          <div className="leading-none">
            <p className="text-[13px] font-bold tracking-widest uppercase text-gray-900">BATC</p>
            <p className="text-[9px] text-gray-400 mt-0.5 hidden sm:block">Bauang Agri Trade Center</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-[13px] text-gray-500 font-medium">
          <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          <a href="#programs"  className="hover:text-gray-900 transition-colors">Programs</a>
          <a href="#contact"   className="hover:text-gray-900 transition-colors">Contact</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-flex px-3.5 py-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
            style={{ background: brand[600] }}
          >
            <Sprout size={13} />
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: brand[100], color: brand[600] }}
    >
      {children}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: brand[100], color: brand[600] }}
      >
        <Icon size={18} />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold tabular-nums" style={{ color: brand[600] }}>{value}</p>
      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
    </div>
  );
}

// ── Decorative SVG wheat stalks ──────────────────────────────────────────────
function WheatDecor({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 120" fill="none" className={className} aria-hidden="true">
      <path d="M30 110 Q30 60 30 10" stroke="#b4d48a" strokeWidth="1.5" />
      {[20, 35, 50, 65, 80].map((y, i) => (
        <g key={i}>
          <ellipse cx="22" cy={y} rx="8" ry="4" fill="#b4d48a" opacity="0.7" transform={`rotate(-20 22 ${y})`} />
          <ellipse cx="38" cy={y + 5} rx="8" ry="4" fill="#b4d48a" opacity="0.7" transform={`rotate(20 38 ${y + 5})`} />
        </g>
      ))}
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export function LandingPage() {
  // If already logged in, skip the landing page and go to the right dashboard
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated()) {
    if (user?.role === "ADMIN")  return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === "STAFF")  return <Navigate to="/staff/dashboard" replace />;
    return <Navigate to="/app/home" replace />;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <NavBar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
        {/* Background gradient */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `linear-gradient(160deg, ${brand[50]} 0%, #fff 55%, ${brand[100]}40 100%)`,
          }}
        />

        {/* Decorative wheat stalks */}
        <WheatDecor className="absolute left-0 bottom-0 h-48 opacity-60 hidden lg:block" />
        <WheatDecor className="absolute right-4 top-20 h-40 opacity-40 hidden lg:block rotate-12" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <HeroBadge>
            <MapPin size={11} />
            Bauang, La Union, Philippines
          </HeroBadge>

          <h1 className="mt-5 text-4xl sm:text-5xl md:text-[3.5rem] font-bold leading-tight tracking-tight text-gray-900">
            Bauang Agricultural
            <br />
            <span style={{ color: brand[600] }}>Trade Center</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
            A digital portal connecting Bauang's farmers to government programs,
            aid distribution, and agricultural support — all in one place.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl shadow-lg shadow-[#3B6D11]/20 hover:opacity-90 transition-opacity"
              style={{ background: brand[600] }}
            >
              <Sprout size={16} />
              Register as Farmer
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Sign in to portal
              <ChevronRight size={14} className="text-gray-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100" style={{ background: brand[50] }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value="26+" label="Barangays covered" />
          <StatCard value="500+"  label="Registered farmers" />
          <StatCard value="12"    label="Active programs" />
          <StatCard value="100%"  label="Free to use" />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <HeroBadge><Wheat size={11} /> What We Offer</HeroBadge>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900">
              Everything a farmer needs,<br className="hidden sm:block" /> in one portal
            </h2>
            <p className="mt-3 text-sm text-gray-500 max-w-xl mx-auto">
              The BATC Portal simplifies how farmers access programs, track claims,
              and communicate with agricultural staff.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={ClipboardList}
              title="Program Applications"
              description="Browse active agricultural programs and submit applications directly from your phone or computer."
            />
            <FeatureCard
              icon={Truck}
              title="Aid Distribution Tracking"
              description="Stay updated on scheduled deliveries, distribution status, and receive notifications when your aid is ready."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Farmer Verification"
              description="Upload your 4Ps, PWD, or IP documents for priority access to select programs and benefits."
            />
            <FeatureCard
              icon={Users}
              title="Farmer Profiles"
              description="Maintain your farm details, household information, and parcel records in a secure, centralized registry."
            />
            <FeatureCard
              icon={BarChart3}
              title="Staff Dashboard"
              description="Agricultural staff can manage farmer records, process applications, and generate distribution reports."
            />
            <FeatureCard
              icon={Sprout}
              title="Feedback & Support"
              description="Send feedback or raise concerns directly to BATC staff, and receive timely responses through the portal."
            />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="programs" style={{ background: brand[50] }} className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <HeroBadge><Leaf size={11} /> How It Works</HeroBadge>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900">
              Three simple steps to get started
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Register your account",
                desc: "Sign up with your basic information and farm details. The process takes about 5 minutes.",
              },
              {
                step: "02",
                title: "Browse programs",
                desc: "Explore available agricultural support programs and submit applications that match your profile.",
              },
              {
                step: "03",
                title: "Receive support",
                desc: "Track your application status and get notified when distributions are scheduled for your barangay.",
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-2xl border border-gray-100 p-6">
                <span
                  className="text-5xl font-black leading-none"
                  style={{ color: brand[200], letterSpacing: "-2px" }}
                >
                  {item.step}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity"
              style={{ background: brand[600] }}
            >
              <Sprout size={15} />
              Get started for free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonial / Quote ───────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
            style={{ background: brand[100] }}
          >
            <Leaf size={24} style={{ color: brand[600] }} />
          </div>
          <blockquote
            className="text-xl sm:text-2xl font-semibold leading-snug"
            style={{ color: brand[600] }}
          >
            "Empowering Bauang farmers through transparent,<br className="hidden sm:block" /> accessible agricultural services."
          </blockquote>
          <p className="mt-4 text-sm text-gray-500">
            Bauang Agricultural Trade Center, La Union
          </p>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <section id="contact" className="py-16 border-t border-gray-100" style={{ background: brand[50] }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div>
              <HeroBadge><MapPin size={11} /> Find Us</HeroBadge>
              <h2 className="mt-4 text-xl font-bold text-gray-900">Bauang Agricultural Trade Center</h2>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Serving the farming communities of Bauang, La Union through
                digital innovation and accessible government services.
              </p>
              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <MapPin size={15} className="shrink-0 mt-0.5" style={{ color: brand[600] }} />
                  <span>Bauang, La Union, Philippines 2501</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={15} className="shrink-0" style={{ color: brand[600] }} />
                  <span>Contact your local municipal agriculture office</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail size={15} className="shrink-0" style={{ color: brand[600] }} />
                  <span>Available through the BATC portal feedback system</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Quick access</p>
              <Link
                to="/register"
                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: brand[600] }}
              >
                <span className="flex items-center gap-2">
                  <Sprout size={14} /> Register as Farmer
                </span>
                <ChevronRight size={14} />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Users size={14} /> Sign in to your account
                </span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: brand[600] }}
            >
              <Leaf size={13} className="text-white" />
            </div>
            <span className="text-[13px] font-bold tracking-widest uppercase text-gray-700">BATC</span>
            <span className="text-xs text-gray-400">· Bauang Agricultural Trade Center</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Bauang, La Union. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
