import { Suspense } from "react";
import { ShopPageBody } from "@/components/ShopPageBody";
import { ShopPageFromCache } from "@/components/ShopPageFromCache";
import { ensureUserInDb, getCurrentUser } from "@/lib/session";
import {
  getShop,
  getUserRankingForShop,
  getUserRankings,
  getAveragePriceByShops,
  upsertShopById,
} from "@/lib/shops";
import {
  cachedShopToPlacePayload,
  isWantToTryFromSearchParams,
  shopFromSearchParams,
} from "@/lib/shopCache";
import { isOnWantToTry } from "@/lib/wantToTry";

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  let shop = await getShop(id);
  const fromQuery = shopFromSearchParams(id, sp);

  if (!shop && fromQuery) {
    await upsertShopById(id, cachedShopToPlacePayload(fromQuery));
    shop = await getShop(id);
  }

  const fromWantToTry = isWantToTryFromSearchParams(sp);

  if (!shop) {
    return (
      <Suspense
        fallback={
          <div className="h-32 animate-pulse rounded-2xl bg-cream-dark" />
        }
      >
        <ShopPageFromCache
          shopId={id}
          initialShop={fromQuery}
          fromWantToTry={fromWantToTry}
        />
      </Suspense>
    );
  }

  await ensureUserInDb();
  const user = await getCurrentUser();
  const userRanking = user
    ? await getUserRankingForShop(user.id, id)
    : null;
  const allRankings = user ? await getUserRankings(user.id) : [];
  const priceAverages = await getAveragePriceByShops([id]);
  const price = priceAverages[id];
  const onWantToTry =
    user && !userRanking
      ? fromWantToTry || (await isOnWantToTry(user.id, id))
      : false;

  const hasRanking = !!userRanking;

  return (
    <ShopPageBody
      shop={{
        id: shop.id,
        name: shop.name,
        address: shop.address,
        city: shop.city,
      }}
      serverRanking={
        userRanking
          ? {
              id: userRanking.id,
              rankPosition: userRanking.rankPosition,
              sentiment: userRanking.sentiment,
              ratingOutOf10: userRanking.ratingOutOf10,
              priceRating: userRanking.priceRating,
              flavorRating: userRanking.flavorRating,
              flavorNotes: userRanking.flavorNotes,
              vibeRating: userRanking.vibeRating,
              foodRating: userRanking.foodRating,
              favoriteItems: userRanking.favoriteItems,
            }
          : null
      }
      rankedCount={
        allRankings.filter((r) => r.coffeeShopId !== shop.id).length
      }
      priceAverage={price?.average}
      priceCount={price?.count}
      onWantToTry={onWantToTry}
      fromWantToTry={fromWantToTry}
      hasRanking={hasRanking}
    />
  );
}
