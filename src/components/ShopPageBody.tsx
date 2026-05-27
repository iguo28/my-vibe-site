"use client";

import { Suspense } from "react";
import {
  ShopBackLink,
  ShopBeenToContent,
} from "@/components/ShopBeenToContent";

type Shop = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
};

type RankingRow = {
  id: string;
  rankPosition: number;
  sentiment: string;
  ratingOutOf10: number | null;
  priceRating: number | null;
  flavorRating: number | null;
  flavorNotes: string | null;
  vibeRating: number | null;
  foodRating: number | null;
  favoriteItems: string | null;
};

export function ShopPageBody({
  shop,
  serverRanking,
  rankedCount,
  priceAverage,
  priceCount,
  onWantToTry,
  fromWantToTry,
  hasRanking,
}: {
  shop: Shop;
  serverRanking: RankingRow | null;
  rankedCount: number;
  priceAverage?: number;
  priceCount?: number;
  onWantToTry: boolean;
  fromWantToTry: boolean;
  hasRanking: boolean;
}) {
  const location = [shop.address, shop.city].filter(Boolean).join(" · ");

  return (
    <div className="space-y-8">
      <section>
        <Suspense
          fallback={
            <div className="mb-3 h-5 w-32 animate-pulse rounded bg-cream-dark" />
          }
        >
          <ShopBackLink
            shopId={shop.id}
            onWantToTry={onWantToTry}
            fromWantToTry={fromWantToTry}
            hasRanking={hasRanking}
          />
        </Suspense>
        <h1 className="text-2xl font-semibold text-espresso">{shop.name}</h1>
        {location && <p className="mt-1 text-sm text-latte">{location}</p>}
      </section>

      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-2xl bg-cream-dark" />
        }
      >
        <ShopBeenToContent
          shop={shop}
          serverRanking={serverRanking}
          rankedCount={rankedCount}
          priceAverage={priceAverage}
          priceCount={priceCount}
          onWantToTry={onWantToTry}
          fromWantToTry={fromWantToTry}
        />
      </Suspense>
    </div>
  );
}
