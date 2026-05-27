import { db } from "@/db";
import {
  coffeeShops,
  userRankings,
  globalScores,
  comparisons,
  wantToTry,
} from "@/db/schema";
import { eq, and, like, or, desc, asc, inArray, sql, avg } from "drizzle-orm";
import {
  id,
  updateElo,
  sentimentWeight,
  initialScoreFromSentiment,
  assignRankPositions,
  computeRatingOutOf10,
  scoresAreClose,
} from "./ranking";
import type { Sentiment } from "@/db/schema";

export async function searchShops(query: string) {
  const q = query.trim();
  if (!q) {
    return db.select().from(coffeeShops).orderBy(asc(coffeeShops.name)).limit(50);
  }
  const pattern = `%${q}%`;
  return db
    .select()
    .from(coffeeShops)
    .where(
      or(
        like(coffeeShops.name, pattern),
        like(coffeeShops.city, pattern),
        like(coffeeShops.address, pattern)
      )
    )
    .orderBy(asc(coffeeShops.name))
    .limit(50);
}

export async function getShop(shopId: string) {
  const [shop] = await db
    .select()
    .from(coffeeShops)
    .where(eq(coffeeShops.id, shopId));
  return shop ?? null;
}

export async function createShop(data: {
  name: string;
  address?: string;
  city?: string;
  externalPlaceId?: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const shopId = id();
  await db.insert(coffeeShops).values({
    id: shopId,
    name: data.name.trim(),
    address: data.address?.trim() || null,
    city: data.city?.trim() || null,
    externalPlaceId: data.externalPlaceId ?? null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
  });
  await db.insert(globalScores).values({
    coffeeShopId: shopId,
    score: 1500,
    ratingCount: 0,
  });
  const [shop] = await db
    .select()
    .from(coffeeShops)
    .where(eq(coffeeShops.id, shopId));
  return shop!;
}

export async function getShopByExternalPlaceId(externalPlaceId: string) {
  const [shop] = await db
    .select()
    .from(coffeeShops)
    .where(eq(coffeeShops.externalPlaceId, externalPlaceId));
  return shop ?? null;
}

export async function findOrCreateShopFromPlace(data: {
  externalPlaceId: string;
  name: string;
  address?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
}) {
  const existing = await getShopByExternalPlaceId(data.externalPlaceId);
  if (existing) return existing;

  return createShop({
    name: data.name,
    address: data.address ?? undefined,
    city: data.city ?? undefined,
    externalPlaceId: data.externalPlaceId,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
  });
}

export async function getUserRankings(userId: string) {
  const rows = await db
    .select({
      ranking: userRankings,
      shop: coffeeShops,
    })
    .from(userRankings)
    .innerJoin(coffeeShops, eq(userRankings.coffeeShopId, coffeeShops.id))
    .where(eq(userRankings.userId, userId))
    .orderBy(asc(userRankings.rankPosition));

  return rows.map((r) => ({
    ...r.ranking,
    shop: r.shop,
  }));
}

export type ShopPriceAverage = {
  average: number;
  count: number;
};

/** Community average price rating (1–5 beans) per shop */
export async function getAveragePriceByShops(
  shopIds: string[]
): Promise<Record<string, ShopPriceAverage>> {
  if (shopIds.length === 0) return {};

  const rows = await db
    .select({
      shopId: userRankings.coffeeShopId,
      average: avg(userRankings.priceRating),
      count: sql<number>`count(${userRankings.priceRating})`.mapWith(Number),
    })
    .from(userRankings)
    .where(
      and(
        inArray(userRankings.coffeeShopId, shopIds),
        sql`${userRankings.priceRating} IS NOT NULL`
      )
    )
    .groupBy(userRankings.coffeeShopId);

  const result: Record<string, ShopPriceAverage> = {};
  for (const row of rows) {
    if (row.average == null || row.count === 0) continue;
    result[row.shopId] = {
      average: Math.round(Number(row.average) * 10) / 10,
      count: row.count,
    };
  }
  return result;
}

export async function getGlobalRankings() {
  return db
    .select({
      shop: coffeeShops,
      global: globalScores,
    })
    .from(globalScores)
    .innerJoin(coffeeShops, eq(globalScores.coffeeShopId, coffeeShops.id))
    .orderBy(desc(globalScores.score));
}

export async function getCommunityStats(): Promise<{
  totalRankings: number;
  averageRatingOutOf10: number | null;
  averagePriceRating: number | null;
}> {
  const [row] = await db
    .select({
      totalRankings: sql<number>`count(*)`.mapWith(Number),
      averageRatingOutOf10: avg(userRankings.ratingOutOf10),
      averagePriceRating: avg(userRankings.priceRating),
    })
    .from(userRankings);

  const avgRating =
    row?.averageRatingOutOf10 == null
      ? null
      : Math.round(Number(row.averageRatingOutOf10) * 10) / 10;

  const avgPrice =
    row?.averagePriceRating == null
      ? null
      : Math.round(Number(row.averagePriceRating) * 10) / 10;

  return {
    totalRankings: row?.totalRankings ?? 0,
    averageRatingOutOf10: avgRating,
    averagePriceRating: avgPrice,
  };
}

export async function getCommunityShopStatsByIds(
  shopIds: string[]
): Promise<
  Record<
    string,
    { count: number; averageRatingOutOf10: number | null; averagePriceRating: number | null }
  >
> {
  if (shopIds.length === 0) return {};

  const rows = await db
    .select({
      shopId: userRankings.coffeeShopId,
      count: sql<number>`count(*)`.mapWith(Number),
      averageRatingOutOf10: avg(userRankings.ratingOutOf10),
      averagePriceRating: avg(userRankings.priceRating),
    })
    .from(userRankings)
    .where(inArray(userRankings.coffeeShopId, shopIds))
    .groupBy(userRankings.coffeeShopId);

  const out: Record<
    string,
    { count: number; averageRatingOutOf10: number | null; averagePriceRating: number | null }
  > = {};

  for (const r of rows) {
    out[r.shopId] = {
      count: r.count,
      averageRatingOutOf10:
        r.averageRatingOutOf10 == null
          ? null
          : Math.round(Number(r.averageRatingOutOf10) * 10) / 10,
      averagePriceRating:
        r.averagePriceRating == null
          ? null
          : Math.round(Number(r.averagePriceRating) * 10) / 10,
    };
  }

  return out;
}

export async function getUserRankingForShop(userId: string, shopId: string) {
  const [row] = await db
    .select()
    .from(userRankings)
    .where(
      and(
        eq(userRankings.userId, userId),
        eq(userRankings.coffeeShopId, shopId)
      )
    );
  return row ?? null;
}

/** Shops user has ranked, sorted by score (for binary-search placement) */
export async function getRankedShopsForPlacement(userId: string) {
  const rows = await getUserRankings(userId);
  return rows.sort((a, b) => b.score - a.score);
}

export type PlacementCandidate = {
  shopId: string;
  shopName: string;
  score: number;
  isClose?: boolean;
};

export type ComparePair = {
  shopId: string;
  shopName: string;
};

/**
 * After sentiment, return the shop to compare against (binary search midpoint).
 * Returns null if user has no other rankings (first shop).
 */
export async function getPlacementOpponent(
  userId: string,
  newShopId: string,
  low: number,
  high: number
): Promise<PlacementCandidate | null> {
  const ranked = (await getRankedShopsForPlacement(userId)).filter(
    (r) => r.coffeeShopId !== newShopId
  );
  if (ranked.length === 0) return null;

  const mid = Math.floor((low + high) / 2);
  const opponent = ranked[mid];
  if (!opponent) return null;

  const [newRow] = await db
    .select()
    .from(userRankings)
    .where(
      and(
        eq(userRankings.userId, userId),
        eq(userRankings.coffeeShopId, newShopId)
      )
    );

  return {
    shopId: opponent.coffeeShopId,
    shopName: opponent.shop.name,
    score: opponent.score,
    isClose: newRow ? scoresAreClose(newRow.score, opponent.score) : false,
  };
}

/** Shops with scores very close to the new shop — optional extra comparisons */
export async function getCloseComparisons(
  userId: string,
  newShopId: string
): Promise<ComparePair[]> {
  const [newRow] = await db
    .select()
    .from(userRankings)
    .where(
      and(
        eq(userRankings.userId, userId),
        eq(userRankings.coffeeShopId, newShopId)
      )
    );
  if (!newRow) return [];

  const ranked = await getRankedShopsForPlacement(userId);
  const seen = new Set<string>();

  return ranked
    .filter((r) => r.coffeeShopId !== newShopId)
    .filter((r) => scoresAreClose(r.score, newRow.score))
    .filter((r) => {
      if (seen.has(r.coffeeShopId)) return false;
      seen.add(r.coffeeShopId);
      return true;
    })
    .slice(0, 4)
    .map((r) => ({
      shopId: r.coffeeShopId,
      shopName: r.shop.name,
    }));
}

/** User picked a winner, or skipped — skip leaves scores unchanged */
export async function recordPreference(
  userId: string,
  newShopId: string,
  opponentShopId: string,
  choice: "new" | "opponent" | "skip",
  sentiment: Sentiment
) {
  if (choice === "skip") return;

  if (choice === "new") {
    await recordComparisonAndUpdate(userId, newShopId, opponentShopId, sentiment);
  } else {
    await recordComparisonAndUpdate(userId, opponentShopId, newShopId, sentiment);
  }
}

export async function recordComparisonAndUpdate(
  userId: string,
  winnerId: string,
  loserId: string,
  sentiment: Sentiment
) {
  const weight = sentimentWeight(sentiment);

  const [winnerRank] = await db
    .select()
    .from(userRankings)
    .where(
      and(
        eq(userRankings.userId, userId),
        eq(userRankings.coffeeShopId, winnerId)
      )
    );
  const [loserRank] = await db
    .select()
    .from(userRankings)
    .where(
      and(
        eq(userRankings.userId, userId),
        eq(userRankings.coffeeShopId, loserId)
      )
    );

  let winnerScore = winnerRank?.score ?? 1500;
  let loserScore = loserRank?.score ?? 1500;

  const updated = updateElo(winnerScore, loserScore, weight);
  winnerScore = updated.winner;
  loserScore = updated.loser;

  await db.insert(comparisons).values({
    id: id(),
    userId,
    winnerShopId: winnerId,
    loserShopId: loserId,
  });

  const now = new Date();
  for (const [shopId, score] of [
    [winnerId, winnerScore],
    [loserId, loserScore],
  ] as const) {
    const [existing] = await db
      .select()
      .from(userRankings)
      .where(
        and(
          eq(userRankings.userId, userId),
          eq(userRankings.coffeeShopId, shopId)
        )
      );
    if (existing) {
      await db
        .update(userRankings)
        .set({ score, updatedAt: now })
        .where(eq(userRankings.id, existing.id));
    }
  }

  await updateGlobalScores(winnerId, loserId, weight);
  await recalcUserRankPositions(userId);
}

async function recalcUserRankPositions(userId: string) {
  const rows = await db
    .select()
    .from(userRankings)
    .where(eq(userRankings.userId, userId));

  const withPositions = assignRankPositions(
    rows.map((r) => ({ ...r, score: r.score }))
  );
  const total = withPositions.length;

  for (const row of withPositions) {
    const ratingOutOf10 = computeRatingOutOf10(
      row.sentiment as Sentiment,
      row.rankPosition,
      total
    );
    await db
      .update(userRankings)
      .set({
        rankPosition: row.rankPosition,
        ratingOutOf10,
        updatedAt: new Date(),
      })
      .where(eq(userRankings.id, row.id));
  }
}

async function updateGlobalScores(
  winnerId: string,
  loserId: string,
  weight: number
) {
  for (const shopId of [winnerId, loserId]) {
    const [gs] = await db
      .select()
      .from(globalScores)
      .where(eq(globalScores.coffeeShopId, shopId));
    if (!gs) {
      await db.insert(globalScores).values({
        coffeeShopId: shopId,
        score: 1500,
        ratingCount: 0,
      });
    }
  }

  const [w] = await db
    .select()
    .from(globalScores)
    .where(eq(globalScores.coffeeShopId, winnerId));
  const [l] = await db
    .select()
    .from(globalScores)
    .where(eq(globalScores.coffeeShopId, loserId));

  const updated = updateElo(w!.score, l!.score, weight);
  const now = new Date();

  await db
    .update(globalScores)
    .set({
      score: updated.winner,
      ratingCount: w!.ratingCount + 1,
      updatedAt: now,
    })
    .where(eq(globalScores.coffeeShopId, winnerId));

  await db
    .update(globalScores)
    .set({
      score: updated.loser,
      ratingCount: l!.ratingCount + 1,
      updatedAt: now,
    })
    .where(eq(globalScores.coffeeShopId, loserId));
}

/** Start ranking: set sentiment, create provisional ranking row */
export async function startRanking(
  userId: string,
  shopId: string,
  sentiment: Sentiment
) {
  const existing = await getUserRankingForShop(userId, shopId);
  if (existing) return existing;

  const score = initialScoreFromSentiment(sentiment);
  const ranked = await getRankedShopsForPlacement(userId);
  const rankPosition = ranked.length + 1;

  const rankingId = id();
  await db.insert(userRankings).values({
    id: rankingId,
    userId,
    coffeeShopId: shopId,
    rankPosition,
    sentiment,
    score,
    updatedAt: new Date(),
  });

  await bumpGlobalSentiment(shopId, sentiment);

  await recalcUserRankPositions(userId);

  await db
    .delete(wantToTry)
    .where(
      and(eq(wantToTry.userId, userId), eq(wantToTry.coffeeShopId, shopId))
    );

  const [row] = await db
    .select()
    .from(userRankings)
    .where(eq(userRankings.id, rankingId));
  return row!;
}

async function bumpGlobalSentiment(shopId: string, sentiment: Sentiment) {
  const delta =
    sentiment === "good" ? 15 : sentiment === "okay" ? 0 : -15;
  const [gs] = await db
    .select()
    .from(globalScores)
    .where(eq(globalScores.coffeeShopId, shopId));

  if (gs) {
    await db
      .update(globalScores)
      .set({
        score: gs.score + delta,
        ratingCount: gs.ratingCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(globalScores.coffeeShopId, shopId));
  } else {
    await db.insert(globalScores).values({
      coffeeShopId: shopId,
      score: 1500 + delta,
      ratingCount: 1,
    });
  }
}

/** Finish placement after binary search — newShopId is the shop being ranked */
export async function finishPlacement(
  userId: string,
  newShopId: string,
  sentiment: Sentiment,
  insertIndex: number
) {
  const ranked = (await getRankedShopsForPlacement(userId)).filter(
    (r) => r.coffeeShopId !== newShopId
  );

  const [newRow] = await db
    .select()
    .from(userRankings)
    .where(
      and(
        eq(userRankings.userId, userId),
        eq(userRankings.coffeeShopId, newShopId)
      )
    );

  if (!newRow) throw new Error("Ranking not started");

  if (ranked.length === 0) {
    await recalcUserRankPositions(userId);
    return [];
  }

  // Compare new shop against neighbors at insert position to refine scores
  if (insertIndex > 0) {
    const better = ranked[insertIndex - 1];
    if (better) {
      await recordComparisonAndUpdate(
        userId,
        better.coffeeShopId,
        newShopId,
        sentiment
      );
    }
  }
  if (insertIndex < ranked.length) {
    const worse = ranked[insertIndex];
    if (worse) {
      await recordComparisonAndUpdate(
        userId,
        newShopId,
        worse.coffeeShopId,
        sentiment
      );
    }
  }

  await recalcUserRankPositions(userId);
  return getCloseComparisons(userId, newShopId);
}

export type ShopCriteriaInput = {
  priceRating?: number | null;
  flavorRating?: number | null;
  flavorNotes?: string | null;
  vibeRating?: number | null;
  foodRating?: number | null;
  favoriteItems?: string | null;
};

function clampRating(n: number | null | undefined): number | null {
  if (n == null || Number.isNaN(n)) return null;
  const v = Math.round(n);
  if (v < 1 || v > 5) return null;
  return v;
}

export async function updateShopCriteria(
  userId: string,
  shopId: string,
  data: ShopCriteriaInput
) {
  const ranking = await getUserRankingForShop(userId, shopId);
  if (!ranking) throw new Error("Shop not on been-to list");

  await db
    .update(userRankings)
    .set({
      priceRating: clampRating(data.priceRating),
      flavorRating: clampRating(data.flavorRating),
      flavorNotes: data.flavorNotes?.trim() || null,
      vibeRating: clampRating(data.vibeRating),
      foodRating: clampRating(data.foodRating),
      favoriteItems: data.favoriteItems?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(userRankings.id, ranking.id));

  return getUserRankingForShop(userId, shopId);
}

/** Remove a shop from the user's been-to list and recalc remaining ranks. */
export async function removeUserRanking(userId: string, shopId: string) {
  const ranking = await getUserRankingForShop(userId, shopId);
  if (!ranking) throw new Error("Shop not on been-to list");

  await db
    .delete(userRankings)
    .where(
      and(
        eq(userRankings.userId, userId),
        eq(userRankings.coffeeShopId, shopId)
      )
    );

  await db
    .delete(comparisons)
    .where(
      and(
        eq(comparisons.userId, userId),
        or(
          eq(comparisons.winnerShopId, shopId),
          eq(comparisons.loserShopId, shopId)
        )
      )
    );

  await recalcUserRankPositions(userId);
}
