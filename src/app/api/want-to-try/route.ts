import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/session";
import { findOrCreateShopFromPlace } from "@/lib/shops";
import { addToWantToTry, removeFromWantToTry } from "@/lib/wantToTry";

export async function POST(req: Request) {
  const user = await ensureUser();
  const body = await req.json();

  let shopId = body.shopId as string | undefined;

  let shop = null as Awaited<ReturnType<typeof findOrCreateShopFromPlace>> | null;

  if (!shopId && body.externalPlaceId && body.name) {
    shop = await findOrCreateShopFromPlace({
      externalPlaceId: String(body.externalPlaceId).trim(),
      name: String(body.name).trim(),
      address: body.address ?? null,
      city: body.city ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
    });
    shopId = shop.id;
  }

  if (!shopId?.trim()) {
    return NextResponse.json({ error: "shopId required" }, { status: 400 });
  }

  if (!shop) {
    const { getShop } = await import("@/lib/shops");
    shop = await getShop(shopId.trim());
  }

  try {
    await addToWantToTry(user.id, shopId.trim());
    return NextResponse.json({
      ok: true,
      shopId: shopId.trim(),
      shop,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const user = await ensureUser();
  const body = await req.json();
  const shopId = body.shopId?.trim();

  if (!shopId) {
    return NextResponse.json({ error: "shopId required" }, { status: 400 });
  }

  await removeFromWantToTry(user.id, shopId);
  return NextResponse.json({ ok: true });
}
