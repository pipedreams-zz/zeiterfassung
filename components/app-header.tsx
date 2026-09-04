import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "./brand-mark";
import { SignOutButton } from "./sign-out-button";
import { ThemeToggle, type ThemeChoice } from "./theme-toggle";

export interface AppHeaderProps {
  readonly email: string;
  readonly name: string;
  readonly organizationName: string;
  readonly theme: ThemeChoice;
  /** Zustandsanzeige rechts, etwa die laufende Stoppuhr. */
  readonly trailing?: ReactNode;
}

function initials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const fromName =
    parts.length >= 2
      ? `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`
      : (parts[0]?.slice(0, 2) ?? "");
  const local = email.split("@")[0] ?? "";
  const letters = fromName || local.replace(/[^\p{L}]/gu, "").slice(0, 2);
  return (letters || "··").toUpperCase();
}

/** Kopfleiste, 44 px, über allen Ansichten identisch. */
export function AppHeader({ email, name, organizationName, theme, trailing }: AppHeaderProps) {
  return (
    <header className="flex h-[44px] flex-none items-center justify-between gap-4 border-b border-line bg-bar px-4">
      <div className="flex min-w-0 items-center gap-4">
        <Link className="flex items-center gap-[9px] text-ink-1" href="/">
          <BrandMark />
          <span className="font-display text-ui tracking-[-0.01em]">Zeiterfassung</span>
        </Link>
        <span aria-hidden="true" className="hidden h-[18px] w-px flex-none bg-line sm:block" />
        <span className="hidden truncate text-ui text-ink-2 sm:block">{organizationName}</span>
      </div>

      <div className="flex min-w-0 flex-none items-center gap-[14px]">
        {trailing}
        <span className="hidden text-meta text-ink-3 lg:block">{email}</span>
        <span
          aria-hidden="true"
          className="flex h-6 w-6 flex-none items-center justify-center border border-line-frame text-meta text-ink-1"
        >
          {initials(name, email)}
        </span>
        <div className="hidden sm:block">
          <ThemeToggle initial={theme} />
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
