"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  readonly href: string;
  readonly label: string;
  /** Kurzform für die schmale Leiste am unteren Rand. */
  readonly short?: string;
}

/**
 * Hauptnavigation. Auf breiten Fenstern eine Zeile unter der Kopfleiste, auf
 * schmalen eine feste Leiste am unteren Rand mit 52-px-Zielen.
 */
export function Nav({ items }: { readonly items: readonly NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-20 flex h-[52px] flex-none border-t border-line bg-bar md:static md:h-[38px] md:border-t-0 md:border-b md:px-4"
    >
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-w-0 flex-1 items-center justify-center px-1 text-meta tracking-[0.06em] uppercase md:flex-none md:px-4 md:tracking-[0.14em] ${
              active ? "text-ink-1 md:border-b md:border-ink-1" : "text-ink-3 hover:text-ink-1"
            }`}
          >
            <span className="truncate md:hidden">{item.short ?? item.label}</span>
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
