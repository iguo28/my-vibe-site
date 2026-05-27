import Link from "next/link";
import { RankFlow } from "@/components/RankFlow";
import { ShopPageFromCache } from "@/components/ShopPageFromCache";
import { BeenToShopDetail } from "@/components/BeenToShopDetail";
import { RemoveFromBeenToButton } from "@/components/RemoveFromBeenToButton";
import { ShopCriteriaForm } from "@/components/ShopCriteriaForm";
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
import type { Sentiment } from "@/db/schema";

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

  return (
    <div className="space-y-8">
      <section>
        <Link
          href={onWantToTry ? "/want-to-try" : "/"}
          className="mb-3 inline-block text-sm text-latte transition hover:text-mocha"
        >
          ← Back to {onWantToTry ? "want to try" : "been-to list"}
        </Link>
        <h1 className="text-2xl font-semibold text-espresso">{shop.name}</h1>
        {location && <p className="mt-1 text-sm text-latte">{location}</p>}
      </section>

      {userRanking ? (
        <>
          <section className="space-y-3">
            <BeenToShopDetail
              rankPosition={userRanking.rankPosition}
              sentiment={userRanking.sentiment as Sentiment}
              ratingOutOf10={userRanking.ratingOutOf10}
              priceAverage={price?.average}
              priceCount={price?.count}
            />
            <RemoveFromBeenToButton shopId={shop.id} shopName={shop.name} />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-latte">
              Your ratings
            </h2>
            <ShopCriteriaForm
              shopId={shop.id}
              initial={{
                priceRating: userRanking.priceRating,
                flavorRating: userRanking.flavorRating,
                flavorNotes: userRanking.flavorNotes,
                vibeRating: userRanking.vibeRating,
                foodRating: userRanking.foodRating,
                favoriteItems: userRanking.favoriteItems,
              }}
            />
          </section>
        </>
      ) : (
        <section className="space-y-3">
          {onWantToTry && (
            <p className="rounded-xl bg-caramel/10 px-3 py-2 text-sm text-mocha">
              On your want-to-try list — pick a cup when you&apos;ve been here.
            </p>
          )}
          <h2 className="text-sm font-medium uppercase tracking-wide text-latte">
            Add to been-to list
          </h2>
          <RankFlow
            shopId={shop.id}
            shopName={shop.name}
            rankedCount={
              allRankings.filter((r) => r.coffeeShopId !== shop.id).length
            }
          />
        </section>
      )}
    </div>
  );
}
