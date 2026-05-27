"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type * as LeafletNS from "leaflet";

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

const BEEN_TO_COLOR = "#2f6f4e"; // deep green
const WANT_TO_TRY_COLOR = "#c4a574"; // caramel

export function MapView({
  beenTo,
  wantToTry,
}: {
  beenTo: BeenToEntry[];
  wantToTry: WantToTryEntry[];
}) {
  const pins: Array<{
    kind: "beenTo" | "wantToTry";
    shop: Shop;
    label: string;
  }> = [];

  for (const r of beenTo) {
    pins.push({
      kind: "beenTo",
      shop: r.shop,
      label: `BEEN TO · #${r.rankPosition}`,
    });
  }
  for (const w of wantToTry) {
    pins.push({
      kind: "wantToTry",
      shop: w.shop,
      label: "WANT TO TRY",
    });
  }

  const withCoords = useMemo(() => {
    return pins.filter(
      (p) => p.shop.lat != null && p.shop.lng != null
    ) as Array<
      (typeof pins)[number] & { shop: Shop & { lat: number; lng: number } }
    >;
  }, [pins]);

  const center: [number, number] =
    withCoords.length > 0
      ? [withCoords[0].shop.lat, withCoords[0].shop.lng]
      : [42.3601, -71.0589]; // Boston fallback

  const missingCount = pins.length - withCoords.length;

  const [leaflet, setLeaflet] = useState<typeof LeafletNS | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rl, setRl] = useState<null | {
    MapContainer: typeof import("react-leaflet").MapContainer;
    TileLayer: typeof import("react-leaflet").TileLayer;
    Marker: typeof import("react-leaflet").Marker;
    Popup: typeof import("react-leaflet").Popup;
  }>(null);

  useEffect(() => {
    let alive = true;
    const slowTimer = setTimeout(() => {
      if (!alive) return;
      setLoadError("Map is taking a while to load. Try refreshing the page.");
    }, 6000);

    (async () => {
      try {
        // Leaflet ESM build is more reliable in modern bundlers.
        const Lmod = await import("leaflet/dist/leaflet-src.esm.js");
        const Rmod = await import("react-leaflet");

        if (!alive) return;
        clearTimeout(slowTimer);

        // Handle ESM/CJS interop differences
        const L =
          (Lmod as unknown as { default?: typeof LeafletNS }).default ??
          (Lmod as unknown as typeof LeafletNS);
        setLeaflet(L);
        setRl({
          MapContainer: Rmod.MapContainer,
          TileLayer: Rmod.TileLayer,
          Marker: Rmod.Marker,
          Popup: Rmod.Popup,
        });
      } catch (e) {
        if (!alive) return;
        clearTimeout(slowTimer);
        const msg =
          e instanceof Error
            ? `${e.name}: ${e.message}`
            : `Map failed to load: ${String(e)}`;
        // Helpful for debugging in Chrome devtools
        console.error("Map load failed", e);
        setLoadError(msg);
      }
    })();

    return () => {
      alive = false;
      clearTimeout(slowTimer);
    };
  }, []);

  const pinIcon = useMemo(() => {
    if (!leaflet) return null;
    return (color: string) =>
      leaflet.divIcon({
        className: "",
        html: `<div style="
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: ${color};
          border: 2px solid rgba(44, 24, 16, 0.9);
          box-shadow: 0 6px 12px rgba(44, 24, 16, 0.18);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -8],
      });
  }, [leaflet]);

  return (
    <div className="space-y-3">
      {missingCount > 0 && (
        <p className="rounded-xl border border-dashed border-cream-dark bg-white px-3 py-2 text-sm text-latte">
          {missingCount} shop{missingCount === 1 ? "" : "s"} missing map
          location (added manually without an address).
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-cream-dark bg-white">
        {loadError ? (
          <div className="p-4 text-sm text-latte">{loadError}</div>
        ) : null}
        {!rl || !pinIcon ? (
          <div className="h-[520px] animate-pulse bg-cream-dark" />
        ) : (
          <rl.MapContainer
            center={center}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: 520, width: "100%" }}
          >
            <rl.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {withCoords.map((p) => (
              <rl.Marker
                key={`${p.kind}:${p.shop.id}`}
                position={[p.shop.lat, p.shop.lng]}
                icon={pinIcon(
                  p.kind === "beenTo" ? BEEN_TO_COLOR : WANT_TO_TRY_COLOR
                )}
              >
                <rl.Popup>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold tracking-wide">
                      {p.label}
                    </div>
                    <div className="font-medium">{p.shop.name}</div>
                    <div className="text-xs opacity-80">
                      {[p.shop.address, p.shop.city].filter(Boolean).join(" · ")}
                    </div>
                    <Link
                      href={`/shop/${p.shop.id}`}
                      className="text-xs underline"
                    >
                      Open shop →
                    </Link>
                  </div>
                </rl.Popup>
              </rl.Marker>
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
          Been to
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-3.5 w-3.5 rounded-full border border-espresso/80"
            style={{ background: WANT_TO_TRY_COLOR }}
          />
          Want to try
        </span>
      </div>
    </div>
  );
}

