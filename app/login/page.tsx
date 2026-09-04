import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { getActor } from "@/lib/actor";
import { parseTheme } from "@/lib/theme";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };
export const dynamic = "force-dynamic";

function safeNext(value: string | undefined): string {
  return value !== undefined && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly next?: string }>;
}) {
  if ((await getActor()) !== null) redirect("/");
  const theme = parseTheme((await cookies()).get("theme")?.value);
  const next = safeNext((await searchParams).next);

  return (
    <div className="flex min-h-dvh flex-col bg-desk">
      <header className="flex h-[44px] items-center justify-between border-b border-line bg-bar px-4">
        <span className="flex items-center gap-[9px] text-ink-1">
          <BrandMark />
          <span className="font-display text-ui tracking-[-0.01em]">Zeiterfassung</span>
        </span>
        <ThemeToggle initial={theme} />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-[32px] sm:items-center">
        <div className="w-full max-w-[380px] border border-line bg-panel">
          <div className="border-b border-line-soft px-[22px] py-[18px]">
            <h1 className="font-display text-title-md tracking-[-0.01em] text-ink-1">Anmelden</h1>
            <p className="mt-1 text-meta text-ink-3">
              Konten legt die Verwaltung an. Es gibt keine Registrierung.
            </p>
          </div>
          <div className="px-[22px] py-[18px]">
            <LoginForm next={next} />
          </div>
        </div>
      </main>
    </div>
  );
}
