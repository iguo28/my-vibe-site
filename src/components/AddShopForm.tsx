"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cacheShop, shopPath, toCachedShop } from "@/lib/shopCache";

export function AddShopForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/shops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        address: fd.get("address"),
        city: fd.get("city"),
      }),
    });
    setLoading(false);
    if (res.ok) {
      const shop = await res.json();
      const cached = toCachedShop(shop);
      cacheShop(cached);
      router.push(shopPath(cached));
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-mt-1 text-sm font-medium text-latte underline-offset-2 hover:text-mocha hover:underline"
      >
        + Add a coffee shop
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-dashed border-latte/50 bg-white p-4"
    >
      <input
        name="name"
        required
        placeholder="Shop name"
        className="w-full rounded-xl border border-cream-dark px-3 py-2 text-sm focus:border-latte focus:outline-none"
      />
      <input
        name="address"
        placeholder="Address (optional)"
        className="w-full rounded-xl border border-cream-dark px-3 py-2 text-sm focus:border-latte focus:outline-none"
      />
      <input
        name="city"
        placeholder="City (optional)"
        className="w-full rounded-xl border border-cream-dark px-3 py-2 text-sm focus:border-latte focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-mocha px-4 py-2 text-sm font-medium text-cream disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add shop"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl px-4 py-2 text-sm text-latte hover:text-espresso"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
