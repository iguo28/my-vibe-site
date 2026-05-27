"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BeanRating } from "@/components/BeanRating";
import {
  addBeenToCache,
  getBeenToCacheEntry,
  updateBeenToCacheCriteria,
} from "@/lib/beenToCache";
import { cachedShopToPlacePayload, getCachedShop } from "@/lib/shopCache";

type Criteria = {
  priceRating: number | null;
  flavorRating: number | null;
  flavorNotes: string | null;
  vibeRating: number | null;
  foodRating: number | null;
  favoriteItems: string | null;
};

type Props = {
  shopId: string;
  initial: Criteria;
};

const inputClass =
  "w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm text-espresso placeholder:text-latte-light/70 focus:border-latte focus:outline-none focus:ring-2 focus:ring-latte/20";

export function ShopCriteriaForm({ shopId, initial }: Props) {
  const router = useRouter();
  const [priceRating, setPriceRating] = useState(initial.priceRating);
  const [flavorRating, setFlavorRating] = useState(initial.flavorRating);
  const [flavorNotes, setFlavorNotes] = useState(initial.flavorNotes ?? "");
  const [vibeRating, setVibeRating] = useState(initial.vibeRating);
  const [foodRating, setFoodRating] = useState(initial.foodRating);
  const [favoriteItems, setFavoriteItems] = useState(initial.favoriteItems ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const criteriaPayload = {
      priceRating,
      flavorRating,
      flavorNotes: flavorNotes || null,
      vibeRating,
      foodRating,
      favoriteItems: favoriteItems || null,
    };

    updateBeenToCacheCriteria(shopId, criteriaPayload);

    try {
      const cached = getBeenToCacheEntry(shopId);
      const session = getCachedShop(shopId);
      const shopPayload = cached
        ? cachedShopToPlacePayload({
            id: shopId,
            name: cached.shop.name,
            address: cached.shop.address,
            city: cached.shop.city,
            externalPlaceId: cached.shop.externalPlaceId,
            lat: cached.shop.lat,
            lng: cached.shop.lng,
          })
        : session
          ? cachedShopToPlacePayload(session)
          : undefined;

      const res = await fetch("/api/rank/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          ...criteriaPayload,
          ...(shopPayload && cached
            ? {
                shop: shopPayload,
                ranking: {
                  sentiment: cached.sentiment,
                  rankPosition: cached.rankPosition,
                  ratingOutOf10: cached.ratingOutOf10,
                  priceRating: criteriaPayload.priceRating,
                  flavorRating: criteriaPayload.flavorRating,
                  flavorNotes: criteriaPayload.flavorNotes,
                  vibeRating: criteriaPayload.vibeRating,
                  foodRating: criteriaPayload.foodRating,
                  favoriteItems: criteriaPayload.favoriteItems,
                },
              }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save");
      }
      if (data.ranking) {
        addBeenToCache(data.ranking);
      }
      router.push("/been-to");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-cream-dark bg-white p-4">
      <div className="grid gap-5 sm:grid-cols-2">
        <BeanRating
          label="Price"
          value={priceRating}
          onChange={setPriceRating}
          disabled={loading}
        />
        <BeanRating
          label="Flavor options"
          value={flavorRating}
          onChange={setFlavorRating}
          disabled={loading}
        />
        <BeanRating
          label="Vibe"
          value={vibeRating}
          onChange={setVibeRating}
          disabled={loading}
        />
        <BeanRating
          label="Food"
          value={foodRating}
          onChange={setFoodRating}
          disabled={loading}
        />
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-espresso">Flavor options (notes)</span>
        <input
          type="text"
          value={flavorNotes}
          onChange={(e) => setFlavorNotes(e.target.value)}
          disabled={loading}
          placeholder="e.g. oat latte, seasonal pour-over…"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-espresso">Favorite items</span>
        <textarea
          value={favoriteItems}
          onChange={(e) => setFavoriteItems(e.target.value)}
          disabled={loading}
          rows={3}
          placeholder="What do you always order?"
          className={inputClass}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-mocha px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-espresso-light disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save ratings"}
        </button>
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </form>
  );
}
