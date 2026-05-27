import { NextResponse } from "next/server";
import { geocodeShopLocation } from "@/lib/geocode";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const address = searchParams.get("address");
  const city = searchParams.get("city");

  const coords = await geocodeShopLocation(
    name,
    address || null,
    city || null
  );

  if (!coords) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(coords);
}
