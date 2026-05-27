"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function SearchBox({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultQuery);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Boston coffee shops…"
        className="flex-1 rounded-xl border border-cream-dark bg-white px-4 py-3 text-espresso placeholder:text-latte-light/70 focus:border-latte focus:outline-none focus:ring-2 focus:ring-latte/20"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-mocha px-5 py-3 text-sm font-medium text-cream transition hover:bg-espresso-light disabled:opacity-60"
      >
        Search
      </button>
    </form>
  );
}
