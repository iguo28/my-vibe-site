import { NextResponse } from "next/server";
import { searchBostonCoffeeShops } from "@/lib/places";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const places = await searchBostonCoffeeShops(q);
    return NextResponse.json(places);
  } catch {
    return NextResponse.json(
      { error: "Search unavailable — try again in a moment." },
      { status: 503 }
    );
  }
}
