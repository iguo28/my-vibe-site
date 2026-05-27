import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/session";
import {
  getRankingEntryForShop,
  getUserRankingForShop,
  restoreRankingFromCache,
  updateShopCriteria,
  type ClientShopPayload,
  type ShopCriteriaInput,
} from "@/lib/shops";

type CriteriaBody = {
  shopId: string;
  shop?: ClientShopPayload;
  ranking?: {
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
} & ShopCriteriaInput;

export async function POST(req: Request) {
  const user = await ensureUser();
  const body = (await req.json()) as CriteriaBody;

  const { shopId, shop, ranking, ...criteria } = body;
  if (!shopId) {
    return NextResponse.json({ error: "shopId required" }, { status: 400 });
  }

  try {
    const existing = await getUserRankingForShop(user.id, shopId);

    if (!existing) {
      if (!shop?.name || !ranking?.sentiment) {
        return NextResponse.json(
          { error: "Add this shop to your been-to list first" },
          { status: 400 }
        );
      }
      await restoreRankingFromCache(user.id, shopId, shop, {
        ...ranking,
        priceRating: criteria.priceRating,
        flavorRating: criteria.flavorRating,
        flavorNotes: criteria.flavorNotes,
        vibeRating: criteria.vibeRating,
        foodRating: criteria.foodRating,
        favoriteItems: criteria.favoriteItems,
      });
    } else {
      await updateShopCriteria(user.id, shopId, criteria);
    }

    const saved = await getRankingEntryForShop(user.id, shopId);
    return NextResponse.json({ ok: true, ranking: saved });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not save ratings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
