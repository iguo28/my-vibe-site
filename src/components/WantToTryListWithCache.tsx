"use client";

import { useEffect, useMemo, useState } from "react";
import { WantToTryList } from "@/components/WantToTryList";
import { getWantToTryCache, syncWantToTryCache } from "@/lib/wantToTryCache";

type Entry = {
  id: string;
  shop: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    lat?: number | null;
    lng?: number | null;
  };
};

export function WantToTryListWithCache({
  serverEntries,
}: {
  serverEntries: Entry[];
}) {
  const [cacheTick, setCacheTick] = useState(0);

  useEffect(() => {
    syncWantToTryCache(serverEntries.map((e) => e.shop.id));
    setCacheTick((t) => t + 1);
  }, [serverEntries]);

  const entries = useMemo(() => {
    const byShopId = new Map<string, Entry>();
    for (const e of serverEntries) {
      byShopId.set(e.shop.id, e);
    }
    for (const shop of getWantToTryCache()) {
      if (byShopId.has(shop.id)) continue;
      byShopId.set(shop.id, {
        id: `cache-${shop.id}`,
        shop: {
          id: shop.id,
          name: shop.name,
          address: shop.address,
          city: shop.city,
          lat: shop.lat ?? null,
          lng: shop.lng ?? null,
        },
      });
    }
    return Array.from(byShopId.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-merge when cache sync runs
  }, [serverEntries, cacheTick]);

  return <WantToTryList entries={entries} />;
}
