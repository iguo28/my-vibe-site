import type { CachedBeenToRanking } from "./beenToCache";

export function toCachedBeenToRanking(row: {
  id: string;
  rankPosition: number;
  sentiment: string;
  ratingOutOf10: number | null;
  priceRating?: number | null;
  flavorRating?: number | null;
  flavorNotes?: string | null;
  vibeRating?: number | null;
  foodRating?: number | null;
  favoriteItems?: string | null;
  shop: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    externalPlaceId?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
}): CachedBeenToRanking {
  return {
    id: row.id,
    rankPosition: row.rankPosition,
    sentiment: row.sentiment,
    ratingOutOf10: row.ratingOutOf10,
    priceRating: row.priceRating ?? null,
    flavorRating: row.flavorRating ?? null,
    flavorNotes: row.flavorNotes ?? null,
    vibeRating: row.vibeRating ?? null,
    foodRating: row.foodRating ?? null,
    favoriteItems: row.favoriteItems ?? null,
    shop: {
      id: row.shop.id,
      name: row.shop.name,
      address: row.shop.address,
      city: row.shop.city,
      externalPlaceId: row.shop.externalPlaceId ?? null,
      lat: row.shop.lat ?? null,
      lng: row.shop.lng ?? null,
    },
  };
}
