import Link from "next/link";
import type { Sentiment } from "@/db/schema";
import { SentimentCup } from "@/components/SentimentCup";
import { BeanAverageDisplay } from "@/components/CoffeeBeanIcon";

type Shop = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
};

export function ShopCard({
  shop,
  sentiment,
  ratingOutOf10,
  rank,
  subtitle,
  priceAverage,
  priceCount,
}: {
  shop: Shop;
  sentiment?: Sentiment;
  ratingOutOf10?: number | null;
  rank?: number;
  subtitle?: string;
  priceAverage?: number;
  priceCount?: number;
}) {
  const location = [shop.address, shop.city].filter(Boolean).join(" · ");
  const showPriceRow =
    priceAverage != null && priceCount != null && priceCount > 0;

  return (
    <Link
      href={`/shop/${shop.id}`}
      className="flex items-center gap-4 rounded-2xl border border-cream-dark bg-white p-4 transition hover:border-latte/40 hover:shadow-sm"
    >
      {rank != null && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-dark text-sm font-semibold text-mocha">
          {rank}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-medium text-espresso">{shop.name}</h3>
          {sentiment && <SentimentCup sentiment={sentiment} showLabel />}
        </div>
        {(location || subtitle) && (
          <p className="mt-0.5 truncate text-sm text-latte">
            {subtitle ?? location}
          </p>
        )}
        {showPriceRow && (
          <div className="mt-1.5">
            <BeanAverageDisplay
              average={priceAverage}
              count={priceCount}
            />
          </div>
        )}
      </div>
      {ratingOutOf10 != null && (
        <span className="shrink-0 rounded-full bg-mocha/10 px-3 py-1 text-sm font-semibold tabular-nums text-mocha">
          {ratingOutOf10}/10
        </span>
      )}
      <span className="text-latte-light">→</span>
    </Link>
  );
}
