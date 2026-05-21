import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  X, Pencil, Archive, ArchiveRestore,
  ShieldCheck, Shield, Clock, ShieldAlert,
  User, FileText, Eye, ZoomIn, ZoomOut,
  CheckCircle2, XCircle,
} from "lucide-react";
import { farmersApi, type VerificationStatus } from "../api/farmers.api";
import { WizardShell } from "./FarmerWizard/WizardShell";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const VSTYLE: Record<VerificationStatus, { label: string; cls: string; icon: React.ElementType }> = {
  VERIFIED:   { label: "Verified",       cls: "bg-[#EAF3DE] text-[#27500A]", icon: ShieldCheck },
  PENDING:    { label: "Pending Review", cls: "bg-amber-50 text-amber-700",  icon: Clock       },
  REJECTED:   { label: "Rejected",       cls: "bg-red-50 text-red-700",      icon: ShieldAlert },
  UNVERIFIED: { label: "Unverified",     cls: "bg-gray-100 text-gray-500",   icon: Shield      },
};

// ── Document Lightbox ────────────────────────────────────────────────────────
interface LightboxProps {
  url: string;
  farmerName: string;
  currentStatus: VerificationStatus;
  onVerify: (status: VerificationStatus) => void;
  verifying: boolean;
  onClose: () => void;
}

function DocLightbox({ url, farmerName, currentStatus, onVerify, verifying, onClose }: LightboxProps) {
  const isPdf = url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("application/pdf");
  const [zoom, setZoom] = useState(1);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    // Full-screen overlay — z-[200] sits above the drawer (z-50) and its backdrop (z-40)
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "rgba(0,0,0,0.85)" }}>

      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={16} className="text-gray-300 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">Verification Document</p>
            <p className="text-xs text-gray-400 truncate">{farmerName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls (image only) */}
          {!isPdf && (
            <>
              <button
                onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                disabled={zoom <= 0.5}
                className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-xs text-gray-400 tabular-nums w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                disabled={zoom >= 3}
                className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={15} />
              </button>
              <div className="w-px h-4 bg-white/20 mx-1" />
            </>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-white/10 hover:bg-white/20 transition-colors"
            title="Close (Esc)"
          >
            <X size={15} /> Close
          </button>
        </div>
      </div>

      {/* ── Document area ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        {isPdf ? (
          <iframe
            src={url}
            title="Verification document"
            className="w-full max-w-3xl rounded-lg shadow-2xl bg-white"
            style={{ height: "calc(100vh - 200px)", minHeight: 400 }}
          />
        ) : (
          <img
            src={url}
            alt="Verification document"
            className="rounded-lg shadow-2xl max-w-none transition-transform duration-150 select-none"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              maxWidth: zoom <= 1 ? "100%" : "none",
            }}
            draggable={false}
          />
        )}
      </div>

      {/* ── Action bar ─────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-black/70 border-t border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(() => {
            const s = VSTYLE[currentStatus] ?? VSTYLE.UNVERIFIED;
            const Icon = s.icon;
            return (
              <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold", s.cls)}>
                <Icon size={12} /> {s.label}
              </span>
            );
          })()}
          <span className="text-xs text-gray-400">Current status</span>
        </div>

        <div className="flex items-center gap-2">
          {currentStatus !== "VERIFIED" && (
            <button
              onClick={() => { onVerify("VERIFIED"); onClose(); }}
              disabled={verifying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#3B6D11] hover:bg-[#2f5a0d] disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 size={14} /> Mark Verified
            </button>
          )}
          {currentStatus !== "REJECTED" && (
            <button
              onClick={() => { onVerify("REJECTED"); onClose(); }}
              disabled={verifying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <XCircle size={14} /> Reject
            </button>
          )}
          {(currentStatus === "VERIFIED" || currentStatus === "REJECTED") && (
            <button
              onClick={() => { onVerify("UNVERIFIED"); onClose(); }}
              disabled={verifying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              <Shield size={14} /> Reset to Unverified
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Drawer ───────────────────────────────────────────────────────────────────

interface Props {
  farmerId: number;
  isAdmin: boolean;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-xs text-gray-800 font-medium">{value ?? "—"}</span>
    </div>
  );
}

export function FarmerDetailDrawer({ farmerId, isAdmin, onClose }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data: farmer, isLoading } = useQuery({
    queryKey: ["farmer", farmerId],
    queryFn: () => farmersApi.retrieve(farmerId),
  });

  const archiveMut = useMutation({
    mutationFn: () =>
      farmer!.is_archived ? farmersApi.unarchive(farmerId) : farmersApi.archive(farmerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmers"] });
      qc.invalidateQueries({ queryKey: ["farmer", farmerId] });
      toast.success(farmer!.is_archived ? "Farmer unarchived." : "Farmer archived.");
    },
  });

  const verifyMut = useMutation({
    mutationFn: (vstatus: VerificationStatus) =>
      farmersApi.verify(farmerId, { verification_status: vstatus }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["farmers"] });
      qc.setQueryData(["farmer", farmerId], updated);
      toast.success("Verification status updated.");
    },
  });

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  return (
    <>
      {/* Drawer backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer panel */}
      <aside className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="font-semibold text-gray-900">Farmer Profile</h2>
          <div className="flex items-center gap-2">
            {isAdmin && farmer && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-[#3B6D11] rounded transition-colors"
                  title="Edit farmer"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => archiveMut.mutate()}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                  title={farmer.is_archived ? "Unarchive" : "Archive"}
                >
                  {farmer.is_archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {isLoading && (
            <div className="space-y-3 pt-2">
              {[80, 60, 100, 60].map((w, i) => (
                <div key={i} className="h-3 rounded bg-gray-100 animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}

          {farmer && (
            <>
              {/* Profile header */}
              <div className="flex items-start gap-3">
                {farmer.profile_photo ? (
                  <img
                    src={farmer.profile_photo}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover border-2 border-[var(--color-brand-200)] shrink-0"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[var(--color-brand-100)] shrink-0"
                    style={{ background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}
                  >
                    <User size={24} />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{farmer.full_name}</h3>
                  <p className="text-sm text-gray-500">
                    {farmer.barangay}{farmer.sitio ? `, ${farmer.sitio}` : ""}
                  </p>
                  {farmer.is_archived && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">
                      Archived
                    </span>
                  )}
                </div>
              </div>

              {/* Personal */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Personal</p>
                <Row label="Sex" value={farmer.sex === "M" ? "Male" : "Female"} />
                <Row label="Date of birth" value={farmer.dob ? format(new Date(farmer.dob), "MMM d, yyyy") : null} />
                <Row label="Civil status" value={farmer.civil_status} />
                <Row label="Education" value={farmer.highest_education?.replace("_", " ")} />
                <Row label="Mobile" value={farmer.mobile_number} />
                <Row label="RSBSA Ref." value={farmer.rsbsa_reference} />
              </section>

              {/* Special categories */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Special Categories
                </p>
                <div className="flex gap-2">
                  {farmer.is_4ps && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">4Ps</span>
                  )}
                  {farmer.is_pwd && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">PWD</span>
                  )}
                  {farmer.is_ip && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">IP</span>
                  )}
                  {!farmer.is_4ps && !farmer.is_pwd && !farmer.is_ip && (
                    <span className="text-xs text-gray-400">None</span>
                  )}
                </div>
              </section>

              {/* Farm */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Farm</p>
                <Row label="Livelihood" value={farmer.livelihood_type.replace("_", " ")} />
                <Row label="Total area" value={`${farmer.farm_area_ha} ha`} />
                <Row label="Household size" value={farmer.household_size} />
              </section>

              {farmer.parcels.length > 0 && (
                <section>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Farm Parcels
                  </p>
                  {farmer.parcels.map((p, i) => (
                    <div key={i} className="text-xs text-gray-700 py-1.5 border-b border-gray-100 last:border-0">
                      {p.area_ha} ha · {p.commodity} · {p.land_type.replace("_", " ")} · {p.ownership_type}
                    </div>
                  ))}
                </section>
              )}

              {/* ── Verification ───────────────────────────────────────── */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Verification
                </p>

                {(() => {
                  const vs = farmer.verification_status as VerificationStatus;
                  const s = VSTYLE[vs] ?? VSTYLE.UNVERIFIED;
                  const Icon = s.icon;

                  return (
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      {/* Status row */}
                      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold",
                          s.cls,
                        )}>
                          <Icon size={11} /> {s.label}
                        </span>

                        {/* View document button */}
                        {farmer.verification_document ? (
                          <button
                            onClick={() => setLightboxOpen(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white rounded-md bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] transition-colors"
                          >
                            <Eye size={12} /> View Document
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No document uploaded</span>
                        )}
                      </div>

                      {/* Document thumbnail (if image) */}
                      {farmer.verification_document && (() => {
                        const isPdf = farmer.verification_document.toLowerCase().includes(".pdf");
                        return !isPdf ? (
                          <button
                            onClick={() => setLightboxOpen(true)}
                            className="block w-full group relative overflow-hidden bg-gray-100"
                            style={{ maxHeight: 160 }}
                            title="Click to view full document"
                          >
                            <img
                              src={farmer.verification_document}
                              alt="Verification document thumbnail"
                              className="w-full object-cover object-top transition-opacity group-hover:opacity-80"
                              style={{ maxHeight: 160 }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-lg text-xs font-semibold text-gray-800 shadow">
                                <ZoomIn size={13} /> View full size
                              </span>
                            </div>
                          </button>
                        ) : (
                          <button
                            onClick={() => setLightboxOpen(true)}
                            className="flex items-center gap-3 px-3 py-3 w-full hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-8 h-10 rounded bg-red-100 flex items-center justify-center shrink-0">
                              <FileText size={16} className="text-red-500" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-medium text-gray-700">PDF Document</p>
                              <p className="text-[11px] text-gray-400 group-hover:text-[var(--color-brand-600)] transition-colors">
                                Click to open preview
                              </p>
                            </div>
                            <Eye size={14} className="ml-auto text-gray-300 group-hover:text-[var(--color-brand-600)] transition-colors" />
                          </button>
                        );
                      })()}

                      {/* Action buttons */}
                      <div className="px-3 py-2.5 flex gap-2 flex-wrap border-t border-gray-100 bg-white">
                        {(["VERIFIED", "REJECTED", "UNVERIFIED"] as VerificationStatus[]).map((vstatus) => {
                          if (vstatus === vs) return null;
                          return (
                            <button
                              key={vstatus}
                              onClick={() => verifyMut.mutate(vstatus)}
                              disabled={verifyMut.isPending}
                              className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors disabled:opacity-50",
                                vstatus === "VERIFIED"
                                  ? "border-[#3B6D11] text-[#3B6D11] hover:bg-[#EAF3DE]"
                                  : vstatus === "REJECTED"
                                    ? "border-red-400 text-red-600 hover:bg-red-50"
                                    : "border-gray-300 text-gray-500 hover:bg-gray-50",
                              )}
                            >
                              {vstatus === "VERIFIED" && <CheckCircle2 size={11} />}
                              {vstatus === "REJECTED" && <XCircle size={11} />}
                              {vstatus === "UNVERIFIED" && <Shield size={11} />}
                              Mark {vstatus.charAt(0) + vstatus.slice(1).toLowerCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </section>

              {/* DPA & Meta */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">DPA & Meta</p>
                <Row
                  label="DPA Consent"
                  value={
                    farmer.consent_dpa
                      ? `Yes — ${farmer.consent_dpa_at ? format(new Date(farmer.consent_dpa_at), "MMM d, yyyy HH:mm") : ""}`
                      : "No"
                  }
                />
                <Row label="Encoded by" value={farmer.encoded_by_name} />
                <Row label="Registered" value={format(new Date(farmer.created_at), "MMM d, yyyy")} />
              </section>
            </>
          )}
        </div>
      </aside>

      {/* Document lightbox */}
      {lightboxOpen && farmer?.verification_document && (
        <DocLightbox
          url={farmer.verification_document}
          farmerName={farmer.full_name}
          currentStatus={farmer.verification_status as VerificationStatus}
          onVerify={(vstatus) => verifyMut.mutate(vstatus)}
          verifying={verifyMut.isPending}
          onClose={closeLightbox}
        />
      )}

      {/* Edit wizard */}
      {editing && farmer && (
        <WizardShell
          editFarmer={{
            id: farmer.id,
            first_name: farmer.first_name,
            middle_name: farmer.middle_name,
            last_name: farmer.last_name,
            suffix: farmer.suffix,
            sex: farmer.sex as any,
            dob: farmer.dob,
            civil_status: farmer.civil_status as any,
            highest_education: farmer.highest_education as any,
            mobile_number: farmer.mobile_number,
            is_4ps: farmer.is_4ps,
            is_pwd: farmer.is_pwd,
            is_ip: farmer.is_ip,
            rsbsa_reference: farmer.rsbsa_reference ?? undefined,
            barangay: farmer.barangay,
            sitio: farmer.sitio,
            livelihood_type: farmer.livelihood_type as any,
            farm_area_ha: farmer.farm_area_ha,
            household_size: farmer.household_size,
            consent_dpa: true,
            linked_user_id: (farmer as any).linked_user_id ?? null,
            parcels: farmer.parcels.map((p) => ({
              area_ha: p.area_ha,
              commodity: p.commodity,
              land_type: p.land_type as any,
              ownership_type: p.ownership_type as any,
            })),
          }}
          onClose={() => {
            setEditing(false);
            qc.invalidateQueries({ queryKey: ["farmer", farmerId] });
          }}
        />
      )}
    </>
  );
}
