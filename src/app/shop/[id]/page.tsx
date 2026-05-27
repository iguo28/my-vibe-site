import { RankFlow } from "@/components/RankFlow";
import { ShopPageFromCache } from "@/components/ShopPageFromCache";
import {
  ShopBackLink,
  ShopBeenToContent,
} from "@/components/ShopBeenToContent";
import { ensureUserInDb, getCurrentUser } from "@/lib/session";
import {
  getShop,
  getUserRankingForShop,
  getUserRankings,
  getAveragePriceByShops,
  upsertShopById,
} from "@/lib/shops";
import { cachedShopToPlacePayload, shopFromSearchParams } from "@/lib/shopCache";
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

  if (!shop) {
    return <ShopPageFromCache shopId={id} initialShop={fromQuery} />;
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
    user && !userRanking ? await isOnWantToTry(user.id, id) : false;

  const location = [shop.address, shop.city].filter(Boolean).join(" · ");
  const hasRanking = !!userRanking;

  return (
    <div className="space-y-8">
      <section>
        <ShopBackLink onWantToTry={onWantToTry} hasRanking={hasRanking} />
        <h1 className="text-2xl font-semibold text-espresso">{shop.name}</h1>
        {location && <p className="mt-1 text-sm text-latte">{location}</p>}
      </section>

      <ShopBeenToContent
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
      />
    </div>
  );
}
