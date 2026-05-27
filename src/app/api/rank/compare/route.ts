import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/session";
import { recordPreference } from "@/lib/shops";
import type { Sentiment } from "@/db/schema";

export async function POST(req: Request) {
  const user = await ensureUser();
  const { shopId, opponentShopId, choice, sentiment } = (await req.json()) as {
    shopId: string;
    opponentShopId: string;
    choice: "new" | "opponent" | "skip";
    sentiment: Sentiment;
  };

  await recordPreference(
    user.id,
    shopId,
    opponentShopId,
    choice,
    sentiment
  );

  return NextResponse.json({ ok: true });
}
