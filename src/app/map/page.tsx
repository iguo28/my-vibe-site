import { getCurrentUser } from "@/lib/session";
import { getUserRankings } from "@/lib/shops";
import { getWantToTryList } from "@/lib/wantToTry";
import { MapView } from "@/components/MapView";

export default async function MapPage() {
  const user = await getCurrentUser();
  const beenTo = user ? await getUserRankings(user.id) : [];
  const wantToTry = user ? await getWantToTryList(user.id) : [];

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold uppercase tracking-wide text-espresso">
          Map
        </h1>
        <p className="text-sm text-latte">
          See the shops you&apos;ve been to and want to try.
        </p>
      </section>

      <MapView beenTo={beenTo} wantToTry={wantToTry} />
    </div>
  );
}

