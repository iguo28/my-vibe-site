import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "cafe-connect.db"));

const shops = [
  { id: "shop-1", name: "Blue Bottle Hayes", city: "San Francisco", address: "315 Linden St" },
  { id: "shop-2", name: "Sightglass SOMA", city: "San Francisco", address: "270 7th St" },
  { id: "shop-3", name: "Ritual Coffee", city: "San Francisco", address: "1026 Valencia St" },
  { id: "shop-4", name: "Devoción", city: "Brooklyn", address: "69 Grand St" },
  { id: "shop-5", name: "Stumptown Ace Hotel", city: "New York", address: "18 W 29th St" },
  { id: "shop-6", name: "Intelligentsia Silver Lake", city: "Los Angeles", address: "3922 W Sunset Blvd" },
];

db.exec(`
  CREATE TABLE IF NOT EXISTS coffee_shops (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT, city TEXT, created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS global_scores (
    coffee_shop_id TEXT PRIMARY KEY, score REAL NOT NULL DEFAULT 1500,
    rating_count INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL
  );
`);

const now = Date.now();
const insertShop = db.prepare(
  `INSERT OR IGNORE INTO coffee_shops (id, name, address, city, created_at) VALUES (?, ?, ?, ?, ?)`
);
const insertGlobal = db.prepare(
  `INSERT OR IGNORE INTO global_scores (coffee_shop_id, score, rating_count, updated_at) VALUES (?, 1500, 0, ?)`
);

for (const s of shops) {
  insertShop.run(s.id, s.name, s.address, s.city, now);
  insertGlobal.run(s.id, now);
}

console.log(`Seeded ${shops.length} coffee shops.`);
