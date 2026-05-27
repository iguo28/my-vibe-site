import type { Sentiment } from "@/db/schema";

export const SENTIMENT_META: Record<
  Sentiment,
  { label: string; shortLabel: string; cupClass: string }
> = {
  good: {
    label: "I liked it",
    shortLabel: "Liked",
    cupClass: "text-emerald-600",
  },
  okay: {
    label: "It was fine",
    shortLabel: "Fine",
    cupClass: "text-amber-500",
  },
  bad: {
    label: "I didn't like it",
    shortLabel: "Didn't like",
    cupClass: "text-red-600",
  },
};

const RATING_BANDS: Record<Sentiment, [number, number]> = {
  good: [7, 10],
  okay: [4, 6],
  bad: [1, 3],
};

/** Rating 1–10 from cup color and position on the been-to list (1 = top). */
export function computeRatingOutOf10(
  sentiment: Sentiment,
  rankPosition: number,
  total: number
): number {
  const [min, max] = RATING_BANDS[sentiment];
  if (total <= 1) {
    return Math.round(((min + max) / 2) * 10) / 10;
  }
  const t = (total - rankPosition) / (total - 1);
  const rating = min + t * (max - min);
  return Math.round(rating * 10) / 10;
}

const K = 32;
const BASE = 1500;

/** Elo gap below which two shops are considered too close to rank confidently */
export const CLOSE_SCORE_THRESHOLD = 60;

export function scoresAreClose(scoreA: number, scoreB: number): boolean {
  return Math.abs(scoreA - scoreB) <= CLOSE_SCORE_THRESHOLD;
}

/** Elo expected score for player A vs B */
function expected(scoreA: number, scoreB: number): number {
  return 1 / (1 + Math.pow(10, (scoreB - scoreA) / 400));
}

export function updateElo(
  winnerScore: number,
  loserScore: number,
  weight = 1
): { winner: number; loser: number } {
  const eWin = expected(winnerScore, loserScore);
  const eLose = expected(loserScore, winnerScore);
  return {
    winner: winnerScore + K * weight * (1 - eWin),
    loser: loserScore + K * weight * (0 - eLose),
  };
}

/** Sentiment adjusts how strongly a comparison counts */
export function sentimentWeight(sentiment: Sentiment): number {
  switch (sentiment) {
    case "good":
      return 1.2;
    case "okay":
      return 1;
    case "bad":
      return 0.8;
  }
}

/** Initial score seed from sentiment before pairwise placement */
export function initialScoreFromSentiment(sentiment: Sentiment): number {
  switch (sentiment) {
    case "good":
      return BASE + 80;
    case "okay":
      return BASE;
    case "bad":
      return BASE - 80;
  }
}

export function sortByScore<T extends { score: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.score - a.score);
}

export function assignRankPositions<T extends { score: number }>(
  items: T[]
): (T & { rankPosition: number })[] {
  const sorted = sortByScore(items);
  return sorted.map((item, i) => ({ ...item, rankPosition: i + 1 }));
}

export function id(): string {
  return crypto.randomUUID();
}
