export function parseCoord(value: number | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Geocode a shop location via Nominatim (Boston-biased). */
export async function geocodeShopLocation(
  name: string,
  address?: string | null,
  city?: string | null
): Promise<{ lat: number; lng: number } | null> {
  const parts = [name, address, city].filter(Boolean);
  const q =
    parts.length > 0
      ? `${parts.join(", ")}, Boston, Massachusetts`
      : `${name}, Boston, Massachusetts`;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "CafeConnect/1.0 (coffee shop map)",
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const hit = data[0];
    if (!hit?.lat || !hit.lon) return null;

    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Nominatim usage policy: max ~1 request per second. */
export function geocodeDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1_100));
}
