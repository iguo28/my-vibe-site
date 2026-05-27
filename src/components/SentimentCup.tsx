"use client";

import type { Sentiment } from "@/db/schema";
import { SENTIMENT_META } from "@/lib/ranking";

export function CoffeeCupIcon({
  sentiment,
  size = "md",
  className = "",
}: {
  sentiment: Sentiment;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "sm" ? "h-6 w-6" : size === "lg" ? "h-12 w-12" : "h-8 w-8";

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} ${SENTIMENT_META[sentiment].cupClass} ${className}`}
      aria-hidden
    >
      {/* Steam */}
      <path
        d="M14 14c0-4 1.2-6.5 2.2-9.2.6-1.4 1-2.4 1-3.3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M20 14c0-5 1.4-7.8 2.4-10.5.5-1.2.9-2.2.9-3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M26 14c0-4 1.1-6.3 2-8.8.6-1.3 1-2.3 1-3.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Short mug body fill */}
      <path
        d="M9 17h22v9.5c0 2.2-1.6 4-3.6 4H12.6c-2 0-3.6-1.8-3.6-4V17z"
        fill="currentColor"
        fillOpacity="0.18"
      />

      {/* Mug outline: wide, low profile */}
      <path
        d="M9 17h22v9.5c0 2.2-1.6 4-3.6 4H12.6c-2 0-3.6-1.8-3.6-4V17z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Rim */}
      <path
        d="M8 17h24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Handle */}
      <path
        d="M31 18.5c3.2 0 5.5 2.2 5.5 5s-2.3 5-5.5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Coffee surface line */}
      <path
        d="M11 19.5h18"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export function SentimentCup({
  sentiment,
  showLabel = false,
  size = "md",
}: {
  sentiment: Sentiment;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const meta = SENTIMENT_META[sentiment];
  return (
    <span className="inline-flex items-center gap-1.5">
      <CoffeeCupIcon sentiment={sentiment} size={size} />
      {showLabel && (
        <span className={`text-xs font-medium ${meta.cupClass}`}>
          {meta.shortLabel}
        </span>
      )}
    </span>
  );
}
