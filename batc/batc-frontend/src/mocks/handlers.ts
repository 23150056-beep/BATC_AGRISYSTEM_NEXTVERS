/**
 * MSW v2 request handlers — intercepts every /api/v1/* call in demo mode.
 *
 * ORDERING NOTE: within each resource group, more-specific paths that share
 * a prefix with a wildcard MUST come first so MSW doesn't swallow them:
 *   /farmers/me/        before  /farmers/:id/
 *   /applications/mine/ before  /applications/:id/
 *   /inventory/items/low-stock/ before /inventory/items/:id/
 *   /feedback/quality-alert-count/ before /feedback/:id/
 *   /notifications/unread-count/ + /mark-all-read/ before /:id/
 *   /distributions/mine/ + /bulk-reschedule/ before /:id/
 */
import { http, HttpResponse } from "msw";
import * as db from "./db";

const B = "/api/v1"; // base prefix

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function paginate<T>(items: T[], pageParam: string | null, pageSize = 20) {
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const start = (page - 1) * pageSize;
  const results = items.slice(start, start + pageSize);
  return {
    count: items.length,
    next: start + pageSize < items.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results,
  };
}

function me(req: Request) {
  return db.userFromToken(req.headers.get("Authorization"));
}

function ok<T>(data: T, status = 200) {
  return HttpResponse.json(data, { status });
}

function notFound(detail = "Not found.") {
  return HttpResponse.json({ detail }, { status: 404 });
}

function unauth() {
  return HttpResponse.json(
    { detail: "Authentication credentials were not provided." },
    { status: 401 }
  );
}

function bad(errors: Record<string, string[]>) {
  return HttpResponse.json(errors, { status: 400 });
}

// ─── AUTH ──────────────────────────────────────────────────────────────────────

const authHandlers = [
  // POST /auth/login/
  http.post(`${B}/auth/login/`, async ({ request }) => {
    const { username, password } = (await request.json()) as {
      username: string;
      password: string;
    };
    if (db.CREDENTIALS[username] !== password) {
      return HttpResponse.json(
        { detail: "No active account found with the given credentials." },
        { status: 401 }
      );
    }
    return ok(db.getTokens(username));
  }),

  // POST /auth/logout/
  http.post(`${B}/auth/logout/`, () =>
    ok({ detail: "Successfully logged out." })
  ),

  // POST /auth/refresh/
  http.post(`${B}/auth/refresh/`, async ({ request }) => {
    const { refresh } = (await request.json()) as { refresh: string };
    try {
      const { username } = JSON.parse(atob(refresh.split(".")[1])) as {
        username: string;
      };
      // Refresh tokens have "-r" appended to the username (see db.getTokens)
      const base = username.endsWith("-r")
        ? username.slice(0, -2)
        : username;
      const tokens = db.getTokens(base);
      return ok({ access: tokens.access, refresh: tokens.refresh });
    } catch {
      return HttpResponse.json(
        { detail: "Token is invalid or expired." },
        { status: 401 }
      );
    }
  }),

  // GET /auth/me/
  http.get(`${B}/auth/me/`, ({ request }) => {
    const user = me(request);
    if (!user) return unauth();
    return ok(user);
  }),

  // POST /auth/register/  (farmer self-registration)
  http.post(`${B}/auth/register/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const { username, password, ...farmerData } = body as {
      username: string;
      password: string;
      confirm_password?: string;
      first_name: string;
      last_name: string;
      [key: string]: unknown;
    };

    if (!username) return bad({ username: ["This field is required."] });
    if (db.CREDENTIALS[username] !== undefined)
      return bad({ username: ["A user with that username already exists."] });

    const userId = db.nextId();
    const fullName =
      `${farmerData.first_name || ""} ${farmerData.last_name || ""}`.trim();
    const newUser = {
      id: userId,
      username,
      email: (farmerData.email as string) || "",
      first_name: (farmerData.first_name as string) || "",
      last_name: (farmerData.last_name as string) || "",
      full_name: fullName,
      role: "CLIENT" as const,
      is_active: true,
      is_archived: false,
      date_joined: new Date().toISOString(),
      last_login: null,
    };
    (db.USERS as typeof db.USERS).push(newUser);
    db.CREDENTIALS[username] = password;

    const farmerId = db.nextId();
    const newFarmer = {
      id: farmerId,
      ...(farmerData as object),
      full_name: fullName,
      is_archived: false,
      archived_at: null,
      consent_dpa_at: farmerData.consent_dpa
        ? new Date().toISOString()
        : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      encoded_by_name: null,
      linked_user: userId,
      parcels: (farmerData.parcels as unknown[]) || [],
    };
    (db.FARMERS as typeof db.FARMERS).push(newFarmer as never);

    const tokens = db.getTokens(username);
    return ok({ ...tokens, user: newUser, farmer: newFarmer }, 201);
  }),
];

// ─── USERS ────────────────────────────────────────────────────────────────────

const usersHandlers = [
  // PATCH /users/:id/archive/  (before /:id/ to avoid swallowing)
  http.patch(`${B}/users/:id/archive/`, ({ params }) => {
    const user = db.USERS.find((u) => u.id === Number(params.id));
    if (!user) return notFound();
    Object.assign(user, { is_archived: true, is_active: false });
    return ok(user);
  }),

  // PATCH /users/:id/unarchive/
  http.patch(`${B}/users/:id/unarchive/`, ({ params }) => {
    const user = db.USERS.find((u) => u.id === Number(params.id));
    if (!user) return notFound();
    Object.assign(user, { is_archived: false, is_active: true });
    return ok(user);
  }),

  // POST /users/:id/reset-password/
  http.post(`${B}/users/:id/reset-password/`, ({ params }) => {
    const user = db.USERS.find((u) => u.id === Number(params.id));
    if (!user) return notFound();
    const temp = "Temp1234!";
    db.CREDENTIALS[user.username] = temp;
    return ok({ temp_password: temp });
  }),

  // GET /users/
  http.get(`${B}/users/`, ({ request }) => {
    const url = new URL(request.url);
    const role = url.searchParams.get("role");
    const search = url.searchParams.get("search")?.toLowerCase();
    const page = url.searchParams.get("page");
    const availableForLink = url.searchParams.get("available_for_link");

    let items = db.USERS.filter((u) => !u.is_archived);

    if (role) items = items.filter((u) => u.role === role);
    if (search)
      items = items.filter(
        (u) =>
          u.username.toLowerCase().includes(search) ||
          u.full_name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
      );
    if (availableForLink === "true") {
      const linked = new Set(
        db.FARMERS.filter((f) => f.linked_user != null).map((f) => f.linked_user)
      );
      items = items.filter(
        (u) => u.role === "CLIENT" && !linked.has(u.id)
      );
    }

    return ok(paginate(items, page));
  }),

  // POST /users/
  http.post(`${B}/users/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (db.USERS.find((u) => u.username === body.username))
      return bad({ username: ["A user with that username already exists."] });

    const newUser = {
      id: db.nextId(),
      username: (body.username as string) || "",
      email: (body.email as string) || "",
      first_name: (body.first_name as string) || "",
      last_name: (body.last_name as string) || "",
      full_name:
        `${body.first_name || ""} ${body.last_name || ""}`.trim(),
      role: (body.role as "ADMIN" | "STAFF" | "CLIENT") || "CLIENT",
      is_active: true,
      is_archived: false,
      date_joined: new Date().toISOString(),
      last_login: null,
    };
    (db.USERS as typeof db.USERS).push(newUser);
    if (body.password) db.CREDENTIALS[newUser.username] = body.password as string;
    return ok(newUser, 201);
  }),

  // GET /users/:id/
  http.get(`${B}/users/:id/`, ({ params }) => {
    const user = db.USERS.find((u) => u.id === Number(params.id));
    return user ? ok(user) : notFound();
  }),

  // PATCH /users/:id/
  http.patch(`${B}/users/:id/`, async ({ request, params }) => {
    const user = db.USERS.find((u) => u.id === Number(params.id));
    if (!user) return notFound();
    const body = (await request.json()) as Partial<typeof user>;
    Object.assign(user, body);
    if (body.first_name !== undefined || body.last_name !== undefined)
      (user as Record<string, unknown>).full_name =
        `${user.first_name} ${user.last_name}`.trim();
    return ok(user);
  }),
];

// ─── FARMERS ──────────────────────────────────────────────────────────────────
// /farmers/me/ MUST come before /farmers/:id/

const farmersHandlers = [
  // GET /farmers/me/
  http.get(`${B}/farmers/me/`, ({ request }) => {
    const user = me(request);
    if (!user) return unauth();
    const farmer = db.FARMERS.find((f) => f.linked_user === user.id);
    return farmer ? ok(farmer) : notFound("No farmer profile linked to this account.");
  }),

  // PATCH /farmers/:id/archive/
  http.patch(`${B}/farmers/:id/archive/`, ({ params }) => {
    const farmer = db.FARMERS.find((f) => f.id === Number(params.id));
    if (!farmer) return notFound();
    Object.assign(farmer, {
      is_archived: true,
      archived_at: new Date().toISOString(),
    });
    return ok(farmer);
  }),

  // PATCH /farmers/:id/unarchive/
  http.patch(`${B}/farmers/:id/unarchive/`, ({ params }) => {
    const farmer = db.FARMERS.find((f) => f.id === Number(params.id));
    if (!farmer) return notFound();
    Object.assign(farmer, { is_archived: false, archived_at: null });
    return ok(farmer);
  }),

  // GET /farmers/
  http.get(`${B}/farmers/`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();
    const barangay = url.searchParams.get("barangay");
    const archived = url.searchParams.get("archived");
    const page = url.searchParams.get("page");

    let items =
      archived === "true"
        ? db.FARMERS.filter((f) => f.is_archived)
        : db.FARMERS.filter((f) => !f.is_archived);

    if (barangay) items = items.filter((f) => f.barangay === barangay);
    if (search)
      items = items.filter(
        (f) =>
          f.full_name.toLowerCase().includes(search) ||
          f.mobile_number.includes(search)
      );

    return ok(paginate(items, page));
  }),

  // POST /farmers/
  http.post(`${B}/farmers/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName =
      `${body.first_name || ""} ${body.last_name || ""}`.trim();
    const newFarmer = {
      id: db.nextId(),
      ...(body as object),
      full_name: fullName,
      is_archived: false,
      archived_at: null,
      consent_dpa_at: body.consent_dpa ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      encoded_by_name: null,
      linked_user:
        body.linked_user_id != null ? Number(body.linked_user_id) : null,
      parcels: (body.parcels as unknown[]) || [],
    };
    (db.FARMERS as typeof db.FARMERS).push(newFarmer as never);
    return ok(newFarmer, 201);
  }),

  // GET /farmers/:id/
  http.get(`${B}/farmers/:id/`, ({ params }) => {
    const farmer = db.FARMERS.find((f) => f.id === Number(params.id));
    return farmer ? ok(farmer) : notFound();
  }),

  // PATCH /farmers/:id/
  http.patch(`${B}/farmers/:id/`, async ({ request, params }) => {
    const farmer = db.FARMERS.find((f) => f.id === Number(params.id));
    if (!farmer) return notFound();
    const body = (await request.json()) as Record<string, unknown>;
    Object.assign(farmer, body);
    if (body.first_name !== undefined || body.last_name !== undefined)
      (farmer as Record<string, unknown>).full_name =
        `${farmer.first_name} ${farmer.last_name}`.trim();
    (farmer as Record<string, unknown>).updated_at = new Date().toISOString();
    return ok(farmer);
  }),
];

// ─── PROGRAMS ─────────────────────────────────────────────────────────────────

const programsHandlers = [
  // GET /programs/:id/eligible-farmers/  (before /:id/ which could catch it if nested)
  http.get(`${B}/programs/:id/eligible-farmers/`, ({ params }) => {
    const program = db.PROGRAMS.find((p) => p.id === Number(params.id));
    if (!program) return notFound();
    const eligible = db.FARMERS.filter(
      (f) =>
        !f.is_archived &&
        program.target_barangays.includes(f.barangay)
    );
    return ok({ count: eligible.length, results: eligible });
  }),

  // POST /programs/:id/activate/
  http.post(`${B}/programs/:id/activate/`, ({ params }) => {
    const p = db.PROGRAMS.find((x) => x.id === Number(params.id));
    if (!p) return notFound();
    (p as Record<string, unknown>).status = "ACTIVE";
    return ok(p);
  }),

  // POST /programs/:id/suspend/
  http.post(`${B}/programs/:id/suspend/`, ({ params }) => {
    const p = db.PROGRAMS.find((x) => x.id === Number(params.id));
    if (!p) return notFound();
    (p as Record<string, unknown>).status = "SUSPENDED";
    return ok(p);
  }),

  // POST /programs/:id/complete/
  http.post(`${B}/programs/:id/complete/`, ({ params }) => {
    const p = db.PROGRAMS.find((x) => x.id === Number(params.id));
    if (!p) return notFound();
    (p as Record<string, unknown>).status = "COMPLETED";
    return ok(p);
  }),

  // GET /programs/
  http.get(`${B}/programs/`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search")?.toLowerCase();
    const eligibleForMe = url.searchParams.get("eligible_for_me");
    const page = url.searchParams.get("page");

    let items = [...db.PROGRAMS];
    if (status) items = items.filter((p) => p.status === status);
    if (search)
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.code.toLowerCase().includes(search)
      );
    if (eligibleForMe === "true")
      items = items.filter((p) => p.status === "ACTIVE");

    return ok(paginate(items, page));
  }),

  // POST /programs/
  http.post(`${B}/programs/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const items = (
      (body.items as Array<Record<string, unknown>>) || []
    ).map((item) => ({
      id: db.nextId(),
      inventory_item: item.inventory_item as number,
      inventory_item_detail:
        db.INVENTORY_ITEMS.find(
          (ii) => ii.id === (item.inventory_item as number)
        ) ?? { id: item.inventory_item, name: "Unknown", unit: "" },
      qty_per_beneficiary: item.qty_per_beneficiary as string,
      max_per_farmer: (item.max_per_farmer as string | null) ?? null,
    }));
    const criteria = (
      (body.criteria as Array<Record<string, unknown>>) || []
    ).map((c) => ({ id: db.nextId(), ...c }));

    const newProgram = {
      id: db.nextId(),
      name: body.name as string,
      code: body.code as string,
      source_agency: (body.source_agency as string) || "",
      status: "DRAFT",
      start_date: body.start_date as string,
      end_date: body.end_date as string,
      target_barangays: (body.target_barangays as string[]) || [],
      item_count: items.length,
      eligible_farmer_count: 0,
      created_at: new Date().toISOString(),
      items,
      criteria,
    };
    (db.PROGRAMS as typeof db.PROGRAMS).push(newProgram as never);
    return ok(newProgram, 201);
  }),

  // GET /programs/:id/
  http.get(`${B}/programs/:id/`, ({ params }) => {
    const p = db.PROGRAMS.find((x) => x.id === Number(params.id));
    return p ? ok(p) : notFound();
  }),

  // PATCH /programs/:id/
  http.patch(`${B}/programs/:id/`, async ({ request, params }) => {
    const p = db.PROGRAMS.find((x) => x.id === Number(params.id));
    if (!p) return notFound();
    const body = (await request.json()) as Record<string, unknown>;
    Object.assign(p, body);
    return ok(p);
  }),
];

// ─── INVENTORY ────────────────────────────────────────────────────────────────
// /items/low-stock/ MUST come before /items/:id/

const inventoryHandlers = [
  // GET /inventory/items/low-stock/
  http.get(`${B}/inventory/items/low-stock/`, () => {
    const low = db.INVENTORY_ITEMS.filter((i) => i.is_low_stock);
    return ok(low);
  }),

  // GET /inventory/items/:id/batches/
  http.get(`${B}/inventory/items/:id/batches/`, ({ params }) => {
    const batches = db.STOCK_BATCHES.filter(
      (b) => b.item === Number(params.id)
    );
    return ok(batches);
  }),

  // GET /inventory/items/:id/movements/
  http.get(`${B}/inventory/items/:id/movements/`, ({ request, params }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get("page");
    const movements = db.STOCK_MOVEMENTS.filter(
      (m) => m.item === Number(params.id)
    );
    return ok(paginate(movements, page));
  }),

  // POST /inventory/items/:id/receive/
  http.post(
    `${B}/inventory/items/:id/receive/`,
    async ({ request, params }) => {
      const body = (await request.json()) as Record<string, unknown>;
      const item = db.INVENTORY_ITEMS.find(
        (i) => i.id === Number(params.id)
      );
      if (!item) return notFound();

      const batch = {
        id: db.nextId(),
        item: item.id,
        item_name: item.name,
        lot_number: body.lot_number as string,
        received_date: body.received_date as string,
        expiry_date: (body.expiry_date as string | null) ?? null,
        initial_qty: body.quantity as string,
        current_qty: body.quantity as string,
        created_at: new Date().toISOString(),
      };
      (db.STOCK_BATCHES as typeof db.STOCK_BATCHES).push(batch as never);

      const qty = Number(body.quantity);
      (item as Record<string, unknown>).total_stock =
        (item.total_stock as number) + qty;
      (item as Record<string, unknown>).batch_count =
        (item.batch_count as number) + 1;

      const movement = {
        id: db.nextId(),
        item: item.id,
        quantity: body.quantity as string,
        movement_type: "IN",
        reference_note: (body.reference_note as string) || "",
        created_by_name: "Staff",
        created_at: new Date().toISOString(),
      };
      (db.STOCK_MOVEMENTS as typeof db.STOCK_MOVEMENTS).push(movement as never);

      return ok(batch, 201);
    }
  ),

  // POST /inventory/batches/:id/adjust/
  http.post(
    `${B}/inventory/batches/:id/adjust/`,
    async ({ request, params }) => {
      const body = (await request.json()) as { quantity: string; reference_note: string };
      const batch = db.STOCK_BATCHES.find(
        (b) => b.id === Number(params.id)
      );
      if (!batch) return notFound();

      const delta = Number(body.quantity);
      (batch as Record<string, unknown>).current_qty = String(
        Number(batch.current_qty) + delta
      );

      const item = db.INVENTORY_ITEMS.find((i) => i.id === batch.item);
      if (item)
        (item as Record<string, unknown>).total_stock =
          (item.total_stock as number) + delta;

      return ok(batch);
    }
  ),

  // GET /inventory/items/
  http.get(`${B}/inventory/items/`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();
    const category = url.searchParams.get("category");
    const page = url.searchParams.get("page");

    let items = [...db.INVENTORY_ITEMS];
    if (search)
      items = items.filter((i) => i.name.toLowerCase().includes(search));
    if (category) items = items.filter((i) => i.category === category);

    return ok(paginate(items, page));
  }),

  // POST /inventory/items/
  http.post(`${B}/inventory/items/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newItem = {
      id: db.nextId(),
      name: body.name as string,
      category: body.category as string,
      unit: body.unit as string,
      low_stock_threshold: body.low_stock_threshold as string,
      total_stock: 0,
      is_low_stock: false,
      batch_count: 0,
      created_at: new Date().toISOString(),
    };
    (db.INVENTORY_ITEMS as typeof db.INVENTORY_ITEMS).push(newItem as never);
    return ok(newItem, 201);
  }),

  // PATCH /inventory/items/:id/
  http.patch(`${B}/inventory/items/:id/`, async ({ request, params }) => {
    const item = db.INVENTORY_ITEMS.find((i) => i.id === Number(params.id));
    if (!item) return notFound();
    const body = (await request.json()) as Record<string, unknown>;
    Object.assign(item, body);
    return ok(item);
  }),
];

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
// /applications/mine/ MUST come before /applications/:id/

const applicationsHandlers = [
  // GET /applications/mine/
  http.get(`${B}/applications/mine/`, ({ request }) => {
    const user = me(request);
    if (!user) return unauth();
    const farmer = db.FARMERS.find((f) => f.linked_user === user.id);
    if (!farmer) return ok([]);
    const mine = db.APPLICATIONS.filter((a) => a.farmer === farmer.id);
    return ok(mine);
  }),

  // POST /applications/:id/approve/
  http.post(`${B}/applications/:id/approve/`, ({ request, params }) => {
    const user = me(request);
    const app = db.APPLICATIONS.find((a) => a.id === Number(params.id));
    if (!app) return notFound();
    Object.assign(app, {
      status: "APPROVED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id ?? null,
      reviewed_by_name: user?.full_name ?? null,
    });
    return ok(app);
  }),

  // POST /applications/:id/reject/
  http.post(
    `${B}/applications/:id/reject/`,
    async ({ request, params }) => {
      const user = me(request);
      const body = (await request.json()) as { reason: string };
      const app = db.APPLICATIONS.find((a) => a.id === Number(params.id));
      if (!app) return notFound();
      Object.assign(app, {
        status: "REJECTED",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
        reviewed_by_name: user?.full_name ?? null,
        rejection_reason: body.reason,
      });
      return ok(app);
    }
  ),

  // POST /applications/:id/cancel/
  http.post(`${B}/applications/:id/cancel/`, ({ params }) => {
    const app = db.APPLICATIONS.find((a) => a.id === Number(params.id));
    if (!app) return notFound();
    (app as Record<string, unknown>).status = "CANCELLED";
    return ok(app);
  }),

  // GET /applications/
  http.get(`${B}/applications/`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const program = url.searchParams.get("program");
    const farmer = url.searchParams.get("farmer");
    const page = url.searchParams.get("page");

    let items = [...db.APPLICATIONS];
    if (status) items = items.filter((a) => a.status === status);
    if (program) items = items.filter((a) => a.program === Number(program));
    if (farmer) items = items.filter((a) => a.farmer === Number(farmer));

    return ok(paginate(items, page));
  }),

  // POST /applications/
  http.post(`${B}/applications/`, async ({ request }) => {
    const body = (await request.json()) as {
      farmer: number;
      program: number;
      notes?: string;
    };
    const farmer = db.FARMERS.find((f) => f.id === body.farmer);
    const program = db.PROGRAMS.find((p) => p.id === body.program);
    if (!farmer || !program)
      return bad({ non_field_errors: ["Farmer or program not found."] });

    const newApp = {
      id: db.nextId(),
      farmer: body.farmer,
      farmer_name: farmer.full_name,
      farmer_barangay: farmer.barangay,
      program: body.program,
      program_name: program.name,
      program_code: program.code,
      status: "SUBMITTED",
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      reviewed_by_name: null,
      rejection_reason: "",
      notes: body.notes || "",
    };
    db.APPLICATIONS.push(newApp);
    return ok(newApp, 201);
  }),
];

// ─── DISTRIBUTIONS ────────────────────────────────────────────────────────────
// /distributions/mine/ and /distributions/bulk-reschedule/ MUST come before /:id/

const distributionsHandlers = [
  // GET /distributions/mine/
  http.get(`${B}/distributions/mine/`, ({ request }) => {
    const user = me(request);
    if (!user) return unauth();
    const farmer = db.FARMERS.find((f) => f.linked_user === user.id);
    if (!farmer) return ok([]);
    const mine = db.DISTRIBUTIONS.filter((d) => d.farmer === farmer.id);
    return ok(mine);
  }),

  // POST /distributions/bulk-reschedule/
  http.post(
    `${B}/distributions/bulk-reschedule/`,
    async ({ request }) => {
      const body = (await request.json()) as {
        program_id: number;
        scheduled_date?: string;
      };
      let updated = 0;
      db.DISTRIBUTIONS.forEach((d) => {
        if (d.program === body.program_id && d.status !== "DELIVERED") {
          if (body.scheduled_date)
            (d as Record<string, unknown>).scheduled_date = body.scheduled_date;
          updated++;
        }
      });
      return ok({ updated });
    }
  ),

  // POST /distributions/:id/update-status/
  http.post(
    `${B}/distributions/:id/update-status/`,
    async ({ request, params }) => {
      const user = me(request);
      const body = (await request.json()) as {
        new_status: string;
        remarks: string;
        scheduled_date?: string;
      };
      const dist = db.DISTRIBUTIONS.find(
        (d) => d.id === Number(params.id)
      );
      if (!dist) return notFound();

      Object.assign(dist, {
        status: body.new_status,
        remarks: body.remarks ?? dist.remarks,
        updated_by: user?.id ?? null,
        updated_by_name: user?.full_name ?? null,
        delivered_at:
          body.new_status === "DELIVERED"
            ? new Date().toISOString()
            : dist.delivered_at,
        scheduled_date: body.scheduled_date ?? dist.scheduled_date,
      });
      return ok(dist);
    }
  ),

  // POST /distributions/:id/confirm-receipt/
  http.post(
    `${B}/distributions/:id/confirm-receipt/`,
    ({ request, params }) => {
      const user = me(request);
      const dist = db.DISTRIBUTIONS.find(
        (d) => d.id === Number(params.id)
      );
      if (!dist) return notFound();
      Object.assign(dist, {
        status: "DELIVERED",
        delivered_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
        updated_by_name: user?.full_name ?? null,
      });
      return ok(dist);
    }
  ),

  // GET /distributions/
  http.get(`${B}/distributions/`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const program = url.searchParams.get("program");
    const scheduledDate = url.searchParams.get("scheduled_date");

    let items = [...db.DISTRIBUTIONS];
    if (status) items = items.filter((d) => d.status === status);
    if (program) items = items.filter((d) => d.program === Number(program));
    if (scheduledDate)
      items = items.filter(
        (d) => (d as Record<string, unknown>).scheduled_date === scheduledDate
      );

    // distributionApi.list() expects { results: Distribution[] }
    return ok({ results: items });
  }),
];

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────

const announcementsHandlers = [
  // DELETE /announcements/:id/  (before PATCH to avoid confusion, though HTTP method differs)
  http.delete(`${B}/announcements/:id/`, ({ params }) => {
    const idx = db.ANNOUNCEMENTS.findIndex(
      (a) => a.id === Number(params.id)
    );
    if (idx === -1) return notFound();
    db.ANNOUNCEMENTS.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // PATCH /announcements/:id/
  http.patch(`${B}/announcements/:id/`, async ({ request, params }) => {
    const ann = db.ANNOUNCEMENTS.find((a) => a.id === Number(params.id));
    if (!ann) return notFound();
    const body = (await request.json()) as Record<string, unknown>;
    Object.assign(ann, body);
    return ok(ann);
  }),

  // GET /announcements/
  http.get(`${B}/announcements/`, ({ request }) => {
    const user = me(request);
    const role = user?.role ?? "CLIENT";
    const visible = db.ANNOUNCEMENTS.filter((a) =>
      a.target_roles.includes(role)
    );
    return ok(paginate(visible, null));
  }),

  // POST /announcements/
  http.post(`${B}/announcements/`, async ({ request }) => {
    const user = me(request);
    const body = (await request.json()) as {
      title: string;
      body: string;
      target_roles: string[];
    };
    const newAnn = {
      id: db.nextId(),
      title: body.title,
      body: body.body,
      target_roles: body.target_roles,
      published_at: new Date().toISOString(),
      created_by: user?.id ?? null,
      created_by_name: user?.full_name ?? null,
    };
    db.ANNOUNCEMENTS.push(newAnn);
    return ok(newAnn, 201);
  }),
];

// ─── FEEDBACK ─────────────────────────────────────────────────────────────────
// /feedback/quality-alert-count/ MUST come before /feedback/:id/

const QUALITY_TYPES = new Set([
  "DAMAGED",
  "EXPIRED",
  "WRONG_QUANTITY",
  "WRONG_ITEM",
]);

const feedbackHandlers = [
  // GET /feedback/quality-alert-count/
  http.get(`${B}/feedback/quality-alert-count/`, () => {
    const count = db.FEEDBACK.filter(
      (f) => f.is_quality_issue && f.status === "NEW"
    ).length;
    return ok({ count });
  }),

  // POST /feedback/:id/update-status/
  http.post(
    `${B}/feedback/:id/update-status/`,
    async ({ request, params }) => {
      const body = (await request.json()) as { status: string };
      const item = db.FEEDBACK.find((f) => f.id === Number(params.id));
      if (!item) return notFound();
      (item as Record<string, unknown>).status = body.status;
      return ok(item);
    }
  ),

  // GET /feedback/
  http.get(`${B}/feedback/`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const issueType = url.searchParams.get("issue_type");
    const quality = url.searchParams.get("quality");
    const page = url.searchParams.get("page");

    let items = [...db.FEEDBACK];
    if (status) items = items.filter((f) => f.status === status);
    if (issueType) items = items.filter((f) => f.issue_type === issueType);
    if (quality === "true") items = items.filter((f) => f.is_quality_issue);

    return ok(paginate(items, page));
  }),

  // POST /feedback/
  http.post(`${B}/feedback/`, async ({ request }) => {
    const user = me(request);
    const body = (await request.json()) as {
      distribution?: number;
      issue_type: string;
      rating: number;
      comment: string;
    };
    const farmer = db.FARMERS.find((f) => f.linked_user === user?.id);
    const dist = body.distribution
      ? db.DISTRIBUTIONS.find((d) => d.id === body.distribution)
      : null;

    const newFeedback = {
      id: db.nextId(),
      farmer: farmer?.id ?? 0,
      farmer_name: farmer?.full_name ?? "Unknown",
      distribution: body.distribution ?? null,
      program_name: dist?.program_name ?? null,
      issue_type: body.issue_type,
      is_quality_issue: QUALITY_TYPES.has(body.issue_type),
      rating: body.rating,
      comment: body.comment,
      status: "NEW",
      created_at: new Date().toISOString(),
    };
    db.FEEDBACK.push(newFeedback);
    return ok(newFeedback, 201);
  }),
];

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
// /unread-count/ and /mark-all-read/ MUST come before /:id/

const notificationsHandlers = [
  // GET /notifications/unread-count/
  http.get(`${B}/notifications/unread-count/`, ({ request }) => {
    const user = me(request);
    const notifs = user ? (db.NOTIFICATIONS[user.username] ?? []) : [];
    return ok({ count: notifs.filter((n) => !n.is_read).length });
  }),

  // POST /notifications/mark-all-read/
  http.post(`${B}/notifications/mark-all-read/`, ({ request }) => {
    const user = me(request);
    const notifs = user ? (db.NOTIFICATIONS[user.username] ?? []) : [];
    const now = new Date().toISOString();
    notifs.forEach((n) => {
      n.is_read = true;
      n.read_at = now;
    });
    return ok({ detail: "All notifications marked as read." });
  }),

  // POST /notifications/:id/mark-read/
  http.post(`${B}/notifications/:id/mark-read/`, ({ request, params }) => {
    const user = me(request);
    const notifs = user ? (db.NOTIFICATIONS[user.username] ?? []) : [];
    const notif = notifs.find((n) => n.id === Number(params.id));
    if (!notif) return notFound();
    notif.is_read = true;
    notif.read_at = new Date().toISOString();
    return ok(notif);
  }),

  // GET /notifications/
  http.get(`${B}/notifications/`, ({ request }) => {
    const user = me(request);
    const notifs = user ? (db.NOTIFICATIONS[user.username] ?? []) : [];
    return ok(paginate(notifs, null));
  }),
];

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

const dashboardHandlers = [
  // GET /dashboard/admin/
  http.get(`${B}/dashboard/admin/`, () => {
    const today = new Date().toISOString().slice(0, 10);
    return ok({
      total_farmers: db.FARMERS.filter((f) => !f.is_archived).length,
      active_programs: db.PROGRAMS.filter((p) => p.status === "ACTIVE").length,
      pending_applications: db.APPLICATIONS.filter(
        (a) => a.status === "SUBMITTED"
      ).length,
      distributions_today: db.DISTRIBUTIONS.filter(
        (d) => (d as Record<string, unknown>).scheduled_date === today
      ).length,
      low_stock_items: db.INVENTORY_ITEMS.filter((i) => i.is_low_stock).length,
      total_distributions: db.DISTRIBUTIONS.length,
      fulfilled_applications: db.APPLICATIONS.filter(
        (a) => a.status === "FULFILLED"
      ).length,
    });
  }),

  // GET /dashboard/staff/
  http.get(`${B}/dashboard/staff/`, () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayDists = db.DISTRIBUTIONS.filter(
      (d) => (d as Record<string, unknown>).scheduled_date === today
    );
    return ok({
      pending_applications: db.APPLICATIONS.filter(
        (a) => a.status === "SUBMITTED"
      ).length,
      distributions_today: todayDists.length,
      scheduled_today: todayDists.filter((d) => d.status === "SCHEDULED")
        .length,
      delivered_today: todayDists.filter((d) => d.status === "DELIVERED")
        .length,
    });
  }),
];

// ─── Export ───────────────────────────────────────────────────────────────────

export const handlers = [
  ...authHandlers,
  ...usersHandlers,
  ...farmersHandlers,
  ...programsHandlers,
  ...inventoryHandlers,
  ...applicationsHandlers,
  ...distributionsHandlers,
  ...announcementsHandlers,
  ...feedbackHandlers,
  ...notificationsHandlers,
  ...dashboardHandlers,
];
