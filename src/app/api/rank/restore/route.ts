import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/session";
import {
  restoreRankingFromCache,
  type ClientShopPayload,
} from "@/lib/shops";

export async function POST(req: Request) {
  const user = await ensureUser();
  const body = await req.json();
  const shopId = body.shopId?.trim();
  const shop = body.shop as ClientShopPayload | undefined;
  const ranking = body.ranking as {
    sentiment: string;
    rankPosition: number;
    ratingOutOf10?: number | null;
    priceRating?: number | null;
    flavorRating?: number | null;
    flavorNotes?: string | null;
    vibeRating?: number | null;
    foodRating?: number | null;
    favoriteItems?: string | null;
  };

  if (!shopId || !shop?.name || !ranking?.sentiment) {
    return NextResponse.json({ error: "Invalid restore payload" }, { status: 400 });
  }

  try {
    const restored = await restoreRankingFromCache(
      user.id,
      shopId,
      shop,
      ranking
    );
    return NextResponse.json({ ok: true, ranking: restored });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not restore";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
