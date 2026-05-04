/**
 * All static demo data — mirrors seed_demo + seed_rich_demo exactly.
 * Mutable arrays (let) are mutated in-place by handlers so state changes
 * (approve, status update, etc.) persist within a browser session.
 */

// ── Token helpers ────────────────────────────────────────────────────────────
// We build syntactically valid JWTs so authStore.isAuthenticated() works.
// The payload carries exp=9999999999 (year 2286) so it never expires.
function makeJwt(username: string, userId: number): string {
  const hdr = btoa('{"alg":"none","typ":"JWT"}');
  const pay = btoa(
    JSON.stringify({ user_id: userId, username, exp: 9999999999, iat: 1746403200 })
  );
  return `${hdr}.${pay}.mock-sig`;
}

export const CREDENTIALS: Record<string, string> = {
  admin:   "admin1234",
  staff01: "staff1234",
  staff02: "staff1234",
  staff03: "staff1234",
  farmer01: "farmer1234",
  farmer02: "farmer1234",
  farmer03: "farmer1234",
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const USERS = [
  { id:1, username:"admin",    email:"", first_name:"Ana",     last_name:"Reyes",    full_name:"Ana Reyes",       role:"ADMIN",  is_active:true, is_archived:false, date_joined:"2026-01-01T00:00:00Z", last_login:"2026-05-04T08:00:00Z" },
  { id:2, username:"staff01",  email:"", first_name:"Ben",     last_name:"Santos",   full_name:"Ben Santos",      role:"STAFF",  is_active:true, is_archived:false, date_joined:"2026-01-01T00:00:00Z", last_login:"2026-05-04T08:05:00Z" },
  { id:3, username:"staff02",  email:"", first_name:"Carla",   last_name:"Dela Cruz",full_name:"Carla Dela Cruz", role:"STAFF",  is_active:true, is_archived:false, date_joined:"2026-01-01T00:00:00Z", last_login:null },
  { id:4, username:"staff03",  email:"", first_name:"Diego",   last_name:"Lim",      full_name:"Diego Lim",       role:"STAFF",  is_active:true, is_archived:false, date_joined:"2026-01-01T00:00:00Z", last_login:null },
  { id:5, username:"farmer01", email:"", first_name:"Eduardo", last_name:"Aguilar",  full_name:"Eduardo Aguilar", role:"CLIENT", is_active:true, is_archived:false, date_joined:"2026-01-01T00:00:00Z", last_login:"2026-05-04T09:00:00Z" },
  { id:6, username:"farmer02", email:"", first_name:"Fiona",   last_name:"Bautista", full_name:"Fiona Bautista",  role:"CLIENT", is_active:true, is_archived:false, date_joined:"2026-01-01T00:00:00Z", last_login:null },
  { id:7, username:"farmer03", email:"", first_name:"George",  last_name:"Castillo", full_name:"George Castillo", role:"CLIENT", is_active:true, is_archived:false, date_joined:"2026-01-01T00:00:00Z", last_login:null },
];

export function getTokens(username: string) {
  const u = USERS.find(u => u.username === username)!;
  return { access: makeJwt(username, u.id), refresh: makeJwt(username + "-r", u.id) };
}

export function userFromToken(authHeader: string | null) {
  try {
    const tok = (authHeader ?? "").replace("Bearer ", "");
    const { username } = JSON.parse(atob(tok.split(".")[1]));
    return USERS.find(u => u.username === username) ?? null;
  } catch { return null; }
}

// ── Farmers ───────────────────────────────────────────────────────────────────
export const FARMERS = [
  { id:1,  first_name:"Eduardo", last_name:"Aguilar",  middle_name:"",suffix:"",sex:"M",dob:"1980-01-15",civil_status:"MARRIED",highest_education:"BACHELOR",rsbsa_reference:null, full_name:"Eduardo Aguilar",  barangay:"San Juan",          sitio:"", mobile_number:"+639900000000", livelihood_type:"RICE",      farm_area_ha:"1.5",household_size:4, is_4ps:true,  is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ben Santos",   linked_user:5, parcels:[{id:1,area_ha:"1.5",commodity:"RICE",land_type:"LOWLAND",ownership_type:"OWNER"}] },
  { id:2,  first_name:"Fiona",   last_name:"Bautista", middle_name:"",suffix:"",sex:"F",dob:"1981-01-15",civil_status:"MARRIED",highest_education:"HIGHSCHOOL",rsbsa_reference:null,full_name:"Fiona Bautista",   barangay:"Lingsat",           sitio:"", mobile_number:"+639900000001", livelihood_type:"CORN",      farm_area_ha:"0.8",household_size:3, is_4ps:false, is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ana Reyes",    linked_user:6, parcels:[{id:2,area_ha:"0.8",commodity:"CORN",land_type:"UPLAND",ownership_type:"TENANT"}] },
  { id:3,  first_name:"George",  last_name:"Castillo", middle_name:"",suffix:"",sex:"M",dob:"1982-01-15",civil_status:"MARRIED",highest_education:"ELEMENTARY",rsbsa_reference:null,full_name:"George Castillo",  barangay:"San Felipe",        sitio:"", mobile_number:"+639900000002", livelihood_type:"RICE",      farm_area_ha:"2.0",household_size:5, is_4ps:true,  is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ben Santos",   linked_user:7, parcels:[{id:3,area_ha:"2.0",commodity:"RICE",land_type:"LOWLAND",ownership_type:"OWNER"}] },
  { id:4,  first_name:"Helen",   last_name:"Domingo",  middle_name:"",suffix:"",sex:"F",dob:"1983-01-15",civil_status:"MARRIED",highest_education:"BACHELOR",rsbsa_reference:null, full_name:"Helen Domingo",    barangay:"San Juan",          sitio:"", mobile_number:"+639900000003", livelihood_type:"RICE",      farm_area_ha:"1.2",household_size:2, is_4ps:true,  is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ana Reyes",    linked_user:null,parcels:[{id:4,area_ha:"1.2",commodity:"RICE",land_type:"LOWLAND",ownership_type:"OWNER"}] },
  { id:5,  first_name:"Ivan",    last_name:"Espiritu", middle_name:"",suffix:"",sex:"M",dob:"1984-01-15",civil_status:"SINGLE",  highest_education:"HIGHSCHOOL",rsbsa_reference:null,full_name:"Ivan Espiritu",    barangay:"Pagdalagan Norte",  sitio:"", mobile_number:"+639900000004", livelihood_type:"VEGETABLE", farm_area_ha:"0.5",household_size:6, is_4ps:false, is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ben Santos",   linked_user:null,parcels:[{id:5,area_ha:"0.5",commodity:"VEGETABLE",land_type:"UPLAND",ownership_type:"TENANT"}] },
  { id:6,  first_name:"Julia",   last_name:"Flores",   middle_name:"",suffix:"",sex:"F",dob:"1985-01-15",civil_status:"MARRIED",highest_education:"BACHELOR",rsbsa_reference:null, full_name:"Julia Flores",     barangay:"Pagdalagan Sur",    sitio:"", mobile_number:"+639900000005", livelihood_type:"RICE",      farm_area_ha:"1.0",household_size:4, is_4ps:true,  is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ana Reyes",    linked_user:null,parcels:[{id:6,area_ha:"1.0",commodity:"RICE",land_type:"LOWLAND",ownership_type:"OWNER"}] },
  { id:7,  first_name:"Karl",    last_name:"Garcia",   middle_name:"",suffix:"",sex:"M",dob:"1986-01-15",civil_status:"MARRIED",highest_education:"ELEMENTARY",rsbsa_reference:null,full_name:"Karl Garcia",      barangay:"Lingsat",           sitio:"", mobile_number:"+639900000006", livelihood_type:"RICE",      farm_area_ha:"1.8",household_size:3, is_4ps:false, is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ben Santos",   linked_user:null,parcels:[{id:7,area_ha:"1.8",commodity:"RICE",land_type:"LOWLAND",ownership_type:"OWNER"}] },
  { id:8,  first_name:"Luz",     last_name:"Hernandez",middle_name:"",suffix:"",sex:"F",dob:"1987-01-15",civil_status:"MARRIED",highest_education:"HIGHSCHOOL",rsbsa_reference:null,full_name:"Luz Hernandez",    barangay:"San Felipe",        sitio:"", mobile_number:"+639900000007", livelihood_type:"CORN",      farm_area_ha:"0.7",household_size:5, is_4ps:true,  is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ana Reyes",    linked_user:null,parcels:[{id:8,area_ha:"0.7",commodity:"CORN",land_type:"UPLAND",ownership_type:"TENANT"}] },
  { id:9,  first_name:"Marco",   last_name:"Ilagan",   middle_name:"",suffix:"",sex:"M",dob:"1988-01-15",civil_status:"MARRIED",highest_education:"BACHELOR",rsbsa_reference:null, full_name:"Marco Ilagan",     barangay:"San Juan",          sitio:"", mobile_number:"+639900000008", livelihood_type:"RICE",      farm_area_ha:"1.3",household_size:4, is_4ps:true,  is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ben Santos",   linked_user:null,parcels:[{id:9,area_ha:"1.3",commodity:"RICE",land_type:"LOWLAND",ownership_type:"OWNER"}] },
  { id:10, first_name:"Nora",    last_name:"Jacinto",  middle_name:"",suffix:"",sex:"F",dob:"1989-01-15",civil_status:"SINGLE",  highest_education:"HIGHSCHOOL",rsbsa_reference:null,full_name:"Nora Jacinto",     barangay:"Pagdalagan Norte",  sitio:"", mobile_number:"+639900000009", livelihood_type:"RICE",      farm_area_ha:"0.9",household_size:2, is_4ps:false, is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ana Reyes",    linked_user:null,parcels:[{id:10,area_ha:"0.9",commodity:"RICE",land_type:"LOWLAND",ownership_type:"TENANT"}] },
  { id:11, first_name:"Oscar",   last_name:"Kinilayan",middle_name:"",suffix:"",sex:"M",dob:"1990-01-15",civil_status:"MARRIED",highest_education:"ELEMENTARY",rsbsa_reference:null,full_name:"Oscar Kinilayan",  barangay:"Pagdalagan Sur",    sitio:"", mobile_number:"+639900000010", livelihood_type:"RICE",      farm_area_ha:"1.1",household_size:7, is_4ps:true,  is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ben Santos",   linked_user:null,parcels:[{id:11,area_ha:"1.1",commodity:"RICE",land_type:"LOWLAND",ownership_type:"OWNER"}] },
  { id:12, first_name:"Paula",   last_name:"Lopez",    middle_name:"",suffix:"",sex:"F",dob:"1991-01-15",civil_status:"MARRIED",highest_education:"BACHELOR",rsbsa_reference:null, full_name:"Paula Lopez",      barangay:"Lingsat",           sitio:"", mobile_number:"+639900000011", livelihood_type:"RICE",      farm_area_ha:"2.5",household_size:6, is_4ps:true,  is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ana Reyes",    linked_user:null,parcels:[{id:12,area_ha:"2.5",commodity:"RICE",land_type:"LOWLAND",ownership_type:"OWNER"}] },
  { id:13, first_name:"Quinn",   last_name:"Mariano",  middle_name:"",suffix:"",sex:"M",dob:"1992-01-15",civil_status:"SINGLE",  highest_education:"HIGHSCHOOL",rsbsa_reference:null,full_name:"Quinn Mariano",    barangay:"San Felipe",        sitio:"", mobile_number:"+639900000012", livelihood_type:"VEGETABLE", farm_area_ha:"0.3",household_size:3, is_4ps:false, is_pwd:false,is_ip:false,consent_dpa:true,consent_dpa_at:"2026-01-15T00:00:00Z",is_archived:false,archived_at:null,created_at:"2026-01-15T00:00:00Z",updated_at:"2026-01-15T00:00:00Z",encoded_by_name:"Ben Santos",   linked_user:null,parcels:[{id:13,area_ha:"0.3",commodity:"VEGETABLE",land_type:"UPLAND",ownership_type:"TENANT"}] },
];

// ── Inventory ─────────────────────────────────────────────────────────────────
export const INVENTORY_ITEMS = [
  { id:1, name:"Certified Rice Seeds",        category:"SEEDS",      unit:"kg",  low_stock_threshold:"50",  total_stock:785, is_low_stock:false, batch_count:2, created_at:"2026-01-01T00:00:00Z" },
  { id:2, name:"Ammonium Sulfate Fertilizer", category:"FERTILIZER", unit:"bag", low_stock_threshold:"20",  total_stock:225, is_low_stock:false, batch_count:2, created_at:"2026-01-14T00:00:00Z" },
];
export const STOCK_BATCHES = [
  { id:1, item:1, item_name:"Certified Rice Seeds",        lot_number:"LOT-2026-A",  received_date:"2026-04-04", expiry_date:"2026-11-01", initial_qty:"500", current_qty:"485", created_at:"2026-04-04T00:00:00Z" },
  { id:2, item:1, item_name:"Certified Rice Seeds",        lot_number:"LOT-2026-B",  received_date:"2026-04-24", expiry_date:"2027-05-04", initial_qty:"300", current_qty:"300", created_at:"2026-04-24T00:00:00Z" },
  { id:3, item:2, item_name:"Ammonium Sulfate Fertilizer", lot_number:"FERT-2026-A", received_date:"2026-04-14", expiry_date:"2027-10-25", initial_qty:"150", current_qty:"143", created_at:"2026-04-14T00:00:00Z" },
  { id:4, item:2, item_name:"Ammonium Sulfate Fertilizer", lot_number:"FERT-2026-B", received_date:"2026-04-29", expiry_date:"2028-02-23", initial_qty:"80",  current_qty:"80",  created_at:"2026-04-29T00:00:00Z" },
];
export const STOCK_MOVEMENTS = [
  { id:1, item:1, quantity:"500", movement_type:"IN",  reference_note:"Initial stock — DA Region I",       created_by_name:"Ana Reyes",  created_at:"2026-04-04T00:00:00Z" },
  { id:2, item:1, quantity:"15",  movement_type:"OUT", reference_note:"Distribution for Eduardo Aguilar",  created_by_name:"Ben Santos", created_at:"2026-05-01T00:00:00Z" },
  { id:3, item:1, quantity:"300", movement_type:"IN",  reference_note:"Supplemental stock",                created_by_name:"Ana Reyes",  created_at:"2026-04-24T00:00:00Z" },
  { id:4, item:2, quantity:"150", movement_type:"IN",  reference_note:"DA Region I — Fertilizer allocation",created_by_name:"Ana Reyes",  created_at:"2026-04-14T00:00:00Z" },
  { id:5, item:2, quantity:"7",   movement_type:"OUT", reference_note:"Distribution for Eduardo Aguilar",  created_by_name:"Ben Santos", created_at:"2026-04-27T00:00:00Z" },
  { id:6, item:2, quantity:"80",  movement_type:"IN",  reference_note:"Supplemental batch",                created_by_name:"Ana Reyes",  created_at:"2026-04-29T00:00:00Z" },
];

// ── Programs ──────────────────────────────────────────────────────────────────
export const PROGRAMS = [
  { id:1, name:"Rice Seed Assistance 2026 — Q1",  code:"RSA-2026-Q1", source_agency:"DA Region I",  status:"ACTIVE", start_date:"2026-01-01", end_date:"2026-06-30", target_barangays:["San Juan","Lingsat","San Felipe","Pagdalagan Norte","Pagdalagan Sur"], item_count:1, eligible_farmer_count:5, created_at:"2026-01-01T00:00:00Z",
    items:[{ id:1, inventory_item:1, inventory_item_detail:{id:1,name:"Certified Rice Seeds",unit:"kg"},   qty_per_beneficiary:"25", max_per_farmer:null }],
    criteria:[{id:1,field:"livelihood_type",operator:"eq",     value:"RICE",fail_message:"Only rice farmers are eligible for this program."},
              {id:2,field:"is_4ps",          operator:"is_true",value:"",   fail_message:"Priority is given to 4Ps beneficiaries."}] },
  { id:2, name:"Corn Seed Assistance 2026",        code:"CSA-2026-Q1", source_agency:"DA Region I",  status:"ACTIVE", start_date:"2026-02-01", end_date:"2026-07-31", target_barangays:["Lingsat","San Felipe","Pagdalagan Norte","Pagdalagan Sur","San Juan"], item_count:1, eligible_farmer_count:2, created_at:"2026-02-01T00:00:00Z",
    items:[{ id:2, inventory_item:1, inventory_item_detail:{id:1,name:"Certified Rice Seeds",unit:"kg"},   qty_per_beneficiary:"15", max_per_farmer:null }],
    criteria:[{id:3,field:"livelihood_type",operator:"eq",value:"CORN",fail_message:"This program is for corn farmers only."}] },
  { id:3, name:"Fertilizer Subsidy Program 2026",  code:"FS-2026-Q1",  source_agency:"LGU Bauang",   status:"ACTIVE", start_date:"2026-01-15", end_date:"2026-08-31", target_barangays:["San Juan","Lingsat","San Felipe","Pagdalagan Norte","Pagdalagan Sur","Casilagan","Bella Union"], item_count:1, eligible_farmer_count:7, created_at:"2026-01-15T00:00:00Z",
    items:[{ id:3, inventory_item:2, inventory_item_detail:{id:2,name:"Ammonium Sulfate Fertilizer",unit:"bag"}, qty_per_beneficiary:"3", max_per_farmer:null }],
    criteria:[{id:4,field:"is_4ps",       operator:"is_true",value:"",   fail_message:"This subsidy is reserved for 4Ps beneficiaries."},
              {id:5,field:"farm_area_ha", operator:"gte",    value:"0.5",fail_message:"Farm area must be at least 0.5 hectares."}] },
];

// ── Applications ──────────────────────────────────────────────────────────────
export let APPLICATIONS = [
  // RSA-2026-Q1
  { id:1,  farmer:1,  farmer_name:"Eduardo Aguilar",farmer_barangay:"San Juan",        program:1,program_name:"Rice Seed Assistance 2026 — Q1",program_code:"RSA-2026-Q1",status:"FULFILLED", submitted_at:"2026-01-20T00:00:00Z",reviewed_at:"2026-01-22T00:00:00Z",reviewed_by:2,reviewed_by_name:"Ben Santos",rejection_reason:"",notes:"" },
  { id:2,  farmer:4,  farmer_name:"Helen Domingo",  farmer_barangay:"San Juan",        program:1,program_name:"Rice Seed Assistance 2026 — Q1",program_code:"RSA-2026-Q1",status:"APPROVED",  submitted_at:"2026-01-21T00:00:00Z",reviewed_at:"2026-01-23T00:00:00Z",reviewed_by:2,reviewed_by_name:"Ben Santos",rejection_reason:"",notes:"" },
  { id:3,  farmer:9,  farmer_name:"Marco Ilagan",   farmer_barangay:"San Juan",        program:1,program_name:"Rice Seed Assistance 2026 — Q1",program_code:"RSA-2026-Q1",status:"SUBMITTED", submitted_at:"2026-01-25T00:00:00Z",reviewed_at:null,reviewed_by:null,reviewed_by_name:null,rejection_reason:"",notes:"" },
  { id:4,  farmer:11, farmer_name:"Oscar Kinilayan",farmer_barangay:"Pagdalagan Sur",  program:1,program_name:"Rice Seed Assistance 2026 — Q1",program_code:"RSA-2026-Q1",status:"REJECTED",  submitted_at:"2026-01-26T00:00:00Z",reviewed_at:"2026-01-28T00:00:00Z",reviewed_by:2,reviewed_by_name:"Ben Santos",rejection_reason:"Livelihood type does not match program criteria upon review.",notes:"" },
  { id:5,  farmer:12, farmer_name:"Paula Lopez",    farmer_barangay:"Lingsat",         program:1,program_name:"Rice Seed Assistance 2026 — Q1",program_code:"RSA-2026-Q1",status:"FULFILLED", submitted_at:"2026-01-20T00:00:00Z",reviewed_at:"2026-01-22T00:00:00Z",reviewed_by:2,reviewed_by_name:"Ben Santos",rejection_reason:"",notes:"" },
  // CSA-2026-Q1
  { id:6,  farmer:2,  farmer_name:"Fiona Bautista", farmer_barangay:"Lingsat",         program:2,program_name:"Corn Seed Assistance 2026",     program_code:"CSA-2026-Q1",status:"FULFILLED", submitted_at:"2026-02-10T00:00:00Z",reviewed_at:"2026-02-12T00:00:00Z",reviewed_by:2,reviewed_by_name:"Ben Santos",rejection_reason:"",notes:"" },
  { id:7,  farmer:8,  farmer_name:"Luz Hernandez",  farmer_barangay:"San Felipe",      program:2,program_name:"Corn Seed Assistance 2026",     program_code:"CSA-2026-Q1",status:"SUBMITTED", submitted_at:"2026-02-15T00:00:00Z",reviewed_at:null,reviewed_by:null,reviewed_by_name:null,rejection_reason:"",notes:"" },
  // FS-2026-Q1
  { id:8,  farmer:1,  farmer_name:"Eduardo Aguilar",farmer_barangay:"San Juan",        program:3,program_name:"Fertilizer Subsidy Program 2026",program_code:"FS-2026-Q1", status:"FULFILLED", submitted_at:"2026-01-20T00:00:00Z",reviewed_at:"2026-01-22T00:00:00Z",reviewed_by:2,reviewed_by_name:"Ben Santos",rejection_reason:"",notes:"" },
  { id:9,  farmer:3,  farmer_name:"George Castillo",farmer_barangay:"San Felipe",      program:3,program_name:"Fertilizer Subsidy Program 2026",program_code:"FS-2026-Q1", status:"APPROVED",  submitted_at:"2026-01-20T00:00:00Z",reviewed_at:"2026-01-22T00:00:00Z",reviewed_by:2,reviewed_by_name:"Ben Santos",rejection_reason:"",notes:"" },
  { id:10, farmer:4,  farmer_name:"Helen Domingo",  farmer_barangay:"San Juan",        program:3,program_name:"Fertilizer Subsidy Program 2026",program_code:"FS-2026-Q1", status:"APPROVED",  submitted_at:"2026-01-21T00:00:00Z",reviewed_at:"2026-01-23T00:00:00Z",reviewed_by:2,reviewed_by_name:"Ben Santos",rejection_reason:"",notes:"" },
  { id:11, farmer:8,  farmer_name:"Luz Hernandez",  farmer_barangay:"San Felipe",      program:3,program_name:"Fertilizer Subsidy Program 2026",program_code:"FS-2026-Q1", status:"SUBMITTED", submitted_at:"2026-01-25T00:00:00Z",reviewed_at:null,reviewed_by:null,reviewed_by_name:null,rejection_reason:"",notes:"" },
  { id:12, farmer:9,  farmer_name:"Marco Ilagan",   farmer_barangay:"San Juan",        program:3,program_name:"Fertilizer Subsidy Program 2026",program_code:"FS-2026-Q1", status:"APPROVED",  submitted_at:"2026-01-25T00:00:00Z",reviewed_at:"2026-01-27T00:00:00Z",reviewed_by:2,reviewed_by_name:"Ben Santos",rejection_reason:"",notes:"" },
  { id:13, farmer:11, farmer_name:"Oscar Kinilayan",farmer_barangay:"Pagdalagan Sur",  program:3,program_name:"Fertilizer Subsidy Program 2026",program_code:"FS-2026-Q1", status:"REJECTED",  submitted_at:"2026-01-26T00:00:00Z",reviewed_at:"2026-01-28T00:00:00Z",reviewed_by:2,reviewed_by_name:"Ben Santos",rejection_reason:"Farm area does not meet minimum requirement upon field verification.",notes:"" },
  { id:14, farmer:12, farmer_name:"Paula Lopez",    farmer_barangay:"Lingsat",         program:3,program_name:"Fertilizer Subsidy Program 2026",program_code:"FS-2026-Q1", status:"CANCELLED", submitted_at:"2026-01-20T00:00:00Z",reviewed_at:null,reviewed_by:null,reviewed_by_name:null,rejection_reason:"",notes:"" },
];

// ── Distributions ─────────────────────────────────────────────────────────────
const riceItem  = (qty: string) => ({ id:1, batch:1, item_name:"Certified Rice Seeds",        lot_number:"LOT-2026-A",  unit:"kg",  quantity_planned:qty, quantity_released: qty });
const fertItem  = (qty: string) => ({ id:2, batch:3, item_name:"Ammonium Sulfate Fertilizer", lot_number:"FERT-2026-A", unit:"bag", quantity_planned:qty, quantity_released: qty });
const fertItem0 = (qty: string) => ({ ...fertItem(qty), quantity_released:"0" });
const riceItem0 = (qty: string) => ({ ...riceItem(qty), quantity_released:"0" });

export let DISTRIBUTIONS = [
  { id:1, application:1,  program:1,farmer:1,  farmer_name:"Eduardo Aguilar",farmer_barangay:"San Juan",       program_name:"Rice Seed Assistance 2026 — Q1", program_code:"RSA-2026-Q1",status:"DELIVERED",   scheduled_date:"2026-05-01",delivered_at:"2026-05-01T10:00:00Z",remarks:"Delivered successfully.",updated_by:2,updated_by_name:"Ben Santos",items:[riceItem("25")],  created_at:"2026-01-22T00:00:00Z" },
  { id:2, application:2,  program:1,farmer:4,  farmer_name:"Helen Domingo",  farmer_barangay:"San Juan",       program_name:"Rice Seed Assistance 2026 — Q1", program_code:"RSA-2026-Q1",status:"SCHEDULED",   scheduled_date:"2026-05-07",delivered_at:null,                  remarks:"",                        updated_by:2,updated_by_name:"Ben Santos",items:[riceItem0("25")], created_at:"2026-01-23T00:00:00Z" },
  { id:3, application:5,  program:1,farmer:12, farmer_name:"Paula Lopez",    farmer_barangay:"Lingsat",        program_name:"Rice Seed Assistance 2026 — Q1", program_code:"RSA-2026-Q1",status:"DELIVERED",   scheduled_date:"2026-05-01",delivered_at:"2026-05-01T14:00:00Z",remarks:"Delivered successfully.",updated_by:2,updated_by_name:"Ben Santos",items:[riceItem("25")],  created_at:"2026-01-22T00:00:00Z" },
  { id:4, application:6,  program:2,farmer:2,  farmer_name:"Fiona Bautista", farmer_barangay:"Lingsat",        program_name:"Corn Seed Assistance 2026",      program_code:"CSA-2026-Q1",status:"DELIVERED",   scheduled_date:"2026-04-29",delivered_at:"2026-04-29T09:00:00Z",remarks:"",                        updated_by:2,updated_by_name:"Ben Santos",items:[riceItem("15")],  created_at:"2026-02-12T00:00:00Z" },
  { id:5, application:8,  program:3,farmer:1,  farmer_name:"Eduardo Aguilar",farmer_barangay:"San Juan",       program_name:"Fertilizer Subsidy Program 2026",program_code:"FS-2026-Q1", status:"DELIVERED",   scheduled_date:"2026-04-27",delivered_at:"2026-04-27T10:00:00Z",remarks:"",                        updated_by:2,updated_by_name:"Ben Santos",items:[fertItem("3")],   created_at:"2026-01-22T00:00:00Z" },
  { id:6, application:9,  program:3,farmer:3,  farmer_name:"George Castillo",farmer_barangay:"San Felipe",     program_name:"Fertilizer Subsidy Program 2026",program_code:"FS-2026-Q1", status:"SCHEDULED",   scheduled_date:"2026-05-07",delivered_at:null,                  remarks:"",                        updated_by:2,updated_by_name:"Ben Santos",items:[fertItem0("3")],  created_at:"2026-01-22T00:00:00Z" },
  { id:7, application:10, program:3,farmer:4,  farmer_name:"Helen Domingo",  farmer_barangay:"San Juan",       program_name:"Fertilizer Subsidy Program 2026",program_code:"FS-2026-Q1", status:"DELAYED",     scheduled_date:"2026-05-03",delivered_at:null,                  remarks:"Farmer unavailable on scheduled date. Will reschedule.",updated_by:2,updated_by_name:"Ben Santos",items:[fertItem0("3")],  created_at:"2026-01-23T00:00:00Z" },
  { id:8, application:12, program:3,farmer:9,  farmer_name:"Marco Ilagan",   farmer_barangay:"San Juan",       program_name:"Fertilizer Subsidy Program 2026",program_code:"FS-2026-Q1", status:"RESCHEDULED", scheduled_date:"2026-05-09",delivered_at:null,                  remarks:"Rescheduled due to barangay fiesta.",          updated_by:2,updated_by_name:"Ben Santos",items:[fertItem0("3")],  created_at:"2026-01-27T00:00:00Z" },
];

// ── Announcements ─────────────────────────────────────────────────────────────
export let ANNOUNCEMENTS = [
  { id:1, title:"Welcome to BATC Farmer Portal",             body:"The Bauang Agricultural Trade Center online portal is now available. Farmers can now apply for assistance programs, track their distribution status, and submit feedback directly through this system.",                                    target_roles:["ADMIN","STAFF","CLIENT"], published_at:"2026-01-01T00:00:00Z", created_by:1, created_by_name:"Ana Reyes" },
  { id:2, title:"Rice Seed Assistance 2026 — Q1 Now Open",   body:"Applications for the Rice Seed Assistance Program 2026 Q1 are now being accepted. Eligible rice farmers in target barangays may apply through the Programs tab. Distribution is scheduled for February–March 2026.", target_roles:["CLIENT"],                  published_at:"2026-01-02T00:00:00Z", created_by:1, created_by_name:"Ana Reyes" },
  { id:3, title:"Staff: New Application Review Process",      body:"All submitted applications must be reviewed within 5 working days. Please use the Applications queue to approve or reject pending submissions. Contact the admin for questions.",                                           target_roles:["STAFF","ADMIN"],          published_at:"2026-01-03T00:00:00Z", created_by:1, created_by_name:"Ana Reyes" },
];

// ── Feedback ──────────────────────────────────────────────────────────────────
export let FEEDBACK = [
  { id:1, farmer:1,  farmer_name:"Eduardo Aguilar",distribution:1, program_name:"Rice Seed Assistance 2026 — Q1", issue_type:"GENERAL",is_quality_issue:false,rating:5,comment:"Salamat! Nakatanggap na kami ng binhi. Malaking tulong ito sa aming pamilya.",        status:"RESOLVED",    created_at:"2026-05-02T00:00:00Z" },
  { id:2, farmer:12, farmer_name:"Paula Lopez",    distribution:3, program_name:"Rice Seed Assistance 2026 — Q1", issue_type:"GENERAL",is_quality_issue:false,rating:4,comment:"Good service. The seeds were of good quality. Hope to receive more next time.",     status:"ACKNOWLEDGED",created_at:"2026-05-02T00:00:00Z" },
  { id:3, farmer:1,  farmer_name:"Eduardo Aguilar",distribution:5, program_name:"Fertilizer Subsidy Program 2026",issue_type:"GENERAL",is_quality_issue:false,rating:5,comment:"Very thankful for this program. The staff were very accommodating and organized.", status:"NEW",         created_at:"2026-04-28T00:00:00Z" },
  { id:4, farmer:2,  farmer_name:"Fiona Bautista", distribution:4, program_name:"Corn Seed Assistance 2026",      issue_type:"GENERAL",is_quality_issue:false,rating:4,comment:"Smooth process. The distribution was fast and organized.",                          status:"NEW",         created_at:"2026-04-30T00:00:00Z" },
];

// ── Notifications (per username) ──────────────────────────────────────────────
type Notif = { id:number;type:string;title:string;body:string;link:string;is_read:boolean;read_at:string|null;created_at:string };
export let NOTIFICATIONS: Record<string, Notif[]> = {
  admin: [
    { id:1, type:"APPLICATION_SUBMITTED",  title:"New Application",        body:"Marco Ilagan submitted an application for Rice Seed Assistance 2026 — Q1.", link:"/admin/applications",is_read:false,read_at:null,                  created_at:"2026-01-25T00:00:00Z" },
    { id:2, type:"QUALITY_ISSUE_REPORTED", title:"Quality Issue Reported",  body:"A new quality issue report was submitted by a farmer.",                       link:"/admin/feedback",     is_read:true, read_at:"2026-05-03T00:00:00Z",created_at:"2026-04-28T00:00:00Z" },
  ],
  staff01: [
    { id:3, type:"APPLICATION_SUBMITTED",  title:"New Application",         body:"Luz Hernandez submitted an application for Corn Seed Assistance 2026.",       link:"/staff/applications",is_read:false,read_at:null,                  created_at:"2026-02-15T00:00:00Z" },
    { id:4, type:"DISTRIBUTION_DELAYED",   title:"Distribution Delayed",    body:"Distribution for Helen Domingo (FS-2026-Q1) has been marked as delayed.",     link:"/staff/distribution",is_read:false,read_at:null,                  created_at:"2026-05-03T00:00:00Z" },
  ],
  farmer01: [
    { id:5, type:"APPLICATION_APPROVED",   title:"Application Approved",    body:"Your application for Rice Seed Assistance 2026 — Q1 has been approved.",       link:"/app/applications",  is_read:true, read_at:"2026-01-23T00:00:00Z",created_at:"2026-01-22T00:00:00Z" },
    { id:6, type:"DISTRIBUTION_DELIVERED", title:"Seeds Delivered",         body:"Your Rice Seed Assistance 2026 — Q1 distribution has been delivered.",         link:"/app/claims",         is_read:false,read_at:null,                  created_at:"2026-05-01T00:00:00Z" },
  ],
  farmer02: [
    { id:7, type:"APPLICATION_APPROVED",   title:"Application Approved",    body:"Your application for Corn Seed Assistance 2026 has been approved.",             link:"/app/applications",  is_read:true, read_at:"2026-02-13T00:00:00Z",created_at:"2026-02-12T00:00:00Z" },
    { id:8, type:"DISTRIBUTION_DELIVERED", title:"Seeds Delivered",         body:"Your Corn Seed Assistance 2026 distribution has been delivered.",               link:"/app/claims",         is_read:false,read_at:null,                  created_at:"2026-04-29T00:00:00Z" },
  ],
  farmer03: [
    { id:9,  type:"APPLICATION_APPROVED",    title:"Application Approved",  body:"Your application for Fertilizer Subsidy Program 2026 has been approved.",       link:"/app/applications",  is_read:false,read_at:null,created_at:"2026-01-22T00:00:00Z" },
    { id:10, type:"DISTRIBUTION_SCHEDULED",  title:"Distribution Scheduled",body:"Your fertilizer distribution has been scheduled for May 7, 2026.",               link:"/app/claims",         is_read:false,read_at:null,created_at:"2026-01-22T00:00:00Z" },
  ],
};

// ── ID counter (for mutations) ────────────────────────────────────────────────
let _nextId = 100;
export const nextId = () => ++_nextId;
