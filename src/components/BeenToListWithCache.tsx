"use client";

import { useEffect, useMemo, useState } from "react";
import { BeenToList } from "@/components/BeenToList";
import {
  getBeenToCache,
  mergeBeenToRankings,
  type CachedBeenToRanking,
} from "@/lib/beenToCache";
import type { ShopPriceAverage } from "@/lib/shops";

export function BeenToListWithCache({
  serverRankings,
  priceAverages = {},
}: {
  serverRankings: CachedBeenToRanking[];
  priceAverages?: Record<string, ShopPriceAverage>;
}) {
  const [cacheTick, setCacheTick] = useState(0);

  useEffect(() => {
    const onChange = () => setCacheTick((t) => t + 1);
    window.addEventListener("cafe-connect-been-to-changed", onChange);
    return () =>
      window.removeEventListener("cafe-connect-been-to-changed", onChange);
  }, []);

  const rankings = useMemo(() => {
    return mergeBeenToRankings(serverRankings, getBeenToCache());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-merge when cache updates
  }, [serverRankings, cacheTick]);

  return <BeenToList rankings={rankings} priceAverages={priceAverages} />;
}

export function BeenToSavedCount({
  serverRankings,
}: {
  serverRankings: CachedBeenToRanking[];
}) {
  const [count, setCount] = useState(serverRankings.length);

  useEffect(() => {
    const update = () => {
      setCount(mergeBeenToRankings(serverRankings, getBeenToCache()).length);
    };
    update();
    window.addEventListener("cafe-connect-been-to-changed", update);
    return () =>
      window.removeEventListener("cafe-connect-been-to-changed", update);
  }, [serverRankings]);

  return <>{count}</>;
}
