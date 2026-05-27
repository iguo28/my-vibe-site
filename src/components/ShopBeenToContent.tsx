"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BeenToShopDetail } from "@/components/BeenToShopDetail";
import { RemoveFromBeenToButton } from "@/components/RemoveFromBeenToButton";
import { ShopCriteriaForm } from "@/components/ShopCriteriaForm";
import { RankFlow } from "@/components/RankFlow";
import type { Sentiment } from "@/db/schema";
import {
  getBeenToCacheEntry,
  type CachedBeenToRanking,
} from "@/lib/beenToCache";
import { cachedShopToPlacePayload } from "@/lib/shopCache";

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

type Props = {
  shop: Shop;
  serverRanking: RankingRow | null;
  rankedCount: number;
  priceAverage?: number;
  priceCount?: number;
  onWantToTry: boolean;
};

function toRankingRow(entry: CachedBeenToRanking): RankingRow {
  return {
    id: entry.id,
    rankPosition: entry.rankPosition,
    sentiment: entry.sentiment,
    ratingOutOf10: entry.ratingOutOf10,
    priceRating: entry.priceRating ?? null,
    flavorRating: entry.flavorRating ?? null,
    flavorNotes: entry.flavorNotes ?? null,
    vibeRating: entry.vibeRating ?? null,
    foodRating: entry.foodRating ?? null,
    favoriteItems: entry.favoriteItems ?? null,
  };
}

export function ShopBeenToContent({
  shop,
  serverRanking,
  rankedCount,
  priceAverage,
  priceCount,
  onWantToTry,
}: Props) {
  const [ranking, setRanking] = useState<RankingRow | null>(serverRanking);
  const [loading, setLoading] = useState(!serverRanking);

  useEffect(() => {
    if (serverRanking) {
      setRanking(serverRanking);
      setLoading(false);
      return;
    }

    const cached = getBeenToCacheEntry(shop.id);
    if (!cached) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/rank/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId: shop.id,
            shop: cachedShopToPlacePayload({
              id: shop.id,
              name: cached.shop.name,
              address: cached.shop.address,
              city: cached.shop.city,
              externalPlaceId: cached.shop.externalPlaceId,
              lat: cached.shop.lat,
              lng: cached.shop.lng,
            }),
            ranking: cached,
          }),
        });
        const data = await res.json();
        if (!cancelled && data.ranking) {
          setRanking({
            id: data.ranking.id,
            rankPosition: data.ranking.rankPosition,
            sentiment: data.ranking.sentiment,
            ratingOutOf10: data.ranking.ratingOutOf10,
            priceRating: data.ranking.priceRating ?? null,
            flavorRating: data.ranking.flavorRating ?? null,
            flavorNotes: data.ranking.flavorNotes ?? null,
            vibeRating: data.ranking.vibeRating ?? null,
            foodRating: data.ranking.foodRating ?? null,
            favoriteItems: data.ranking.favoriteItems ?? null,
          });
        } else if (!cancelled) {
          setRanking(toRankingRow(cached));
        }
      } catch {
        if (!cancelled) setRanking(toRankingRow(cached));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serverRanking, shop.id, shop.name, shop.address, shop.city]);

  if (loading) {
    return (
      <div className="h-40 animate-pulse rounded-2xl bg-cream-dark" aria-hidden />
    );
  }

  if (!ranking) {
    return (
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
          rankedCount={rankedCount}
        />
      </section>
    );
  }

  return (
    <>
      <section className="space-y-3">
        <BeenToShopDetail
          rankPosition={ranking.rankPosition}
          sentiment={ranking.sentiment as Sentiment}
          ratingOutOf10={ranking.ratingOutOf10}
          priceAverage={priceAverage}
          priceCount={priceCount}
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
            priceRating: ranking.priceRating,
            flavorRating: ranking.flavorRating,
            flavorNotes: ranking.flavorNotes,
            vibeRating: ranking.vibeRating,
            foodRating: ranking.foodRating,
            favoriteItems: ranking.favoriteItems,
          }}
        />
      </section>
    </>
  );
}

export function ShopBackLink({
  onWantToTry,
  hasRanking,
}: {
  onWantToTry: boolean;
  hasRanking: boolean;
}) {
  const href = onWantToTry ? "/want-to-try" : hasRanking ? "/been-to" : "/";
  const label = onWantToTry
    ? "want to try"
    : hasRanking
      ? "been-to list"
      : "home";

  return (
    <Link
      href={href}
      className="mb-3 inline-block text-sm text-latte transition hover:text-mocha"
    >
      ← Back to {label}
    </Link>
  );
}
