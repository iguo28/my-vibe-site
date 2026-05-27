"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RankFlow } from "@/components/RankFlow";
import { ShopWantToTryView } from "@/components/ShopWantToTryView";
import { useClientMounted } from "@/hooks/useClientMounted";
import { getCachedShop, type CachedShop } from "@/lib/shopCache";
import { isInWantToTryCache } from "@/lib/wantToTryCache";
import { getBeenToCacheEntry } from "@/lib/beenToCache";

export function ShopPageFromCache({
  shopId,
  initialShop = null,
  fromWantToTry = false,
}: {
  shopId: string;
  initialShop?: CachedShop | null;
  fromWantToTry?: boolean;
}) {
  const mounted = useClientMounted();
  const searchParams = useSearchParams();
  const forceBeenTo = searchParams.get("been") === "1";
  const wtFromUrl =
    searchParams.get("wt") === "1" || searchParams.get("wt") === "true";

  const [shop, setShop] = useState<CachedShop | null>(initialShop);

  useEffect(() => {
    if (!shop) {
      setShop(getCachedShop(shopId));
    }
  }, [shopId, shop]);

  const onWantList =
    !forceBeenTo &&
    (fromWantToTry ||
      wtFromUrl ||
      (mounted && isInWantToTryCache(shopId)));

  const hasBeenTo = mounted && !!getBeenToCacheEntry(shopId);

  if (!mounted || !shop) {
    return (
      <div className="h-32 animate-pulse rounded-2xl bg-cream-dark" />
    );
  }

  const location = [shop.address, shop.city].filter(Boolean).join(" · ");

  return (
    <div className="space-y-8">
      <section>
        <Link
          href={onWantList && !hasBeenTo ? "/want-to-try" : "/"}
          className="mb-3 inline-block text-sm text-latte transition hover:text-mocha"
        >
          ← Back to {onWantList && !hasBeenTo ? "want to try" : "home"}
        </Link>
        <h1 className="text-2xl font-semibold text-espresso">{shop.name}</h1>
        {location && <p className="mt-1 text-sm text-latte">{location}</p>}
      </section>

      {onWantList && !hasBeenTo ? (
        <ShopWantToTryView shopId={shop.id} shopName={shop.name} />
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-latte">
            Add to been-to list
          </h2>
          <RankFlow shopId={shop.id} shopName={shop.name} rankedCount={0} />
        </section>
      )}
    </div>
  );
}
