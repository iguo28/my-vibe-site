import { MapPageClient } from "@/components/MapPageClient";
import { ensureUserInDb } from "@/lib/session";
import { toCachedBeenToRanking } from "@/lib/beenToSerialize";
import {
  ensureShopCoordinates,
  getUserRankings,
  type ShopRecord,
} from "@/lib/shops";
import { getWantToTryList } from "@/lib/wantToTry";

async function enrichListCoords<T extends { shop: ShopRecord }>(
  entries: T[],
  cache: Map<string, ShopRecord>
): Promise<T[]> {
  const out: T[] = [];
  for (const entry of entries) {
    let shop = cache.get(entry.shop.id);
    if (!shop) {
      shop = await ensureShopCoordinates(entry.shop);
      cache.set(entry.shop.id, shop);
    }
    out.push({ ...entry, shop } as T);
  }
  return out;
}

export default async function MapPage() {
  const user = await ensureUserInDb();
  const beenToRaw = user ? await getUserRankings(user.id) : [];
  const wantToTryRaw = user ? await getWantToTryList(user.id) : [];

  const coordCache = new Map<string, ShopRecord>();
  const beenTo = await enrichListCoords(beenToRaw, coordCache);
  const wantToTry = await enrichListCoords(wantToTryRaw, coordCache);

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold uppercase tracking-wide text-espresso">
          Map
        </h1>
        <p className="text-sm text-latte">
          See the shops you&apos;ve been to and want to try.
        </p>
      </section>

      <MapPageClient
        serverBeenTo={beenTo.map((r) =>
          toCachedBeenToRanking({
            id: r.id,
            rankPosition: r.rankPosition,
            sentiment: r.sentiment,
            ratingOutOf10: r.ratingOutOf10,
            priceRating: r.priceRating,
            flavorRating: r.flavorRating,
            flavorNotes: r.flavorNotes,
            vibeRating: r.vibeRating,
            foodRating: r.foodRating,
            favoriteItems: r.favoriteItems,
            shop: r.shop,
          })
        )}
        serverWantToTry={wantToTry.map((e) => ({
          shop: {
            id: e.shop.id,
            name: e.shop.name,
            address: e.shop.address,
            city: e.shop.city,
            lat: e.shop.lat,
            lng: e.shop.lng,
          },
        }))}
      />
    </div>
  );
}
