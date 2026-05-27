import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/session";
import {
  recordPreference,
  syncShopFromClient,
  type ClientShopPayload,
} from "@/lib/shops";
import type { Sentiment } from "@/db/schema";

export async function POST(req: Request) {
  const user = await ensureUser();
  const { shopId, opponentShopId, choice, sentiment, shop } =
    (await req.json()) as {
      shopId: string;
      opponentShopId: string;
      choice: "new" | "opponent" | "skip";
      sentiment: Sentiment;
      shop?: ClientShopPayload;
    };

  await syncShopFromClient(shopId, shop);

  await recordPreference(
    user.id,
    shopId,
    opponentShopId,
    choice,
    sentiment
  );

  return NextResponse.json({ ok: true });
}
