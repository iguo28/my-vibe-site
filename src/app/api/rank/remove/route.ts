import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/session";
import { removeUserRanking } from "@/lib/shops";

export async function POST(req: Request) {
  const user = await ensureUser();
  const body = (await req.json()) as { shopId?: string };
  const shopId = body.shopId?.trim();

  if (!shopId) {
    return NextResponse.json({ error: "shopId required" }, { status: 400 });
  }

  try {
    await removeUserRanking(user.id, shopId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Shop not on your been-to list" },
      { status: 400 }
    );
  }
}
