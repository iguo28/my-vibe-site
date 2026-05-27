/** Browser backup for been-to list when Vercel serverless DB resets between requests. */

export type CachedBeenToRanking = {
  id: string;
  rankPosition: number;
  sentiment: string;
  ratingOutOf10: number | null;
  shop: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
  };
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

export function addBeenToCache(ranking: CachedBeenToRanking) {
  const list = read().filter((r) => r.shop.id !== ranking.shop.id);
  list.push(ranking);
  write(list.sort((a, b) => a.rankPosition - b.rankPosition));
}

export function removeBeenToCache(shopId: string) {
  write(read().filter((r) => r.shop.id !== shopId));
}

/** Drop cache rows that the server already returned (server wins). */
export function syncBeenToCache(serverShopIds: string[]) {
  const ids = new Set(serverShopIds);
  write(read().filter((r) => !ids.has(r.shop.id)));
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
    if (!byShop.has(r.shop.id)) {
      byShop.set(r.shop.id, r);
    }
  }
  return Array.from(byShop.values()).sort((a, b) => a.rankPosition - b.rankPosition);
}
