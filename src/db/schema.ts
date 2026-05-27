import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const coffeeShops = sqliteTable("coffee_shops", {
  id: text("id").primaryKey(),
  /** OpenStreetMap place id — dedupe when importing from world search */
  externalPlaceId: text("external_place_id"),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  lat: real("lat"),
  lng: real("lng"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Sentiment when user first rates a shop */
export type Sentiment = "good" | "okay" | "bad";

export const userRankings = sqliteTable("user_rankings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  coffeeShopId: text("coffee_shop_id")
    .notNull()
    .references(() => coffeeShops.id),
  /** Lower = better in personal list (1 = top) */
  rankPosition: integer("rank_position").notNull(),
  sentiment: text("sentiment").$type<Sentiment>().notNull(),
  /** Bradley-Terry strength score for this user */
  score: real("score").notNull().default(1500),
  /** Auto rating 1–10 from sentiment + list position */
  ratingOutOf10: real("rating_out_of_10"),
  /** Optional 1–5 criteria ratings */
  priceRating: integer("price_rating"),
  flavorRating: integer("flavor_rating"),
  flavorNotes: text("flavor_notes"),
  vibeRating: integer("vibe_rating"),
  foodRating: integer("food_rating"),
  favoriteItems: text("favorite_items"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Pairwise comparison outcomes for ranking algorithm */
export const comparisons = sqliteTable("comparisons", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  winnerShopId: text("winner_shop_id")
    .notNull()
    .references(() => coffeeShops.id),
  loserShopId: text("loser_shop_id")
    .notNull()
    .references(() => coffeeShops.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  coffeeShopId: text("coffee_shop_id")
    .notNull()
    .references(() => coffeeShops.id),
  priceNotes: text("price_notes"),
  flavorNotes: text("flavor_notes"),
  overallRating: integer("overall_rating"), // 1-5
  vibeNotes: text("vibe_notes"),
  seasonalNotes: text("seasonal_notes"),
  body: text("body"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Shops the user wants to visit (not yet ranked on been-to list) */
export const wantToTry = sqliteTable("want_to_try", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  coffeeShopId: text("coffee_shop_id")
    .notNull()
    .references(() => coffeeShops.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const globalScores = sqliteTable("global_scores", {
  coffeeShopId: text("coffee_shop_id")
    .primaryKey()
    .references(() => coffeeShops.id),
  score: real("score").notNull().default(1500),
  ratingCount: integer("rating_count").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
