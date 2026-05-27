import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/session";
import {
  getRankingEntryForShop,
  updateShopCriteria,
  type ShopCriteriaInput,
} from "@/lib/shops";

export async function POST(req: Request) {
  const user = await ensureUser();
  const body = (await req.json()) as { shopId: string } & ShopCriteriaInput;

  const { shopId, ...criteria } = body;
  if (!shopId) {
    return NextResponse.json({ error: "shopId required" }, { status: 400 });
  }

  try {
    const row = await updateShopCriteria(user.id, shopId, criteria);
    const ranking = await getRankingEntryForShop(user.id, shopId);
    return NextResponse.json({ ok: true, ranking, row });
  } catch {
    return NextResponse.json(
      { error: "Add this shop to your been-to list first" },
      { status: 400 }
    );
  }
}
