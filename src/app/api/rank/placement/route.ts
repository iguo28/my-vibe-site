import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/session";
import { getPlacementOpponent } from "@/lib/shops";

export async function POST(req: Request) {
  const user = await ensureUser();
  const { shopId, low, high } = await req.json();

  if (low > high) {
    return NextResponse.json({ done: true, insertIndex: low });
  }

  const opponent = await getPlacementOpponent(user.id, shopId, low, high);
  if (!opponent) {
    return NextResponse.json({ done: true, insertIndex: 0 });
  }

  return NextResponse.json({
    done: false,
    opponent: {
      shopId: opponent.shopId,
      shopName: opponent.shopName,
      isClose: opponent.isClose ?? false,
    },
    mid: Math.floor((low + high) / 2),
  });
}
