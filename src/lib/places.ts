export type WorldPlace = {
  externalPlaceId: string;
  name: string;
  address: string | null;
  city: string | null;
  subtitle: string;
  lat: number | null;
  lng: number | null;
};

/** Greater Boston — Nominatim viewbox bias: left, top, right, bottom */
const BOSTON_VIEWBOX = "-71.35,42.45,-70.85,42.20";

const BOSTON_METRO =
  /boston|cambridge|somerville|brookline|allston|brighton|charlestown|dorchester|fenway|jamaica plain|back bay|south end|beacon hill|north end|roslindale|hyde park|mattapan|quincy|newton|medford|malden|everett|chelsea|revere|watertown|arlington|belmont|waltham|dedham|needham/i;

type NominatimResult = {
  place_id: number;
  name?: string;
  display_name: string;
  lat?: string;
  lon?: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

function formatAddress(addr: NominatimResult["address"]): {
  line: string | null;
  city: string | null;
  subtitle: string;
} {
  if (!addr) {
    return { line: null, city: null, subtitle: "" };
  }

  const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
  const city =
    addr.city ?? addr.town ?? addr.village ?? addr.state ?? null;
  const country = addr.country ?? "";
  const line = street || null;
  const subtitle = [city, country].filter(Boolean).join(", ");

  return { line, city, subtitle };
}

function isInBostonArea(item: NominatimResult): boolean {
  const display = item.display_name.toLowerCase();
  const inMA =
    display.includes("massachusetts") || /,\s*ma[, ]/.test(display);
  if (!inMA) return false;
  return BOSTON_METRO.test(display);
}

function relevanceScore(
  name: string,
  query: string,
  tokens: string[]
): number {
  const n = name.toLowerCase();
  const q = query.toLowerCase();
  if (n === q) return 100;
  if (n.includes(q) || q.includes(n)) return 85;
  const matched = tokens.filter((t) => n.includes(t)).length;
  if (matched === 0) return 0;
  if (matched === tokens.length) return 70;
  return matched * 15;
}

function searchTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(
      (t) =>
        t.length > 1 &&
        !/^(boston|cambridge|somerville|ma|massachusetts)$/i.test(t)
    );
}

/** Search coffee shops in the Boston area via OpenStreetMap (Nominatim). */
export async function searchBostonCoffeeShops(
  query: string
): Promise<WorldPlace[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const searchQ = /boston|cambridge|somerville/i.test(trimmed)
    ? trimmed
    : `${trimmed}, Boston, Massachusetts`;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", searchQ);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "25");
  url.searchParams.set("viewbox", BOSTON_VIEWBOX);
  url.searchParams.set("countrycodes", "us");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "CafeConnect/1.0 (coffee shop discovery app)",
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Place search timed out");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error("Place search unavailable");
  }

  const data = (await res.json()) as NominatimResult[];
  const tokens = searchTokens(trimmed);

  const places = data
    .filter(isInBostonArea)
    .map((item) => {
      const { line, city, subtitle } = formatAddress(item.address);
      const name =
        item.name?.trim() ||
        item.display_name.split(",")[0]?.trim() ||
        "Coffee shop";

      const lat =
        item.lat != null && Number.isFinite(Number(item.lat))
          ? Number(item.lat)
          : null;
      const lng =
        item.lon != null && Number.isFinite(Number(item.lon))
          ? Number(item.lon)
          : null;

      return {
        externalPlaceId: String(item.place_id),
        name,
        address: line,
        city,
        subtitle: subtitle || item.display_name,
        lat,
        lng,
        _score: relevanceScore(name, trimmed, tokens),
      };
    })
    .sort((a, b) => b._score - a._score);

  return places.map(({ _score: _, ...place }) => place);
}
