import Link from "next/link";
import { Suspense } from "react";
import { SearchBox } from "@/components/SearchBox";
import { SearchResults } from "@/components/SearchResults";
import { AddShopForm } from "@/components/AddShopForm";
import { CafeLogo } from "@/components/CafeLogo";
import { getCurrentUser } from "@/lib/session";
import { getUserRankings } from "@/lib/shops";
import { getWantToTryList } from "@/lib/wantToTry";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const user = await getCurrentUser();
  const rankings = user ? await getUserRankings(user.id) : [];
  const wantToTryCount = user ? (await getWantToTryList(user.id)).length : 0;
  const beenToCount = rankings.length;

  return (
    <div className="space-y-8">
      <section className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
        <Link
          href="/"
          aria-label="Clear search and show been-to list"
          className="shrink-0 transition hover:opacity-90"
        >
          <CafeLogo hero className="sm:items-center" />
        </Link>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-caramel">
            Cafe Connect
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-espresso sm:text-3xl">
            Find your next cup
          </h1>
          <p className="text-sm text-latte sm:text-base">
            Search Boston coffee shops — save to want to try, or rank on your
            been-to list.
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="h-12 rounded-xl bg-cream-dark animate-pulse" />}>
        <SearchBox defaultQuery={query} />
      </Suspense>

      <AddShopForm />

      {query ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-latte">
            Boston coffee shops matching &ldquo;{query}&rdquo;
          </h2>
          <SearchResults query={query} />
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-latte">
            Lists
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/been-to"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-cream-dark bg-white p-4 transition hover:border-latte/40 hover:bg-cream-dark hover:shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-caramel"
                    aria-hidden
                  >
                    <path
                      d="M6.5 3.75h7A1.75 1.75 0 0 1 15.25 5.5v11l-4.6-3.05a1.25 1.25 0 0 0-1.4 0L4.75 16.5v-11A1.75 1.75 0 0 1 6.5 3.75z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-sm font-medium uppercase tracking-wide text-espresso">
                    Been to
                  </p>
                </div>
                <p className="mt-0.5 text-sm text-latte">
                  Ranked list ({beenToCount})
                </p>
              </div>
              <span className="shrink-0 text-latte-light transition group-hover:translate-x-0.5">
                →
              </span>
            </Link>

            <Link
              href="/want-to-try"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-cream-dark bg-white p-4 transition hover:border-latte/40 hover:bg-cream-dark hover:shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-caramel"
                    aria-hidden
                  >
                    <path
                      d="M6.5 3.75h7A1.75 1.75 0 0 1 15.25 5.5v11l-4.6-3.05a1.25 1.25 0 0 0-1.4 0L4.75 16.5v-11A1.75 1.75 0 0 1 6.5 3.75z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-sm font-medium uppercase tracking-wide text-espresso">
                    Want to try
                  </p>
                </div>
                <p className="mt-0.5 text-sm text-latte">
                  Saved list ({wantToTryCount})
                </p>
              </div>
              <span className="shrink-0 text-latte-light transition group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
