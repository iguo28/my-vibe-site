import Link from "next/link";
import {
  BeenToListWithCache,
  BeenToSavedCount,
} from "@/components/BeenToListWithCache";
import { ensureUserInDb } from "@/lib/session";
import { getUserRankings, getAveragePriceByShops } from "@/lib/shops";
import { toCachedBeenToRanking } from "@/lib/beenToSerialize";

export default async function BeenToPage() {
  const user = await ensureUserInDb();
  const rankings = user ? await getUserRankings(user.id) : [];
  const serverRankings = rankings.map((r) =>
    toCachedBeenToRanking({
      id: r.id,
      rankPosition: r.rankPosition,
      sentiment: r.sentiment,
      ratingOutOf10: r.ratingOutOf10,
      shop: r.shop,
    })
  );
  const shopIds = rankings.map((r) => r.shop.id);
  const priceAverages = await getAveragePriceByShops(shopIds);

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold uppercase tracking-wide text-espresso">
          Been to
        </h1>
        <p className="text-sm text-latte">Your ranked list of coffee shops.</p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-latte">
            Saved (<BeenToSavedCount serverRankings={serverRankings} />)
          </h2>
          <Link
            href="/"
            className="text-sm font-medium text-mocha transition hover:text-espresso-light"
          >
            Find shops →
          </Link>
        </div>
        <BeenToListWithCache
          serverRankings={serverRankings}
          priceAverages={priceAverages}
        />
      </section>
    </div>
  );
}

