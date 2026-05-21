/**
 * Shared constants — keep in sync with `apps/farmers/constants.py` on the
 * backend (BAUANG_BARANGAYS) and `apps/announcements/models.py` (segments).
 */

export const BAUANG_BARANGAYS = [
  "Baccuit Norte",
  "Baccuit Sur",
  "Bagbag",
  "Ballay",
  "Bella Union",
  "Bili",
  "Bungro",
  "Cabaroan (Poro)",
  "Calumbaya",
  "Carmay",
  "Casilagan",
  "Central East (Poblacion)",
  "Central West (Poblacion)",
  "Dili",
  "Disso-or",
  "Guerrero",
  "Lasip",
  "Lingsat",
  "Mabanbanag",
  "Maoasoas",
  "Pagdalagan Norte",
  "Pagdalagan Sur",
  "Palina East",
  "Palina West",
  "Penroad (Sao-it)",
  "Piayong",
  "Picinan",
  "Pindangan East",
  "Pindangan West",
  "Quintarong",
  "Rabon",
  "Ramot",
  "San Agustin (Pugo)",
  "San Felipe",
  "San Isidro (Baraoas)",
  "San Juan",
  "San Luis",
  "Santa Monica",
  "Sapilang",
] as const;

export type Barangay = (typeof BAUANG_BARANGAYS)[number];

/** Farmer subgroup flags (match `Announcement.target_segments` on the backend). */
export const FARMER_SEGMENTS = ["4PS", "PWD", "IP"] as const;
export type FarmerSegment = (typeof FARMER_SEGMENTS)[number];

export const SEGMENT_LABELS: Record<FarmerSegment, string> = {
  "4PS": "4Ps",
  PWD: "PWD",
  IP: "Indigenous People",
};
