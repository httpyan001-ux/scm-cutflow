import { pgTable, text, boolean, integer, timestamp, jsonb, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable(
  "scm_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    username: text("username"),
    passwordHash: text("password_hash").notNull().default(""),
    emailVerified: boolean("email_verified").notNull().default(false),
    displayName: text("display_name").notNull().default("Forge Operator"),
    avatar: text("avatar").notNull().default("⬢"),
    photoUrl: text("photo_url").notNull().default(""),
    background: text("background").notNull().default("nebula"),
    backgroundUrl: text("background_url").notNull().default(""),
    themePrimary: text("theme_primary").notNull().default("#00e5ff"),
    themeSecondary: text("theme_secondary").notNull().default("#ff2e4c"),
    // ---- PRO studio overlay presets (synced across devices) ----
    logoUrl: text("logo_url").notNull().default(""),
    studioPrefs: jsonb("studio_prefs").notNull().default({}),
    aiApiKey: text("ai_api_key").notNull().default(""),
    aiProvider: text("ai_provider").notNull().default("auto"),
    isPro: boolean("is_pro").notNull().default(false),
    proStartedAt: timestamp("pro_started_at", { withTimezone: true }),
    proExpiresAt: timestamp("pro_expires_at", { withTimezone: true }),
    proPlan: text("pro_plan").notNull().default("30-day"),
    proByok: boolean("pro_byok").notNull().default(false),
    credits: integer("credits").notNull().default(60),
    failedLogins: integer("failed_logins").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("scm_users_username_idx").on(t.username)]
);

export const sessions = pgTable(
  "scm_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    userAgent: text("user_agent").notNull().default(""),
    ip: text("ip").notNull().default(""),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("scm_sessions_user_idx").on(t.userId)]
);

export const otpCodes = pgTable(
  "scm_otp_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    purpose: text("purpose").notNull().default("register"),
    attempts: integer("attempts").notNull().default(0),
    consumed: boolean("consumed").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("scm_otp_email_idx").on(t.email)]
);

export const tasks = pgTable(
  "scm_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    faction: text("faction").notNull(),
    status: text("status").notNull().default("queued"),
    progress: integer("progress").notNull().default(4),
    cost: integer("cost").notNull().default(0),
    inputPayload: jsonb("input_payload").notNull().default({}),
    resultPayload: jsonb("result_payload").default({}),
    error: text("error"),
    // ---- render routing (VPS cpu  vs  Google Colab T4 gpu) ----
    lane: text("lane").notNull().default("cpu"),            // cpu | gpu
    runner: text("runner").notNull().default("vps"),        // vps | colab
    workerId: text("worker_id"),                            // which colab node took it
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }),
    stage: text("stage").notNull().default(""),             // worker-reported stage
    workerLog: jsonb("worker_log").default([]),             // streamed log lines
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("scm_tasks_user_idx").on(t.userId), index("scm_tasks_faction_idx").on(t.faction), index("scm_tasks_created_idx").on(t.createdAt)]
);

export const workers = pgTable(
  "scm_workers",
  {
    id: text("id").primaryKey(),                            // colab-<uuid>
    kind: text("kind").notNull().default("colab"),
    gpuName: text("gpu_name").notNull().default("T4"),
    callbackUrl: text("callback_url").notNull().default(""), // optional push URL (ngrok/cloudflared)
    status: text("status").notNull().default("idle"),        // idle | busy | offline
    activeTaskId: uuid("active_task_id"),
    jobsDone: integer("jobs_done").notNull().default(0),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("scm_workers_seen_idx").on(t.lastSeenAt)]
);

export const creditOrders = pgTable(
  "scm_credit_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    priceMmk: integer("price_mmk").notNull(),
    method: text("method").notNull().default("KBPay"),
    status: text("status").notNull().default("completed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("scm_credit_orders_user_idx").on(t.userId)]
);

export const proOrders = pgTable(
  "scm_pro_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    plan: text("plan").notNull().default("30-day"),
    mode: text("mode").notNull().default("standard"),
    priceMmk: integer("price_mmk").notNull().default(15000),
    method: text("method").notNull().default("KBPay"),
    status: text("status").notNull().default("completed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("scm_pro_orders_user_idx").on(t.userId)]
);

export type DbUser = typeof users.$inferSelect;
export type DbTask = typeof tasks.$inferSelect;
