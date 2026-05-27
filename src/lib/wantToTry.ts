import { db } from "@/db";
import { wantToTry, coffeeShops } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { id } from "./ranking";
import { getUserRankingForShop } from "./shops";

export async function getWantToTryList(userId: string) {
  const rows = await db
    .select({
      entry: wantToTry,
      shop: coffeeShops,
    })
    .from(wantToTry)
    .innerJoin(coffeeShops, eq(wantToTry.coffeeShopId, coffeeShops.id))
    .where(eq(wantToTry.userId, userId))
    .orderBy(desc(wantToTry.createdAt));

  return rows.map((r) => ({
    id: r.entry.id,
    createdAt: r.entry.createdAt,
    shop: r.shop,
  }));
}

export async function isOnWantToTry(userId: string, shopId: string) {
  const [row] = await db
    .select()
    .from(wantToTry)
    .where(
      and(eq(wantToTry.userId, userId), eq(wantToTry.coffeeShopId, shopId))
    );
  return !!row;
}

export async function addToWantToTry(userId: string, shopId: string) {
  const ranked = await getUserRankingForShop(userId, shopId);
  if (ranked) {
    throw new Error("Already on your been-to list");
  }

  const existing = await isOnWantToTry(userId, shopId);
  if (existing) return;

  await db.insert(wantToTry).values({
    id: id(),
    userId,
    coffeeShopId: shopId,
  });
}

export async function removeFromWantToTry(userId: string, shopId: string) {
  await db
    .delete(wantToTry)
    .where(
      and(eq(wantToTry.userId, userId), eq(wantToTry.coffeeShopId, shopId))
    );
}
