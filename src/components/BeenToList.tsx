import Link from "next/link";
import { ShopCard } from "@/components/ShopCard";
import type { Sentiment } from "@/db/schema";
import type { ShopPriceAverage } from "@/lib/shops";
import { shopPath } from "@/lib/shopCache";
import type { CachedBeenToShop } from "@/lib/beenToCache";

type Ranking = {
  id: string;
  rankPosition: number;
  sentiment: string;
  ratingOutOf10: number | null;
  shop: CachedBeenToShop;
};

export function BeenToList({
  rankings,
  priceAverages = {},
}: {
  rankings: Ranking[];
  priceAverages?: Record<string, ShopPriceAverage>;
}) {
  if (rankings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cream-dark py-12 text-center">
        <p className="text-latte">Your been-to list is empty.</p>
        <p className="mt-2 text-sm text-latte">
          <Link
            href="/"
            className="font-medium text-mocha underline-offset-2 hover:underline"
          >
            Search
          </Link>{" "}
          for Boston coffee shops and add it to your been-to list.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {rankings.map((r) => {
        const price = priceAverages[r.shop.id];
        const shopForLink: CachedBeenToShop = {
          id: r.shop.id,
          name: r.shop.name,
          address: r.shop.address,
          city: r.shop.city,
          externalPlaceId: r.shop.externalPlaceId,
          lat: r.shop.lat,
          lng: r.shop.lng,
        };

        return (
          <li key={r.id}>
            <ShopCard
              shop={r.shop}
              href={shopPath(shopForLink)}
              rank={r.rankPosition}
              sentiment={r.sentiment as Sentiment}
              ratingOutOf10={r.ratingOutOf10}
              priceAverage={price?.average}
              priceCount={price?.count}
            />
          </li>
        );
      })}
    </ul>
  );
}
