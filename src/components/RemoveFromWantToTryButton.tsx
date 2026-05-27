"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveFromWantToTryButton({
  shopId,
  shopName,
}: {
  shopId: string;
  shopName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm(`Remove "${shopName}" from want to try?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/want-to-try", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId }),
      });
      if (!res.ok) throw new Error("Failed");
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
      className="shrink-0 text-xs font-medium text-latte transition hover:text-red-600/90 disabled:opacity-50"
      title="Remove from want to try"
    >
      {loading ? "…" : "Remove"}
    </button>
  );
}
