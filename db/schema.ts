import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const films = pgTable("films", {
  id: varchar("id", { length: 64 }).primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  tagline: text("tagline").notNull(),
  synopsis: text("synopsis").notNull(),
  year: integer("year").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  genres: jsonb("genres").$type<string[]>().notNull(),
  maturity: varchar("maturity", { length: 8 }).notNull(),
  director: varchar("director", { length: 255 }).notNull(),
  cast: jsonb("cast").$type<string[]>().notNull(),
  posterUrl: text("poster_url").notNull(),
  backdropUrl: text("backdrop_url").notNull(),
  videoUrl: text("video_url"),
  videoBlobKey: varchar("video_blob_key", { length: 512 }),
  hlsManifestUrl: text("hls_manifest_url"),
  featured: boolean("featured").default(false),
  trendingRank: integer("trending_rank"),
  awardWinner: boolean("award_winner").default(false),
  festival: varchar("festival", { length: 128 }),
  requiresPremium: boolean("requires_premium").default(false),
  allowedCountries: jsonb("allowed_countries").$type<string[] | null>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userListItems = pgTable(
  "user_list_items",
  {
    userId: varchar("user_id", { length: 128 }).notNull(),
    filmId: varchar("film_id", { length: 64 })
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.filmId] })],
);

export const watchProgress = pgTable(
  "watch_progress",
  {
    userId: varchar("user_id", { length: 128 }).notNull(),
    filmId: varchar("film_id", { length: 64 })
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    positionSeconds: integer("position_seconds").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.filmId] })],
);

export const subscriptions = pgTable("subscriptions", {
  userId: varchar("user_id", { length: 128 }).primaryKey(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 128 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 128 }),
  status: varchar("status", { length: 32 }).notNull().default("inactive"),
  plan: varchar("plan", { length: 32 }).notNull().default("free"),
  currentPeriodEnd: timestamp("current_period_end"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DbFilm = typeof films.$inferSelect;
export type NewDbFilm = typeof films.$inferInsert;
