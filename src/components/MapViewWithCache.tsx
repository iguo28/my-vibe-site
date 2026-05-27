"use client";

import { useEffect, useMemo, useState } from "react";
import { MapView } from "@/components/MapView";
import { useClientMounted } from "@/hooks/useClientMounted";
import {
  getBeenToCache,
  getBeenToCacheEntry,
  mergeBeenToRankings,
  updateBeenToCacheShopCoords,
  type CachedBeenToRanking,
} from "@/lib/beenToCache";
import {
  geocodeDelay,
  geocodeShopLocationClient,
  parseCoord,
} from "@/lib/geocode";
import { cacheShop, getCachedShop } from "@/lib/shopCache";
import { getWantToTryCache } from "@/lib/wantToTryCache";

type MapShop = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  lat?: number | null;
  lng?: number | null;
};

type BeenToEntry = {
  rankPosition: number;
  sentiment: string;
  shop: MapShop;
};

type WantToTryEntry = {
  shop: MapShop;
};

function enrichShopFromCaches(shop: MapShop): MapShop {
  const session = getCachedShop(shop.id);
  const beenTo = getBeenToCacheEntry(shop.id);
  return {
    ...shop,
    name: shop.name || beenTo?.shop.name || session?.name || shop.name,
    address:
      shop.address ?? beenTo?.shop.address ?? session?.address ?? shop.address,
    city: shop.city ?? beenTo?.shop.city ?? session?.city ?? shop.city,
    lat: shop.lat ?? beenTo?.shop.lat ?? session?.lat ?? null,
    lng: shop.lng ?? beenTo?.shop.lng ?? session?.lng ?? null,
  };
}

function coordsForShop(shop: MapShop): { lat: number; lng: number } | null {
  const enriched = enrichShopFromCaches(shop);
  const lat = parseCoord(enriched.lat);
  const lng = parseCoord(enriched.lng);
  if (lat != null && lng != null) return { lat, lng };
  return null;
}

function applyCoords(shop: MapShop, lat: number, lng: number): MapShop {
  return { ...shop, lat, lng };
}

function rankingToBeenToEntry(r: CachedBeenToRanking): BeenToEntry {
  return {
    rankPosition: r.rankPosition,
    sentiment: r.sentiment,
    shop: enrichShopFromCaches({
      id: r.shop.id,
      name: r.shop.name,
      address: r.shop.address,
      city: r.shop.city,
      lat: r.shop.lat ?? null,
      lng: r.shop.lng ?? null,
    }),
  };
}

function mergeWantToTry(server: WantToTryEntry[]): WantToTryEntry[] {
  const byShopId = new Map<string, WantToTryEntry>();
  for (const e of server) {
    byShopId.set(e.shop.id, { shop: enrichShopFromCaches(e.shop) });
  }
  for (const shop of getWantToTryCache()) {
    if (byShopId.has(shop.id)) continue;
    byShopId.set(shop.id, {
      shop: enrichShopFromCaches({
        id: shop.id,
        name: shop.name,
        address: shop.address,
        city: shop.city,
        lat: shop.lat ?? null,
        lng: shop.lng ?? null,
      }),
    });
  }
  return Array.from(byShopId.values());
}

function buildMergedBeenTo(serverBeenTo: CachedBeenToRanking[]): BeenToEntry[] {
  return mergeBeenToRankings(serverBeenTo, getBeenToCache()).map(
    rankingToBeenToEntry
  );
}

export function MapViewWithCache({
  serverBeenTo,
  serverWantToTry,
}: {
  serverBeenTo: CachedBeenToRanking[];
  serverWantToTry: WantToTryEntry[];
}) {
  const mounted = useClientMounted();
  const [cacheTick, setCacheTick] = useState(0);
  const [coordOverrides, setCoordOverrides] = useState<
    Record<string, { lat: number; lng: number }>
  >({});
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    const onChange = () => setCacheTick((t) => t + 1);
    window.addEventListener("cafe-connect-been-to-changed", onChange);
    return () =>
      window.removeEventListener("cafe-connect-been-to-changed", onChange);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    for (const r of getBeenToCache()) {
      const session = getCachedShop(r.shop.id);
      if (!session) continue;
      const lat = parseCoord(session.lat);
      const lng = parseCoord(session.lng);
      if (lat == null || lng == null) continue;
      if (
        parseCoord(r.shop.lat) === lat &&
        parseCoord(r.shop.lng) === lng
      ) {
        continue;
      }
      updateBeenToCacheShopCoords(r.shop.id, lat, lng);
    }
  }, [mounted]);

  const mergedBeenTo = useMemo(() => {
    if (!mounted) return [];
    return buildMergedBeenTo(serverBeenTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverBeenTo, cacheTick, mounted]);

  const mergedWantToTry = useMemo(() => {
    if (!mounted) return [];
    return mergeWantToTry(serverWantToTry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverWantToTry, cacheTick, mounted]);

  const applyCoordsToEntries = <T extends { shop: MapShop }>(entries: T[]): T[] =>
    entries.map((entry) => {
      const override = coordOverrides[entry.shop.id];
      if (override) {
        return {
          ...entry,
          shop: applyCoords(entry.shop, override.lat, override.lng),
        };
      }
      const found = coordsForShop(entry.shop);
      if (found) {
        return { ...entry, shop: applyCoords(entry.shop, found.lat, found.lng) };
      }
      return entry;
    });

  const beenTo = useMemo(
    () => applyCoordsToEntries(mergedBeenTo),
    [mergedBeenTo, coordOverrides]
  );

  const wantToTry = useMemo(
    () => applyCoordsToEntries(mergedWantToTry),
    [mergedWantToTry, coordOverrides]
  );

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    const been = buildMergedBeenTo(serverBeenTo);
    const want = mergeWantToTry(serverWantToTry);
    const shops = [...been.map((e) => e.shop), ...want.map((e) => e.shop)];
    const needsGeocode = shops.filter((shop) => !coordsForShop(shop));

    if (needsGeocode.length === 0) {
      setGeocoding(false);
      return;
    }

    setGeocoding(true);

    (async () => {
      for (const shop of needsGeocode) {
        if (cancelled) return;

        const enriched = enrichShopFromCaches(shop);
        const coords = await geocodeShopLocationClient(
          enriched.name,
          enriched.address,
          enriched.city
        );
        await geocodeDelay();

        if (cancelled || !coords) continue;

        cacheShop({
          id: enriched.id,
          name: enriched.name,
          address: enriched.address,
          city: enriched.city,
          lat: coords.lat,
          lng: coords.lng,
        });
        if (getBeenToCacheEntry(shop.id)) {
          updateBeenToCacheShopCoords(shop.id, coords.lat, coords.lng);
        }

        setCoordOverrides((prev) => ({
          ...prev,
          [shop.id]: coords,
        }));
      }
      if (!cancelled) setGeocoding(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, serverBeenTo, serverWantToTry, cacheTick]);

  const totalShops = mergedBeenTo.length + mergedWantToTry.length;

  if (!mounted) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-latte">Loading your map…</p>
        <div className="h-[520px] animate-pulse rounded-2xl bg-cream-dark" />
      </div>
    );
  }

  return (
    <MapView
      beenTo={beenTo}
      wantToTry={wantToTry}
      geocoding={geocoding}
      totalShops={totalShops}
    />
  );
}
