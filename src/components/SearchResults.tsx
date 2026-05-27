"use client";

import { useEffect, useState } from "react";
import { PlaceResultCard } from "@/components/PlaceResultCard";
import type { WorldPlace } from "@/lib/places";

export function SearchResults({ query }: { query: string }) {
  const [places, setPlaces] = useState<WorldPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setPlaces([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/places/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Search failed");
        }
        setPlaces(data);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Could not search right now."
        );
        setPlaces([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse rounded-2xl bg-cream-dark"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-2xl border border-dashed border-cream-dark py-12 text-center text-sm text-latte">
        {error}
      </p>
    );
  }

  if (places.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-cream-dark py-12 text-center text-sm text-latte">
        No coffee shops found in Boston. Try another name or neighborhood, or
        add one manually above.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {places.map((place) => (
        <li key={place.externalPlaceId}>
          <PlaceResultCard place={place} />
        </li>
      ))}
    </ul>
  );
}
