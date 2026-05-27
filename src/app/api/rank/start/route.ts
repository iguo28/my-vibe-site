import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/session";
import {
  startRanking,
  getRankedShopsForPlacement,
  getRankingEntryForShop,
  syncShopFromClient,
  type ClientShopPayload,
} from "@/lib/shops";
import type { Sentiment } from "@/db/schema";

export async function POST(req: Request) {
  const user = await ensureUser();
  const { shopId, sentiment, shop } = (await req.json()) as {
    shopId: string;
    sentiment: Sentiment;
    shop?: ClientShopPayload;
  };

  if (!shopId || !["good", "okay", "bad"].includes(sentiment)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await syncShopFromClient(shopId, shop);
  await startRanking(user.id, shopId, sentiment);
  const ranked = await getRankedShopsForPlacement(user.id);
  const others = ranked.filter((r) => r.coffeeShopId !== shopId);

  const ranking = await getRankingEntryForShop(user.id, shopId);

  return NextResponse.json({
    needsPlacement: others.length > 0,
    rankedCount: others.length,
    ranking,
  });
}
