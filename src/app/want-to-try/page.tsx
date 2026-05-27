import Link from "next/link";
import { WantToTryList } from "@/components/WantToTryList";
import { getCurrentUser } from "@/lib/session";
import { getWantToTryList } from "@/lib/wantToTry";

export default async function WantToTryPage() {
  const user = await getCurrentUser();
  const entries = user ? await getWantToTryList(user.id) : [];

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold uppercase tracking-wide text-espresso">
          Want to try
        </h1>
        <p className="text-sm text-latte">
          Coffee shops you&apos;re planning to visit.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-latte">
            Saved ({entries.length})
          </h2>
          <Link
            href="/"
            className="text-sm font-medium text-mocha transition hover:text-espresso-light"
          >
            Find shops →
          </Link>
        </div>
        <WantToTryList entries={entries} />
      </section>
    </div>
  );
}
