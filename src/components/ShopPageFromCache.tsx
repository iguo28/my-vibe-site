"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RankFlow } from "@/components/RankFlow";
import { getCachedShop, type CachedShop } from "@/lib/shopCache";

export function ShopPageFromCache({ shopId }: { shopId: string }) {
  const [shop, setShop] = useState<CachedShop | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setShop(getCachedShop(shopId));
    setReady(true);
  }, [shopId]);

  if (!ready) {
    return (
      <div className="h-32 animate-pulse rounded-2xl bg-cream-dark" />
    );
  }

  if (!shop) {
    return (
      <div className="space-y-4 rounded-2xl border border-dashed border-cream-dark py-12 text-center">
        <p className="text-latte">Shop not found.</p>
        <p className="text-sm text-latte">
          Add it again from{" "}
          <Link href="/" className="font-medium text-mocha underline">
            search
          </Link>
          .
        </p>
      </div>
    );
  }

  const location = [shop.address, shop.city].filter(Boolean).join(" · ");

  return (
    <div className="space-y-8">
      <section>
        <Link
          href="/"
          className="mb-3 inline-block text-sm text-latte transition hover:text-mocha"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold text-espresso">{shop.name}</h1>
        {location && <p className="mt-1 text-sm text-latte">{location}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-latte">
          Add to been-to list
        </h2>
        <RankFlow shopId={shop.id} shopName={shop.name} rankedCount={0} />
      </section>
    </div>
  );
}
