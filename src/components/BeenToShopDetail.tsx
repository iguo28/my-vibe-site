import { SentimentCup } from "@/components/SentimentCup";
import { BeanAverageDisplay } from "@/components/CoffeeBeanIcon";
import type { Sentiment } from "@/db/schema";

export function BeenToShopDetail({
  rankPosition,
  sentiment,
  ratingOutOf10,
  priceAverage,
  priceCount,
}: {
  rankPosition: number;
  sentiment: Sentiment;
  ratingOutOf10: number | null;
  priceAverage?: number;
  priceCount?: number;
}) {
  const showPrice =
    priceAverage != null && priceCount != null && priceCount > 0;

  return (
    <div className="space-y-4 rounded-2xl border border-cream-dark bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream-dark text-lg font-semibold text-mocha">
          #{rankPosition}
        </span>
        <SentimentCup sentiment={sentiment} showLabel />
        {ratingOutOf10 != null && (
          <span className="ml-auto rounded-full bg-mocha/10 px-4 py-1.5 text-base font-semibold tabular-nums text-mocha">
            {ratingOutOf10}/10
          </span>
        )}
      </div>
      {showPrice && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-latte">
            Community price
          </p>
          <BeanAverageDisplay average={priceAverage} count={priceCount} />
        </div>
      )}
    </div>
  );
}
