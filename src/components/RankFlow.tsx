"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SENTIMENT_META } from "@/lib/ranking";
import { SentimentCup } from "@/components/SentimentCup";
import { addBeenToCache, type CachedBeenToRanking } from "@/lib/beenToCache";
import { cachedShopToPlacePayload, getCachedShop } from "@/lib/shopCache";
import type { Sentiment } from "@/db/schema";

type Props = {
  shopId: string;
  shopName: string;
  rankedCount: number;
};

type Step = "sentiment" | "compare" | "refine" | "done";

type Opponent = { shopId: string; shopName: string };

const CUP_OPTIONS: { key: Sentiment; ringClass: string; bgClass: string }[] = [
  {
    key: "good",
    ringClass: "ring-emerald-500/40 hover:ring-emerald-500",
    bgClass: "bg-emerald-50",
  },
  {
    key: "okay",
    ringClass: "ring-amber-400/40 hover:ring-amber-500",
    bgClass: "bg-amber-50",
  },
  {
    key: "bad",
    ringClass: "ring-red-500/40 hover:ring-red-500",
    bgClass: "bg-red-50",
  },
];

function PreferButtons({
  leftLabel,
  rightLabel,
  loading,
  isClose,
  onPreferLeft,
  onPreferRight,
  onSkip,
}: {
  leftLabel: string;
  rightLabel: string;
  loading: boolean;
  isClose?: boolean;
  onPreferLeft: () => void;
  onPreferRight: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-espresso">Which do you prefer?</p>
      {isClose && (
        <p className="text-xs text-latte">
          These are really close — pick one if you can, or skip.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={loading}
          onClick={onPreferLeft}
          className="rounded-xl border-2 border-mocha bg-mocha/5 py-4 px-3 text-sm font-medium text-espresso transition hover:bg-mocha/10 disabled:opacity-50"
        >
          {leftLabel}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onPreferRight}
          className="rounded-xl border border-cream-dark py-4 px-3 text-sm font-medium transition hover:border-latte hover:bg-cream-dark disabled:opacity-50"
        >
          {rightLabel}
        </button>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={onSkip}
        className="w-full rounded-xl py-2.5 text-sm text-latte transition hover:bg-cream-dark hover:text-espresso disabled:opacity-50"
      >
        Too hard to compare — skip
      </button>
    </div>
  );
}

export function RankFlow({ shopId, shopName, rankedCount }: Props) {
  const router = useRouter();

  function rankBody(extra: Record<string, unknown>) {
    const cached = getCachedShop(shopId);
    return {
      ...extra,
      shopId,
      ...(cached ? { shop: cachedShopToPlacePayload(cached) } : {}),
    };
  }

  function saveRankingToCache(
    s: Sentiment,
    ranking?: CachedBeenToRanking | null
  ) {
    if (ranking) {
      addBeenToCache(ranking);
      return;
    }
    const cached = getCachedShop(shopId);
    addBeenToCache({
      id: `cache-${shopId}`,
      rankPosition: rankedCount + 1,
      sentiment: s,
      ratingOutOf10: null,
      shop: cached
        ? {
            id: cached.id,
            name: cached.name,
            address: cached.address,
            city: cached.city,
          }
        : {
            id: shopId,
            name: shopName,
            address: null,
            city: null,
          },
    });
  }
  const [step, setStep] = useState<Step>("sentiment");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(Math.max(0, rankedCount - 1));
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [opponentIsClose, setOpponentIsClose] = useState(false);
  const [refineQueue, setRefineQueue] = useState<Opponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startRank(s: Sentiment) {
    setLoading(true);
    setError(null);
    setSentiment(s);
    try {
      const res = await fetch("/api/rank/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rankBody({ sentiment: s })),
      });
      if (!res.ok) throw new Error("Failed to start");
      const data = await res.json();

      if (data.needsPlacement && rankedCount > 0) {
        setHigh(Math.max(0, rankedCount - 1));
        setLow(0);
        await fetchOpponent(0, Math.max(0, rankedCount - 1), s);
        setStep("compare");
      } else {
        saveRankingToCache(s, data.ranking);
        completeDone();
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchOpponent(
    l: number,
    h: number,
    s: Sentiment = sentiment!
  ) {
    setLoading(true);
    const res = await fetch("/api/rank/placement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rankBody({ low: l, high: h, sentiment: s })),
    });
    const data = await res.json();
    setLoading(false);

    if (data.done) {
      await finish(l, s);
      return;
    }
    setOpponent({
      shopId: data.opponent.shopId,
      shopName: data.opponent.shopName,
    });
    setOpponentIsClose(!!data.opponent.isClose);
  }

  async function finish(insertIndex: number, s: Sentiment = sentiment!) {
    setLoading(true);
    const res = await fetch("/api/rank/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rankBody({ insertIndex, sentiment: s })),
    });
    const data = await res.json();
    setLoading(false);

    const queue: Opponent[] = data.refineComparisons ?? [];
    if (queue.length > 0) {
      setRefineQueue(queue);
      setStep("refine");
    } else {
      saveRankingToCache(s, data.ranking);
      completeDone();
    }
  }

  function completeDone() {
    setStep("done");
    router.refresh();
  }

  async function submitCompare(
    opponentId: string,
    choice: "new" | "opponent" | "skip"
  ) {
    if (!sentiment) return;
    setLoading(true);
    await fetch("/api/rank/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        rankBody({ opponentShopId: opponentId, choice, sentiment })
      ),
    });
    setLoading(false);
  }

  async function preferNew() {
    const mid = Math.floor((low + high) / 2);
    const newLow = mid + 1;
    if (newLow > high) {
      await finish(newLow);
    } else {
      setLow(newLow);
      await fetchOpponent(newLow, high);
    }
  }

  async function preferOpponent() {
    const mid = Math.floor((low + high) / 2);
    const newHigh = mid - 1;
    if (low > newHigh) {
      await finish(mid);
    } else {
      setHigh(newHigh);
      await fetchOpponent(low, newHigh);
    }
  }

  async function skipPlacement() {
    const insertIndex = Math.floor((low + high) / 2);
    await finish(insertIndex);
  }

  function advanceRefine() {
    const next = refineQueue.slice(1);
    setRefineQueue(next);
    if (next.length === 0) completeDone();
  }

  async function preferNewInRefine(opponentId: string) {
    await submitCompare(opponentId, "new");
    advanceRefine();
  }

  async function preferOpponentInRefine(opponentId: string) {
    await submitCompare(opponentId, "opponent");
    advanceRefine();
  }

  async function skipRefine(opponentId: string) {
    await submitCompare(opponentId, "skip");
    advanceRefine();
  }

  if (step === "done") {
    return (
      <p className="rounded-2xl border border-caramel/40 bg-caramel/10 px-4 py-3 text-sm text-mocha">
        Added to your been-to list.
      </p>
    );
  }

  if (step === "sentiment") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-espresso-light">Pick a cup:</p>
        <div className="grid grid-cols-3 gap-3">
          {CUP_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              disabled={loading}
              onClick={() => startRank(opt.key)}
              className={`flex flex-col items-center gap-2 rounded-2xl border border-transparent bg-white py-5 ring-2 transition disabled:opacity-50 ${opt.ringClass} ${opt.bgClass}`}
            >
              <SentimentCup sentiment={opt.key} size="lg" />
              <span className="text-xs font-medium text-espresso">
                {SENTIMENT_META[opt.key].label}
              </span>
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  if (step === "refine" && refineQueue[0]) {
    const current = refineQueue[0];
    return (
      <div className="space-y-4 rounded-2xl border border-cream-dark bg-white p-4">
        <p className="text-xs text-latte">
          Optional — help place it among similar spots ({refineQueue.length} left)
        </p>
        <PreferButtons
          leftLabel={shopName}
          rightLabel={current.shopName}
          loading={loading}
          isClose
          onPreferLeft={() => preferNewInRefine(current.shopId)}
          onPreferRight={() => preferOpponentInRefine(current.shopId)}
          onSkip={() => skipRefine(current.shopId)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-cream-dark bg-white p-4">
      <PreferButtons
        leftLabel={shopName}
        rightLabel={opponent?.shopName ?? "..."}
        loading={loading}
        isClose={opponentIsClose}
        onPreferLeft={preferNew}
        onPreferRight={preferOpponent}
        onSkip={skipPlacement}
      />
      {loading && (
        <p className="text-center text-xs text-latte">Updating your list...</p>
      )}
    </div>
  );
}
