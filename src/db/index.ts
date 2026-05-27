import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "cafe-connect.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

let dbInitialized = false;

export function initDb() {
  if (!dbInitialized) {
    dbInitialized = true;
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS coffee_shops (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        lat REAL,
        lng REAL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS user_rankings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        coffee_shop_id TEXT NOT NULL REFERENCES coffee_shops(id),
        rank_position INTEGER NOT NULL,
        sentiment TEXT NOT NULL,
        score REAL NOT NULL DEFAULT 1500,
        updated_at INTEGER NOT NULL,
        rating_out_of_10 REAL,
        price_rating INTEGER,
        flavor_rating INTEGER,
        flavor_notes TEXT,
        vibe_rating INTEGER,
        food_rating INTEGER,
        favorite_items TEXT,
        UNIQUE(user_id, coffee_shop_id)
      );
      CREATE TABLE IF NOT EXISTS comparisons (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        winner_shop_id TEXT NOT NULL REFERENCES coffee_shops(id),
        loser_shop_id TEXT NOT NULL REFERENCES coffee_shops(id),
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        coffee_shop_id TEXT NOT NULL REFERENCES coffee_shops(id),
        price_notes TEXT,
        flavor_notes TEXT,
        overall_rating INTEGER,
        vibe_notes TEXT,
        seasonal_notes TEXT,
        body TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS global_scores (
        coffee_shop_id TEXT PRIMARY KEY REFERENCES coffee_shops(id),
        score REAL NOT NULL DEFAULT 1500,
        rating_count INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS want_to_try (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        coffee_shop_id TEXT NOT NULL REFERENCES coffee_shops(id),
        created_at INTEGER NOT NULL,
        UNIQUE(user_id, coffee_shop_id)
      );
    `);
  }

  // Always run migrations (dev HMR / schema additions)
  migrateCoffeeShops();
  migrateUserRankings();
}

function migrateCoffeeShops() {
  const cols = sqlite.pragma("table_info(coffee_shops)") as { name: string }[];
  const existing = new Set(cols.map((c) => c.name));

  for (const [name, sqlType] of [
    ["external_place_id", "TEXT"],
    ["lat", "REAL"],
    ["lng", "REAL"],
  ] as const) {
    if (existing.has(name)) continue;
    try {
      sqlite.exec(`ALTER TABLE coffee_shops ADD COLUMN ${name} ${sqlType}`);
    } catch {
      // already exists
    }
  }
}

const USER_RANKING_MIGRATIONS: [string, string][] = [
  ["rating_out_of_10", "REAL"],
  ["price_rating", "INTEGER"],
  ["flavor_rating", "INTEGER"],
  ["flavor_notes", "TEXT"],
  ["vibe_rating", "INTEGER"],
  ["food_rating", "INTEGER"],
  ["favorite_items", "TEXT"],
];

function migrateUserRankings() {
  const cols = sqlite.pragma("table_info(user_rankings)") as { name: string }[];
  const existing = new Set(cols.map((c) => c.name));

  for (const [name, sqlType] of USER_RANKING_MIGRATIONS) {
    if (existing.has(name)) continue;
    try {
      sqlite.exec(
        `ALTER TABLE user_rankings ADD COLUMN ${name} ${sqlType}`
      );
    } catch {
      // Column may have been added by another process
    }
  }
}

initDb();
