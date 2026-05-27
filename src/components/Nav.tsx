import Link from "next/link";
import { CafeLogo } from "@/components/CafeLogo";

const links = [
  { href: "/been-to", label: "Been to" },
  { href: "/want-to-try", label: "Want to try" },
  { href: "/map", label: "Map" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-cream-dark bg-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-espresso"
        >
          <CafeLogo compact />
          <span>Cafe Connect</span>
        </Link>
        <nav className="flex gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium uppercase tracking-wide text-espresso-light transition hover:bg-cream-dark hover:text-espresso"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
