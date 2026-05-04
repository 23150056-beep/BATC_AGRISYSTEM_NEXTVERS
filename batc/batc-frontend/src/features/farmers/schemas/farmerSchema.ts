import { z } from "zod";

// Zod v4 dropped `required_error` / `errorMap` options.
// Use the plain string second-argument form or { error: "..." } instead.

const parcelSchema = z.object({
  area_ha:        z.string().min(1, "Required"),
  commodity:      z.string().min(1, "Required"),
  land_type:      z.enum(["IRRIGATED", "RAINFED_UPLAND", "RAINFED_LOWLAND"]),
  ownership_type: z.enum(["OWNED", "TENANT", "LESSEE", "CARETAKER"]),
});

// ---------------------------------------------------------------------------
// Base farmer schema (staff wizard)
// ---------------------------------------------------------------------------
export const farmerSchema = z.object({
  // Step 1 — Personal
  first_name:        z.string().min(1, "Required"),
  middle_name:       z.string().optional(),
  last_name:         z.string().min(1, "Required"),
  suffix:            z.string().optional(),
  sex:               z.enum(["M", "F"]),
  dob:               z.string().min(1, "Required"),
  civil_status:      z.enum(["SINGLE", "MARRIED", "WIDOWED", "SEPARATED", "COMMON_LAW"]),
  highest_education: z
    .enum(["NONE", "ELEMENTARY", "HIGH_SCHOOL", "VOCATIONAL", "COLLEGE", "POST_GRAD"])
    .default("ELEMENTARY"),
  mobile_number: z
    .string()
    .regex(/^(09|\+639)\d{9}$/, "Enter a valid PH mobile number (09XXXXXXXXX)"),
  is_4ps: z.boolean().default(false),
  is_pwd: z.boolean().default(false),
  is_ip:  z.boolean().default(false),

  // Step 2 — Address
  barangay:         z.string().min(1, "Select a barangay"),
  sitio:            z.string().optional(),
  rsbsa_reference:  z.string().optional(),

  // Step 3 — Farm + DPA
  livelihood_type: z
    .enum(["RICE", "CORN", "VEGETABLE", "FRUIT", "LIVESTOCK", "POULTRY", "FISHERY", "OTHER"])
    .default("RICE"),
  farm_area_ha:    z.string().min(1, "Required"),
  household_size:  z.coerce.number().int().min(1, "At least 1"),
  parcels:         z.array(parcelSchema).default([]),
  linked_user_id:  z.coerce.number().int().nullable().optional(),
  consent_dpa:     z.literal(true, "You must agree to the Data Privacy Act consent to proceed."),
});

export type FarmerFormValues = z.infer<typeof farmerSchema>;

// ---------------------------------------------------------------------------
// Self-registration schema (public page — farmer creates their own account)
// Extends the farmer schema with account-creation fields.
// ---------------------------------------------------------------------------
export const selfRegistrationSchema = farmerSchema
  .extend({
    username: z
      .string()
      .min(3, "At least 3 characters")
      .max(150, "Too long")
      .regex(
        /^\w+$/,
        "Letters, numbers, and underscores only (no spaces)"
      ),
    password: z.string().min(8, "At least 8 characters"),
    confirm_password: z.string().min(1, "Required"),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type SelfRegistrationValues = z.infer<typeof selfRegistrationSchema>;
