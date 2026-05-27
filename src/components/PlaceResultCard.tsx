"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorldPlace } from "@/lib/places";

export function PlaceResultCard({ place }: { place: WorldPlace }) {
  const router = useRouter();
  const [wantLoading, setWantLoading] = useState(false);
  const [beenLoading, setBeenLoading] = useState(false);

  async function importShop() {
    const res = await fetch("/api/shops/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(place),
    });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  }

  async function addWantToTry() {
    setWantLoading(true);
    try {
      const res = await fetch("/api/want-to-try", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(place),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed");
      }
      router.push("/want-to-try");
      router.refresh();
    } catch {
      setWantLoading(false);
    }
  }

  async function addBeenTo() {
    setBeenLoading(true);
    try {
      const shop = await importShop();
      router.push(`/shop/${shop.id}`);
    } catch {
      setBeenLoading(false);
    }
  }

  const location = [place.address, place.city].filter(Boolean).join(" · ");
  const busy = wantLoading || beenLoading;

  return (
    <div className="flex w-full items-center gap-4 rounded-2xl border border-cream-dark bg-white p-4">
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-espresso">{place.name}</h3>
        <p className="mt-0.5 truncate text-sm text-latte">
          {location || place.subtitle}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={addWantToTry}
          disabled={busy}
          className="rounded-lg border border-caramel/40 px-3 py-1.5 text-xs font-medium text-caramel transition hover:bg-caramel/10 disabled:opacity-50"
        >
          {wantLoading ? "Saving…" : "Want to try"}
        </button>
        <button
          type="button"
          onClick={addBeenTo}
          disabled={busy}
          className="rounded-lg bg-mocha px-3 py-1.5 text-xs font-medium text-cream transition hover:bg-espresso-light disabled:opacity-50"
        >
          {beenLoading ? "Opening…" : "Been to →"}
        </button>
      </div>
    </div>
  );
}
