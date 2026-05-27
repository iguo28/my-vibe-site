import Link from "next/link";
import { BeenToList } from "@/components/BeenToList";
import { getCurrentUser } from "@/lib/session";
import { getUserRankings, getAveragePriceByShops } from "@/lib/shops";

export default async function BeenToPage() {
  const user = await getCurrentUser();
  const rankings = user ? await getUserRankings(user.id) : [];
  const shopIds = rankings.map((r) => r.shop.id);
  const priceAverages = await getAveragePriceByShops(shopIds);

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold uppercase tracking-wide text-espresso">
          Been to
        </h1>
        <p className="text-sm text-latte">Your ranked list of coffee shops.</p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-latte">
            Saved ({rankings.length})
          </h2>
          <Link
            href="/"
            className="text-sm font-medium text-mocha transition hover:text-espresso-light"
          >
            Find shops →
          </Link>
        </div>
        <BeenToList rankings={rankings} priceAverages={priceAverages} />
      </section>
    </div>
  );
}

