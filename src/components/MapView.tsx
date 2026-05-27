"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { parseCoord } from "@/lib/geocode";

type Shop = {
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
  shop: Shop;
};

type WantToTryEntry = {
  shop: Shop;
};

const BEEN_TO_COLOR = "#2f6f4e";
const WANT_TO_TRY_COLOR = "#c4a574";

function FitBounds({
  positions,
  useMap,
}: {
  positions: [number, number][];
  useMap: () => LeafletMap;
}) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }
    map.fitBounds(positions, { padding: [40, 40], maxZoom: 15 });
  }, [map, positions]);

  return null;
}

export function MapView({
  beenTo,
  wantToTry,
  geocoding = false,
  totalShops = 0,
}: {
  beenTo: BeenToEntry[];
  wantToTry: WantToTryEntry[];
  geocoding?: boolean;
  totalShops?: number;
}) {
  const pins = useMemo(() => {
    const list: Array<{
      kind: "beenTo" | "wantToTry";
      shop: Shop;
      label: string;
    }> = [];
    for (const r of beenTo) {
      list.push({
        kind: "beenTo",
        shop: r.shop,
        label: `BEEN TO · #${r.rankPosition}`,
      });
    }
    for (const w of wantToTry) {
      list.push({
        kind: "wantToTry",
        shop: w.shop,
        label: "WANT TO TRY",
      });
    }
    return list;
  }, [beenTo, wantToTry]);

  const withCoords = useMemo(() => {
    return pins
      .map((p) => {
        const lat = parseCoord(p.shop.lat);
        const lng = parseCoord(p.shop.lng);
        if (lat == null || lng == null) return null;
        return {
          ...p,
          shop: { ...p.shop, lat, lng },
        };
      })
      .filter((p): p is NonNullable<typeof p> => p != null);
  }, [pins]);

  const center: [number, number] =
    withCoords.length > 0
      ? [withCoords[0].shop.lat!, withCoords[0].shop.lng!]
      : [42.3601, -71.0589];

  const positions = useMemo(
    () =>
      withCoords.map(
        (p) => [p.shop.lat!, p.shop.lng!] as [number, number]
      ),
    [withCoords]
  );

  const missingCount = pins.length - withCoords.length;

  const mapKey = useMemo(
    () =>
      withCoords
        .map((p) => `${p.kind}:${p.shop.id}:${p.shop.lat}:${p.shop.lng}`)
        .join("|") || "empty",
    [withCoords]
  );

  const [loadError, setLoadError] = useState<string | null>(null);
  const [rl, setRl] = useState<null | {
    MapContainer: typeof import("react-leaflet").MapContainer;
    TileLayer: typeof import("react-leaflet").TileLayer;
    CircleMarker: typeof import("react-leaflet").CircleMarker;
    Popup: typeof import("react-leaflet").Popup;
    useMap: typeof import("react-leaflet").useMap;
  }>(null);

  useEffect(() => {
    let alive = true;
    const slowTimer = setTimeout(() => {
      if (!alive) return;
      setLoadError("Map is taking a while to load. Try refreshing the page.");
    }, 6000);

    (async () => {
      try {
        await import("leaflet/dist/leaflet-src.esm.js");
        const Rmod = await import("react-leaflet");

        if (!alive) return;
        clearTimeout(slowTimer);

        setRl({
          MapContainer: Rmod.MapContainer,
          TileLayer: Rmod.TileLayer,
          CircleMarker: Rmod.CircleMarker,
          Popup: Rmod.Popup,
          useMap: Rmod.useMap,
        });
      } catch (e) {
        if (!alive) return;
        clearTimeout(slowTimer);
        const msg =
          e instanceof Error
            ? `${e.name}: ${e.message}`
            : `Map failed to load: ${String(e)}`;
        console.error("Map load failed", e);
        setLoadError(msg);
      }
    })();

    return () => {
      alive = false;
      clearTimeout(slowTimer);
    };
  }, []);

  return (
    <div className="space-y-3">
      {geocoding && (
        <p className="rounded-xl border border-cream-dark bg-white px-3 py-2 text-sm text-latte">
          Placing {totalShops} shop{totalShops === 1 ? "" : "s"} on the map…
        </p>
      )}

      {missingCount > 0 && !geocoding && (
        <p className="rounded-xl border border-dashed border-cream-dark bg-white px-3 py-2 text-sm text-latte">
          {missingCount} shop{missingCount === 1 ? "" : "s"} could not be placed
          on the map (no address found). Try re-adding from search.
        </p>
      )}

      {withCoords.length === 0 && pins.length > 0 && !geocoding && (
        <p className="rounded-xl border border-dashed border-cream-dark bg-white px-3 py-2 text-sm text-latte">
          No locations yet — add shops from search so we can pin them on the
          map.
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-cream-dark bg-white">
        {loadError ? (
          <div className="p-4 text-sm text-latte">{loadError}</div>
        ) : null}
        {!rl ? (
          <div className="h-[520px] animate-pulse bg-cream-dark" />
        ) : (
          <rl.MapContainer
            key={mapKey}
            center={center}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: 520, width: "100%" }}
          >
            <rl.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FitBounds positions={positions} useMap={rl.useMap} />

            {withCoords.map((p) => (
              <rl.CircleMarker
                key={`${p.kind}:${p.shop.id}`}
                center={[p.shop.lat!, p.shop.lng!]}
                radius={10}
                pathOptions={{
                  color: "#2c1810",
                  weight: 2,
                  fillColor:
                    p.kind === "beenTo" ? BEEN_TO_COLOR : WANT_TO_TRY_COLOR,
                  fillOpacity: 1,
                }}
              >
                <rl.Popup>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold tracking-wide">
                      {p.label}
                    </div>
                    <div className="font-medium">{p.shop.name}</div>
                    <div className="text-xs opacity-80">
                      {[p.shop.address, p.shop.city]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    <Link
                      href={`/shop/${p.shop.id}`}
                      className="text-xs underline"
                    >
                      Open shop →
                    </Link>
                  </div>
                </rl.Popup>
              </rl.CircleMarker>
            ))}
          </rl.MapContainer>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-latte">
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-3.5 w-3.5 rounded-full border border-espresso/80"
            style={{ background: BEEN_TO_COLOR }}
          />
          Been to ({beenTo.filter((r) => parseCoord(r.shop.lat) != null).length}
          /{beenTo.length})
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-3.5 w-3.5 rounded-full border border-espresso/80"
            style={{ background: WANT_TO_TRY_COLOR }}
          />
          Want to try (
          {wantToTry.filter((w) => parseCoord(w.shop.lat) != null).length}/
          {wantToTry.length})
        </span>
      </div>
    </div>
  );
}
