import { NextResponse } from "next/server";
import { createShop } from "@/lib/shops";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const shop = await createShop({
    name: body.name,
    address: body.address,
    city: body.city,
  });
  return NextResponse.json(shop);
}
