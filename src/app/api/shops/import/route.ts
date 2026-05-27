import { NextResponse } from "next/server";
import { findOrCreateShopFromPlace } from "@/lib/shops";

export async function POST(req: Request) {
  const body = await req.json();
  const { externalPlaceId, name, address, city, lat, lng } = body as {
    externalPlaceId?: string;
    name?: string;
    address?: string | null;
    city?: string | null;
    lat?: number | null;
    lng?: number | null;
  };

  if (!externalPlaceId?.trim() || !name?.trim()) {
    return NextResponse.json({ error: "Invalid place" }, { status: 400 });
  }

  const shop = await findOrCreateShopFromPlace({
    externalPlaceId: externalPlaceId.trim(),
    name: name.trim(),
    address: address ?? null,
    city: city ?? null,
    lat: lat ?? null,
    lng: lng ?? null,
  });

  return NextResponse.json(shop);
}
