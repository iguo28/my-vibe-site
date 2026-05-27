/** Browser backup for been-to list when Vercel serverless DB resets between requests. */

export type CachedBeenToShop = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  externalPlaceId?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type CachedBeenToRanking = {
  id: string;
  rankPosition: number;
  sentiment: string;
  ratingOutOf10: number | null;
  shop: CachedBeenToShop;
  priceRating?: number | null;
  flavorRating?: number | null;
  flavorNotes?: string | null;
  vibeRating?: number | null;
  foodRating?: number | null;
  favoriteItems?: string | null;
};

const KEY = "cafe_connect_been_to";

function read(): CachedBeenToRanking[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CachedBeenToRanking[];
  } catch {
    return [];
  }
}

function write(list: CachedBeenToRanking[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("cafe-connect-been-to-changed"));
}

export function getBeenToCache(): CachedBeenToRanking[] {
  return read().sort((a, b) => a.rankPosition - b.rankPosition);
}

export function getBeenToCacheEntry(shopId: string): CachedBeenToRanking | null {
  return getBeenToCache().find((r) => r.shop.id === shopId) ?? null;
}

export function addBeenToCache(ranking: CachedBeenToRanking) {
  const list = read().filter((r) => r.shop.id !== ranking.shop.id);
  list.push(ranking);
  write(list.sort((a, b) => a.rankPosition - b.rankPosition));
}

export function updateBeenToCacheCriteria(
  shopId: string,
  criteria: {
    priceRating?: number | null;
    flavorRating?: number | null;
    flavorNotes?: string | null;
    vibeRating?: number | null;
    foodRating?: number | null;
    favoriteItems?: string | null;
  }
) {
  const list = read();
  const idx = list.findIndex((r) => r.shop.id === shopId);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...criteria };
  write(list);
}

export function removeBeenToCache(shopId: string) {
  write(read().filter((r) => r.shop.id !== shopId));
}

export function mergeBeenToRankings(
  server: CachedBeenToRanking[],
  cache: CachedBeenToRanking[]
): CachedBeenToRanking[] {
  const byShop = new Map<string, CachedBeenToRanking>();
  for (const r of server) {
    byShop.set(r.shop.id, r);
  }
  for (const r of cache) {
    const existing = byShop.get(r.shop.id);
    if (!existing) {
      byShop.set(r.shop.id, r);
      continue;
    }
    byShop.set(r.shop.id, {
      ...existing,
      priceRating: existing.priceRating ?? r.priceRating,
      flavorRating: existing.flavorRating ?? r.flavorRating,
      flavorNotes: existing.flavorNotes ?? r.flavorNotes,
      vibeRating: existing.vibeRating ?? r.vibeRating,
      foodRating: existing.foodRating ?? r.foodRating,
      favoriteItems: existing.favoriteItems ?? r.favoriteItems,
      shop: {
        ...existing.shop,
        externalPlaceId: existing.shop.externalPlaceId ?? r.shop.externalPlaceId,
        lat: existing.shop.lat ?? r.shop.lat,
        lng: existing.shop.lng ?? r.shop.lng,
      },
    });
  }
  return Array.from(byShop.values()).sort((a, b) => a.rankPosition - b.rankPosition);
}
