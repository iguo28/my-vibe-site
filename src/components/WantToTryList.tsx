import Link from "next/link";
import { RemoveFromWantToTryButton } from "@/components/RemoveFromWantToTryButton";
import { shopPath, type CachedShop } from "@/lib/shopCache";

type Entry = {
  id: string;
  shop: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
  };
};

export function WantToTryList({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cream-dark py-12 text-center">
        <p className="text-latte">Your want-to-try list is empty.</p>
        <p className="mt-2 text-sm text-latte">
          <Link
            href="/"
            className="font-medium text-mocha underline-offset-2 hover:underline"
          >
            Search
          </Link>{" "}
          for Boston coffee shops{" "}
          and add it to your{" "}
          <span className="font-medium text-mocha">want to try</span> list.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const location = [entry.shop.address, entry.shop.city]
          .filter(Boolean)
          .join(" · ");

        return (
          <li
            key={entry.id}
            className="flex items-center gap-3 rounded-2xl border border-cream-dark bg-white p-4"
          >
            <Link
              href={shopPath({
                id: entry.shop.id,
                name: entry.shop.name,
                address: entry.shop.address,
                city: entry.shop.city,
              } satisfies CachedShop)}
              className="min-w-0 flex-1 transition hover:opacity-80"
            >
              <h3 className="truncate font-medium text-espresso">
                {entry.shop.name}
              </h3>
              {location && (
                <p className="mt-0.5 truncate text-sm text-latte">{location}</p>
              )}
            </Link>
            <RemoveFromWantToTryButton
              shopId={entry.shop.id}
              shopName={entry.shop.name}
            />
            <Link
              href={shopPath({
                id: entry.shop.id,
                name: entry.shop.name,
                address: entry.shop.address,
                city: entry.shop.city,
              } satisfies CachedShop)}
              className="shrink-0 text-latte-light"
              aria-hidden
            >
              →
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
