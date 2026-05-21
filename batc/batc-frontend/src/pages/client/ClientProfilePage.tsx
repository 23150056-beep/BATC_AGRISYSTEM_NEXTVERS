import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { farmersApi } from "@/features/farmers/api/farmers.api";
import { format } from "date-fns";
import {
  AlertTriangle, User, Camera, Pencil, X, Check, Loader2,
  ShieldCheck, ShieldAlert, Clock, Shield, Upload, FileText,
  RotateCcw, ExternalLink,
} from "lucide-react";
import { Card, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Canvas-based image compression ─────────────────────────────────────────
async function compressImage(file: File, maxPx = 800, quality = 0.82): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (Math.max(width, height) > maxPx) {
        if (width >= height) { height = Math.round((height / width) * maxPx); width = maxPx; }
        else { width = Math.round((width / height) * maxPx); height = maxPx; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Canvas compression failed")); return; }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
      }, "image/jpeg", quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Verification badge (inline) ─────────────────────────────────────────────
const VSTYLE: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  VERIFIED:   { label: "Verified",       cls: "bg-[#EAF3DE] text-[#27500A]", icon: ShieldCheck  },
  PENDING:    { label: "Pending Review", cls: "bg-amber-50 text-amber-700",  icon: Clock        },
  REJECTED:   { label: "Rejected",       cls: "bg-red-50 text-red-700",      icon: ShieldAlert  },
  UNVERIFIED: { label: "Unverified",     cls: "bg-gray-100 text-gray-500",   icon: Shield       },
};

function VerificationBadge({ status }: { status: string }) {
  const s = VSTYLE[status] ?? VSTYLE.UNVERIFIED;
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", s.cls)}>
      <Icon size={11} />
      {s.label}
    </span>
  );
}

// ── Info row ────────────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-400 w-32 md:w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value ?? "—"}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <Card className="px-4 py-1">{children}</Card>
    </section>
  );
}

// ── Profile photo avatar ────────────────────────────────────────────────────
function PhotoAvatar({ src, name, size = 64 }: { src?: string | null; name?: string; size?: number }) {
  const initials = name
    ? name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return src ? (
    <img
      src={src}
      alt="Profile photo"
      className="rounded-full object-cover border-2 border-[var(--color-brand-200)] shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center shrink-0 border-2 border-[var(--color-brand-200)]"
      style={{ width: size, height: size, background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}
    >
      {name ? (
        <span className="text-lg font-bold">{initials}</span>
      ) : (
        <User size={size * 0.4} />
      )}
    </div>
  );
}

// ── Standalone Verification Section ────────────────────────────────────────
// Always visible — farmers can upload / re-upload without entering edit mode.
interface VerifSectionProps {
  status: string;
  existingDoc: string | null;
  is4ps: boolean;
  isPwd: boolean;
  isIp: boolean;
  onSubmit: (file: File) => void;
  isPending: boolean;
}

function VerificationSection({
  status, existingDoc, is4ps, isPwd, isIp, onSubmit, isPending,
}: VerifSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (f.size > 5 * 1024 * 1024) { toast.error("File must be under 5 MB."); return; }
    setFile(f);
  }

  function handleSubmit() {
    if (!file) return;
    onSubmit(file);
    setFile(null);
  }

  const hasCriteria = is4ps || isPwd || isIp;

  // ── VERIFIED ──────────────────────────────────────────────────────────────
  if (status === "VERIFIED") {
    return (
      <div className="flex items-start gap-3 bg-[#F7FAF3] border border-[#D6E8BF] rounded-xl p-4">
        <ShieldCheck size={20} className="text-[#3B6D11] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#27500A]">Your account is verified</p>
          <p className="text-xs text-[#3B6D11] mt-0.5 leading-relaxed">
            Your identity has been confirmed by BATC staff. You may have priority access to certain programs.
          </p>
          {existingDoc && (
            <a
              href={existingDoc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-[var(--color-brand-600)] hover:underline font-medium"
            >
              <ExternalLink size={11} /> View submitted document
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── PENDING ───────────────────────────────────────────────────────────────
  if (status === "PENDING") {
    return (
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <Clock size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">Verification under review</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            Your document has been submitted and is currently being reviewed by BATC staff.
            You'll be notified once it's processed.
          </p>
          {existingDoc && (
            <a
              href={existingDoc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-amber-700 hover:underline font-medium"
            >
              <ExternalLink size={11} /> View submitted document
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── UNVERIFIED or REJECTED — show upload zone ─────────────────────────────
  const isRejected = status === "REJECTED";

  return (
    <div className={cn(
      "rounded-xl border p-4 space-y-4",
      isRejected ? "bg-red-50 border-red-200" : "bg-[#F7FAF3] border-[#D6E8BF]",
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        {isRejected
          ? <ShieldAlert size={20} className="text-red-500 shrink-0 mt-0.5" />
          : <Shield size={20} className="text-[#3B6D11] shrink-0 mt-0.5" />
        }
        <div>
          <p className={cn("text-sm font-semibold", isRejected ? "text-red-800" : "text-[#27500A]")}>
            {isRejected ? "Verification was not approved" : "Complete your verification"}
          </p>
          <p className={cn("text-xs mt-0.5 leading-relaxed", isRejected ? "text-red-700" : "text-[#3B6D11]")}>
            {isRejected
              ? "Your document was reviewed but could not be accepted. Please upload a clearer or more complete document and resubmit."
              : hasCriteria
                ? "You are registered as a 4Ps / PWD / IP beneficiary. Upload your supporting document to be verified and gain priority access to programs."
                : "Upload a valid government-issued ID or barangay certification to verify your identity."
            }
          </p>
        </div>
      </div>

      {/* Accepted document types */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { flag: is4ps, label: "4Ps card / certificate", show: true },
          { flag: isPwd, label: "PWD ID / certificate",   show: true },
          { flag: isIp,  label: "NCIP certificate (IP)",  show: true },
        ].map((c, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs",
              c.flag
                ? "border-[var(--color-brand-300)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)] font-medium"
                : "border-gray-200 bg-white text-gray-400",
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.flag ? "bg-[var(--color-brand-500)]" : "bg-gray-200")} />
            {c.label}
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl transition-colors",
          file ? "border-[var(--color-brand-400)] bg-[var(--color-brand-50)]" : "border-gray-200 bg-white hover:border-[var(--color-brand-300)]",
        )}
      >
        {file ? (
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={18} className="text-[var(--color-brand-600)] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              title="Remove file"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer">
            <Upload size={22} className="text-gray-300" />
            <div className="text-center">
              <p className="text-sm text-gray-500">
                <span className="text-[var(--color-brand-600)] font-semibold">Click to upload</span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or PDF — max 5 MB</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </label>
        )}
      </div>

      {/* Submit button */}
      <div className="flex items-center justify-between gap-3">
        {existingDoc && isRejected && (
          <a
            href={existingDoc}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
          >
            <ExternalLink size={11} /> View previous document
          </a>
        )}
        <div className="ml-auto flex items-center gap-2">
          {file && (
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <RotateCcw size={11} /> Clear
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || isPending}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed",
              isRejected ? "bg-red-600 hover:bg-red-700" : "bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)]",
            )}
          >
            {isPending
              ? <><Loader2 size={12} className="animate-spin" /> Uploading…</>
              : isRejected
                ? <><Upload size={12} /> Re-submit document</>
                : <><Upload size={12} /> Submit for verification</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export function ClientProfilePage() {
  const qc = useQueryClient();
  const { data: farmer, isLoading, isError } = useQuery({
    queryKey: ["farmer-me"],
    queryFn: farmersApi.me,
    retry: false,
  });

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [mobileEdit, setMobileEdit] = useState("");
  const [sitioedit, setSitioedit] = useState("");
  const [civilEdit, setCivilEdit] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Shared update mutation
  const updateMutation = useMutation({
    mutationFn: (fd: FormData) => farmersApi.updateMe(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-me"] });
      setEditing(false);
      setPhotoPreview(null);
      setPhotoFile(null);
      setSaveError(null);
      toast.success("Profile updated.");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to save. Please try again.";
      setSaveError(msg);
    },
  });

  // Dedicated verification upload mutation (separate from profile edit)
  const verifyMutation = useMutation({
    mutationFn: (fd: FormData) => farmersApi.updateMe(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-me"] });
      toast.success("Document submitted! Staff will review it shortly.");
    },
    onError: () => {
      toast.error("Upload failed. Please try again.");
    },
  });

  function handleVerificationSubmit(file: File) {
    const fd = new FormData();
    fd.append("verification_document", file);
    verifyMutation.mutate(fd);
  }

  function startEditing() {
    if (!farmer) return;
    setMobileEdit(farmer.mobile_number ?? "");
    setSitioedit(farmer.sitio ?? "");
    setCivilEdit(farmer.civil_status ?? "");
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setPhotoPreview(null);
    setPhotoFile(null);
    setSaveError(null);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } finally {
      setCompressing(false);
    }
  }

  function handleSave() {
    const fd = new FormData();
    if (mobileEdit !== farmer?.mobile_number) fd.append("mobile_number", mobileEdit);
    if (sitioedit !== farmer?.sitio) fd.append("sitio", sitioedit);
    if (civilEdit !== farmer?.civil_status) fd.append("civil_status", civilEdit);
    if (photoFile) fd.append("profile_photo", photoFile);
    if ([...fd.entries()].length === 0) { cancelEditing(); return; }
    updateMutation.mutate(fd);
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-0 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Card className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-3.5 w-full" />)}
        </Card>
      </div>
    );
  }

  // ── No profile ───────────────────────────────────────────────────────────
  if (isError || !farmer) {
    return (
      <div className="p-4 md:p-0">
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-center">
          <AlertTriangle className="mx-auto text-amber-500 mb-2" size={28} />
          <p className="text-sm font-semibold text-amber-800 mb-1">No farmer profile linked</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Please visit your barangay agricultural office to register as a farmer.
          </p>
        </div>
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-0 space-y-5">

      {/* ── Profile header ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        {/* Avatar + camera button */}
        <div className="relative shrink-0">
          <PhotoAvatar
            src={editing && photoPreview ? photoPreview : farmer.profile_photo}
            name={farmer.full_name}
            size={64}
          />
          {editing && (
            <>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={compressing}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--color-brand-600)] text-white flex items-center justify-center shadow hover:bg-[var(--color-brand-700)] transition-colors"
                title="Change photo"
              >
                {compressing
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Camera size={12} />
                }
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </>
          )}
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brand-600)]">
            Profile
          </p>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mt-0.5">
            {farmer.full_name}
          </h2>
          <p className="text-sm text-gray-500">
            {farmer.barangay}{farmer.sitio ? `, Sitio ${farmer.sitio}` : ""}
          </p>
          <div className="flex flex-wrap gap-2 mt-1.5 items-center">
            <VerificationBadge status={farmer.verification_status} />
            {farmer.is_4ps && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">4Ps</span>
            )}
            {farmer.is_pwd && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">PWD</span>
            )}
            {farmer.is_ip && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">IP</span>
            )}
          </div>
        </div>

        {/* Edit / Save / Cancel */}
        <div className="shrink-0">
          {editing ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEditing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={12} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending || compressing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-[var(--color-brand-600)] rounded-lg hover:bg-[var(--color-brand-700)] disabled:opacity-60 transition-colors"
              >
                {updateMutation.isPending
                  ? <><Loader2 size={12} className="animate-spin" /> Saving…</>
                  : <><Check size={12} /> Save</>
                }
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--color-brand-600)] border border-[var(--color-brand-300)] rounded-lg hover:bg-[var(--color-brand-50)] transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {saveError}
        </p>
      )}

      {/* ── Verification section (always visible) ──────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Verification
        </p>
        <VerificationSection
          status={farmer.verification_status}
          existingDoc={farmer.verification_document}
          is4ps={farmer.is_4ps}
          isPwd={farmer.is_pwd}
          isIp={farmer.is_ip}
          onSubmit={handleVerificationSubmit}
          isPending={verifyMutation.isPending}
        />
      </section>

      {/* ── Info sections ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard title="Personal Information">
          <Row label="Sex" value={farmer.sex === "M" ? "Male" : "Female"} />
          <Row
            label="Date of birth"
            value={farmer.dob ? format(new Date(farmer.dob), "MMMM d, yyyy") : null}
          />
          <Row
            label="Civil status"
            value={
              editing ? (
                <select
                  value={civilEdit}
                  onChange={(e) => setCivilEdit(e.target.value)}
                  className="text-sm border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
                >
                  {["SINGLE", "MARRIED", "WIDOWED", "SEPARATED", "COMMON_LAW"].map((v) => (
                    <option key={v} value={v}>{v.replace("_", "-")}</option>
                  ))}
                </select>
              ) : farmer.civil_status
            }
          />
          <Row
            label="Mobile"
            value={
              editing ? (
                <input
                  type="tel"
                  value={mobileEdit}
                  onChange={(e) => setMobileEdit(e.target.value)}
                  className="text-sm border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] w-40"
                />
              ) : farmer.mobile_number
            }
          />
          <Row label="RSBSA Ref." value={farmer.rsbsa_reference} />
        </SectionCard>

        <SectionCard title="Farm Information">
          <Row label="Livelihood" value={farmer.livelihood_type.replace("_", " ")} />
          <Row label="Total farm area" value={`${farmer.farm_area_ha} ha`} />
          <Row label="Household size" value={farmer.household_size} />
          <Row
            label="Sitio"
            value={
              editing ? (
                <input
                  type="text"
                  value={sitioedit}
                  onChange={(e) => setSitioedit(e.target.value)}
                  placeholder="(optional)"
                  className="text-sm border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] w-40"
                />
              ) : (farmer.sitio || "—")
            }
          />
        </SectionCard>
      </div>

      {farmer.parcels.length > 0 && (
        <SectionCard title="Farm Parcels">
          {farmer.parcels.map((p, i) => (
            <div
              key={i}
              className="text-sm text-gray-700 py-2.5 border-b border-gray-100 last:border-0"
            >
              <span className="font-medium">{p.area_ha} ha</span>
              {" — "}
              {p.commodity}{" "}
              <span className="text-gray-500 text-xs">
                ({p.land_type.replace("_", " ")}, {p.ownership_type})
              </span>
            </div>
          ))}
        </SectionCard>
      )}

      <p className="text-xs text-gray-400 text-center pb-2">
        DPA consent given{" "}
        {farmer.consent_dpa_at ? format(new Date(farmer.consent_dpa_at), "MMM d, yyyy") : ""}
      </p>
    </div>
  );
}
