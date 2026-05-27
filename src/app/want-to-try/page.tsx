import Link from "next/link";
import { WantToTryListWithCache } from "@/components/WantToTryListWithCache";
import { ensureUserInDb } from "@/lib/session";
import { addToWantToTry, getWantToTryList } from "@/lib/wantToTry";
import { upsertShopById } from "@/lib/shops";
import {
  cachedShopToPlacePayload,
  shopFromSearchParams,
} from "@/lib/shopCache";

export default async function WantToTryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await ensureUserInDb();
  const sp = await searchParams;
  const addId = typeof sp.add === "string" ? sp.add : undefined;

  if (user && addId) {
    const fromQuery = shopFromSearchParams(addId, sp);
    if (fromQuery) {
      await upsertShopById(addId, cachedShopToPlacePayload(fromQuery));
      try {
        await addToWantToTry(user.id, addId);
      } catch {
        // e.g. already on been-to list — still show on want-to-try via client cache
      }
    }
  }

  const entries = user ? await getWantToTryList(user.id) : [];

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold uppercase tracking-wide text-espresso">
          Want to try
        </h1>
        <p className="text-sm text-latte">
          Coffee shops you&apos;re planning to visit.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-latte">
            Saved ({entries.length})
          </h2>
          <Link
            href="/"
            className="text-sm font-medium text-mocha transition hover:text-espresso-light"
          >
            Find shops →
          </Link>
        </div>
        <WantToTryListWithCache serverEntries={entries} />
      </section>
    </div>
  );
}
