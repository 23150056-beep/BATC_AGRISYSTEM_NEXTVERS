import apiClient from "@/services/api/client";
import type { PaginatedResponse, User } from "@/types";

export interface FarmParcel {
  id?: number;
  area_ha: string;
  commodity: string;
  land_type: string;
  ownership_type: string;
}

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export interface FarmerListItem {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  barangay: string;
  mobile_number: string;
  livelihood_type: string;
  is_4ps: boolean;
  is_pwd: boolean;
  is_ip: boolean;
  consent_dpa: boolean;
  is_archived: boolean;
  created_at: string;
  encoded_by_name: string | null;
  profile_photo: string | null;
  verification_status: VerificationStatus;
  is_verified: boolean;
}

export interface FarmerDetail extends FarmerListItem {
  middle_name: string;
  suffix: string;
  sex: string;
  dob: string;
  civil_status: string;
  highest_education: string;
  rsbsa_reference: string | null;
  sitio: string;
  farm_area_ha: string;
  household_size: number;
  consent_dpa_at: string | null;
  archived_at: string | null;
  updated_at: string;
  parcels: FarmParcel[];
  verification_document: string | null;
  linked_user_id: number | null;
  linked_user_name: string | null;
}

export interface FarmerWritePayload {
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  sex: string;
  dob: string;
  civil_status: string;
  highest_education: string;
  mobile_number: string;
  is_4ps: boolean;
  is_pwd: boolean;
  is_ip: boolean;
  rsbsa_reference?: string;
  barangay: string;
  sitio?: string;
  livelihood_type: string;
  farm_area_ha: string;
  household_size: number;
  consent_dpa: boolean;
  parcels: FarmParcel[];
  linked_user_id?: number | null;
}

export const farmersApi = {
  list: (params?: {
    search?: string;
    barangay?: string;
    page?: number;
    /** "true" = archived only, "all" = both, anything else = active only. */
    archived?: "true" | "all" | "false";
  }) =>
    apiClient.get<PaginatedResponse<FarmerListItem>>("/farmers/", { params }).then((r) => r.data),

  retrieve: (id: number) =>
    apiClient.get<FarmerDetail>(`/farmers/${id}/`).then((r) => r.data),

  create: (payload: FarmerWritePayload) =>
    apiClient.post<FarmerDetail>("/farmers/", payload).then((r) => r.data),

  update: (id: number, payload: Partial<FarmerWritePayload>) =>
    apiClient.patch<FarmerDetail>(`/farmers/${id}/`, payload).then((r) => r.data),

  archive: (id: number) =>
    apiClient.patch<FarmerDetail>(`/farmers/${id}/archive/`).then((r) => r.data),

  unarchive: (id: number) =>
    apiClient.patch<FarmerDetail>(`/farmers/${id}/unarchive/`).then((r) => r.data),

  me: () =>
    apiClient.get<FarmerDetail>("/farmers/me/").then((r) => r.data),

  /** PATCH /farmers/me/ — self-update limited fields (FormData for file uploads). */
  updateMe: (formData: FormData) =>
    apiClient
      .patch<FarmerDetail>("/farmers/me/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  /** Staff/admin: update verification status for a specific farmer. */
  verify: (id: number, payload: { verification_status: VerificationStatus }) =>
    apiClient.patch<FarmerDetail>(`/farmers/${id}/verify/`, payload).then((r) => r.data),

  /** Public — no auth token required. Creates User + Farmer atomically and
   *  returns JWT tokens so the caller can log the farmer in immediately. */
  selfRegister: (payload: FarmerWritePayload & {
    username: string;
    password: string;
    confirm_password: string;
    verification_document?: File;
  }) => {
    const form = new FormData();
    const { verification_document, ...rest } = payload;
    // Append all non-file fields
    (Object.keys(rest) as (keyof typeof rest)[]).forEach((k) => {
      const v = rest[k];
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        form.append(k, JSON.stringify(v));
      } else {
        form.append(k, String(v));
      }
    });
    if (verification_document) {
      form.append("verification_document", verification_document);
    }
    return apiClient
      .post<{ access: string; refresh: string; user: User; farmer: FarmerDetail }>(
        "/auth/register/",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then((r) => r.data);
  },
};
