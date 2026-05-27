import type { CachedBeenToRanking } from "./beenToCache";

export function toCachedBeenToRanking(row: {
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
}): CachedBeenToRanking {
  return row;
}
