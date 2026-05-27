"use client";

import Link from "next/link";
import { RemoveFromWantToTryButton } from "@/components/RemoveFromWantToTryButton";

/** Shop detail when the user has only saved this place on want-to-try (no been-to ranking). */
export function ShopWantToTryView({
  shopId,
  shopName,
}: {
  shopId: string;
  shopName: string;
}) {
  return (
    <section className="space-y-4">
      <p className="rounded-2xl border border-caramel/40 bg-caramel/10 px-4 py-3 text-sm text-mocha">
        On your want-to-try list.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <RemoveFromWantToTryButton shopId={shopId} shopName={shopName} />
        <Link
          href={`/shop/${shopId}?been=1`}
          className="text-sm font-medium text-mocha transition hover:text-espresso-light"
        >
          Been here → add to been-to list
        </Link>
      </div>
    </section>
  );
}
