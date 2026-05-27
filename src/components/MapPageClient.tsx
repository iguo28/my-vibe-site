"use client";

import dynamic from "next/dynamic";
import type { CachedBeenToRanking } from "@/lib/beenToCache";

const MapViewWithCache = dynamic(
  () =>
    import("@/components/MapViewWithCache").then((m) => m.MapViewWithCache),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <p className="text-sm text-latte">Loading your map…</p>
        <div className="h-[520px] animate-pulse rounded-2xl bg-cream-dark" />
      </div>
    ),
  }
);

type WantToTryEntry = {
  shop: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    lat?: number | null;
    lng?: number | null;
  };
};

export function MapPageClient({
  serverBeenTo,
  serverWantToTry,
}: {
  serverBeenTo: CachedBeenToRanking[];
  serverWantToTry: WantToTryEntry[];
}) {
  return (
    <MapViewWithCache
      serverBeenTo={serverBeenTo}
      serverWantToTry={serverWantToTry}
    />
  );
}
