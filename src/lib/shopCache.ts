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

/** Query string so the shop page can load on Vercel (survives serverless DB split). */
export function shopToQueryString(shop: CachedShop): string {
  const p = new URLSearchParams();
  p.set("n", shop.name);
  if (shop.address) p.set("a", shop.address);
  if (shop.city) p.set("c", shop.city);
  if (shop.externalPlaceId) p.set("ep", shop.externalPlaceId);
  if (shop.lat != null && Number.isFinite(shop.lat)) p.set("lat", String(shop.lat));
  if (shop.lng != null && Number.isFinite(shop.lng)) p.set("lng", String(shop.lng));
  return p.toString();
}

export function shopPath(shop: CachedShop): string {
  const q = shopToQueryString(shop);
  return `/shop/${shop.id}?${q}`;
}

export function shopFromSearchParams(
  shopId: string,
  sp: Record<string, string | string[] | undefined>
): CachedShop | null {
  const pick = (key: string) => {
    const v = sp[key];
    return typeof v === "string" ? v : undefined;
  };
  const name = pick("n");
  if (!name) return null;
  const lat = pick("lat");
  const lng = pick("lng");
  return {
    id: shopId,
    name,
    address: pick("a") ?? null,
    city: pick("c") ?? null,
    externalPlaceId: pick("ep") ?? null,
    lat: lat != null && lat !== "" ? Number(lat) : null,
    lng: lng != null && lng !== "" ? Number(lng) : null,
  };
}

export function toCachedShop(data: {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  externalPlaceId?: string | null;
  lat?: number | null;
  lng?: number | null;
}): CachedShop {
  return {
    id: data.id,
    name: data.name,
    address: data.address ?? null,
    city: data.city ?? null,
    externalPlaceId: data.externalPlaceId ?? null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
  };
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
