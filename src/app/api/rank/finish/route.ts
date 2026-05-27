import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/session";
import {
  finishPlacement,
  syncShopFromClient,
  type ClientShopPayload,
} from "@/lib/shops";
import type { Sentiment } from "@/db/schema";

export async function POST(req: Request) {
  const user = await ensureUser();
  const { shopId, insertIndex, sentiment, shop } = (await req.json()) as {
    shopId: string;
    insertIndex: number;
    sentiment: Sentiment;
    shop?: ClientShopPayload;
  };

  await syncShopFromClient(shopId, shop);

  const refineComparisons = await finishPlacement(
    user.id,
    shopId,
    sentiment,
    insertIndex
  );
  return NextResponse.json({
    ok: true,
    refineComparisons: refineComparisons ?? [],
  });
}
