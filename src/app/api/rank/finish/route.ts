import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/session";
import { finishPlacement } from "@/lib/shops";
import type { Sentiment } from "@/db/schema";

export async function POST(req: Request) {
  const user = await ensureUser();
  const { shopId, insertIndex, sentiment } = (await req.json()) as {
    shopId: string;
    insertIndex: number;
    sentiment: Sentiment;
  };

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
