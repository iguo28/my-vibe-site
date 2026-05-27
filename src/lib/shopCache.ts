/** Browser cache so shop pages work when Vercel uses a fresh serverless DB instance. */

export type CachedShop = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  externalPlaceId?: string | null;
  lat?: number | null;
  lng?: number | null;
};

function cacheKey(shopId: string) {
  return `cafe_connect_shop_${shopId}`;
}

export function cacheShop(shop: CachedShop) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(cacheKey(shop.id), JSON.stringify(shop));
}

export function getCachedShop(shopId: string): CachedShop | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(cacheKey(shopId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedShop;
  } catch {
    return null;
  }
}

/** Payload for APIs to recreate a shop on the current server instance. */
export function cachedShopToPlacePayload(shop: CachedShop) {
  return {
    externalPlaceId: shop.externalPlaceId?.trim() || shop.id,
    name: shop.name,
    address: shop.address,
    city: shop.city,
    lat: shop.lat ?? null,
    lng: shop.lng ?? null,
  };
}
