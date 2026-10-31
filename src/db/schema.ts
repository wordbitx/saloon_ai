import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Tenants ────────────────────────────────────────────────────────────────
// Har tenant = aik salon. Neeche HAR user-data row par salonId mandatory hai.
export const salons = pgTable("salons", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  area: text("area").notNull().default("Lahore"),
  city: text("city").notNull().default("Lahore"),
  greeting: text("greeting").notNull(),
  openTime: text("open_time").notNull().default("11:00"),
  closeTime: text("close_time").notNull().default("20:00"),
  closedDays: jsonb("closed_days").$type<string[]>().notNull().default([]),
  repeatEnabled: boolean("repeat_enabled").notNull().default(true),
  reviewUrl: text("review_url"), // TODO (owner decision): asli Google review link
  branches: jsonb("branches").$type<string[]>().notNull().default([]),
  plan: text("plan").notNull().default("growth"), // starter | growth | business
  adminPin: text("admin_pin").notNull().default("2468"), // DEMO PIN — owner production mein badlein
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staffMembers = pgTable("staff_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  specialty: text("specialty").notNull().default("Stylist"),
  role: text("role").notNull().default("Stylist"), // Senior Stylist | Stylist | Makeup Artist | Nails | Manager
  phoneMasked: text("phone_masked").notNull().default("+92 3•• ••••—"),
  active: boolean("active").notNull().default(true),
  rating: integer("rating").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Chairs — same chair par same waqt do booking NAHI hoti (conflict guard)
export const chairs = pgTable("chairs", {
  id: uuid("id").primaryKey().defaultRandom(),
  salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("chair"), // chair | room
  staffId: uuid("staff_id"), // default stylist (nullable)
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Salon shelf — admin add/edit karta hai, public home + /products par dikhta hai.
export const retailProducts = pgTable("retail_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  pricePkr: integer("price_pkr").notNull(),
  category: text("category").notNull().default("Haircare"),
  stock: integer("stock").notNull().default(8),
  emoji: text("emoji").notNull().default("✨"),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Product order — public se aata hai, admin dashboard mein hi dikhta hai.
export const productOrders = pgTable("product_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  orderCode: text("order_code").notNull(),
  customerName: text("customer_name").notNull(),
  phoneMasked: text("phone_masked").notNull(),
  productId: uuid("product_id"),
  productName: text("product_name").notNull(),
  qty: integer("qty").notNull().default(1),
  pricePkr: integer("price_pkr").notNull(),
  totalPkr: integer("total_pkr").notNull(),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("new"), // new | confirmed | ready | completed | cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  pricePkr: integer("price_pkr").notNull(),
  durationMins: integer("duration_mins").notNull().default(45),
  category: text("category").notNull().default("regular"), // regular | bridal | addon
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  personaKey: text("persona_key").notNull(),
  name: text("name").notNull(),
  phoneMasked: text("phone_masked").notNull(),
  lastService: text("last_service").notNull().default(""),
  visits: integer("visits").notNull().default(1),
  tag: text("tag").notNull().default("regular"), // new | regular | vip | at-risk
  preferredStaff: text("preferred_staff"),
  notes: text("notes").notNull().default(""),
  totalSpentPkr: integer("total_spent_pkr").notNull().default(0),
  lastVisitISO: text("last_visit_iso"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  phoneMasked: text("phone_masked").notNull(),
  serviceName: text("service_name").notNull(),
  staffName: text("staff_name"),
  chairId: uuid("chair_id"),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").notNull(), // "5:00 PM"
  branch: text("branch"), // multi-branch workspace filter (null = first branch)
  status: text("status").notNull().default("confirmed"), // confirmed | completed | cancelled | no-show
  source: text("source").notNull().default("chat"), // recovered | missed-call | waitlist | walk-in | chat | admin
  pricePkr: integer("price_pkr").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const missedMessages = pgTable("missed_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  channel: text("channel").notNull().default("whatsapp"), // whatsapp | call
  customerLabel: text("customer_label").notNull(),
  snippet: text("snippet").notNull(),
  status: text("status").notNull().default("pending"), // pending | recovered
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  phoneMasked: text("phone_masked").notNull(),
  serviceName: text("service_name").notNull(),
  preferredTime: text("preferred_time").notNull(),
  status: text("status").notNull().default("waiting"), // waiting | offered | booked
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviewRequests = pgTable("review_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  serviceName: text("service_name").notNull(),
  status: text("status").notNull().default("sent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityEvents = pgTable("activity_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // booking | missed | recovered | review | waitlist | reminder | voice | brief
  detail: text("detail").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});