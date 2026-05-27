"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveFromBeenToButton({
  shopId,
  shopName,
}: {
  shopId: string;
  shopName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (
      !confirm(
        `Remove "${shopName}" from your been-to list? Your ratings for this shop will be deleted.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/rank/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId }),
      });
      if (!res.ok) throw new Error("Failed");
      router.push("/");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600/90 transition hover:text-red-700 disabled:opacity-50"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-3.5 w-3.5 shrink-0"
        aria-hidden
      >
        <path
          d="M4.5 6h11M7 6V4.75A1.25 1.25 0 0 1 8.25 3.5h3.5A1.25 1.25 0 0 1 13 4.75V6m-7.75 0v8.75A1.25 1.25 0 0 0 6.5 16.5h7a1.25 1.25 0 0 0 1.25-1.25V6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.25 8.5v5M11.75 8.5v5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      {loading ? "Removing…" : "Remove from been-to list"}
    </button>
  );
}
