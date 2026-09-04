import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { AppShell } from "@/components/app-shell";
import { Nav, type NavItem } from "@/components/nav";
import { RunningBadge } from "@/components/timer";
import { requireActor } from "@/lib/actor";
import { runningEntry } from "@/lib/data/entries";
import { canManageUsers } from "@/lib/permissions";
import { ThemeToggle } from "@/components/theme-toggle";
import { parseTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { readonly children: ReactNode }) {
  const actor = await requireActor();
  const theme = parseTheme((await cookies()).get("theme")?.value);
  const running = runningEntry(actor.userId);

  const items: NavItem[] = [
    { href: "/", label: "Dashboard", short: "Start" },
    { href: "/zeiten", label: "Zeiten" },
    { href: "/projekte", label: "Projekte" },
    { href: "/auswertung", label: "Auswertung", short: "Bericht" },
    ...(canManageUsers(actor) ? [{ href: "/verwaltung", label: "Verwaltung", short: "Team" }] : []),
  ];

  return (
    <AppShell
      header={
        <AppHeader
          email={actor.email}
          name={actor.name}
          organizationName={actor.organizationName}
          theme={theme}
          trailing={running === null ? null : <RunningBadge running={running} />}
        />
      }
      nav={<Nav items={items} />}
    >
      {children}
      <div className="mt-[32px] flex items-center justify-between gap-4 border-t border-line-soft pt-[14px] text-meta text-ink-3 sm:hidden">
        <span>{actor.email}</span>
        <ThemeToggle initial={theme} />
      </div>
    </AppShell>
  );
}
