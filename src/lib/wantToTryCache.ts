import type { CachedShop } from "./shopCache";

const KEY = "cafe_connect_want_to_try";

export function addWantToTryCache(shop: CachedShop) {
  if (typeof window === "undefined") return;
  const list = getWantToTryCache();
  if (list.some((s) => s.id === shop.id)) return;
  list.push(shop);
  sessionStorage.setItem(KEY, JSON.stringify(list));
}

export function getWantToTryCache(): CachedShop[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CachedShop[];
  } catch {
    return [];
  }
}

export function removeWantToTryCache(shopId: string) {
  if (typeof window === "undefined") return;
  const list = getWantToTryCache().filter((s) => s.id !== shopId);
  sessionStorage.setItem(KEY, JSON.stringify(list));
}

export function syncWantToTryCache(serverShopIds: string[]) {
  if (typeof window === "undefined") return;
  const kept = getWantToTryCache().filter((s) => !serverShopIds.includes(s.id));
  sessionStorage.setItem(KEY, JSON.stringify(kept));
}
