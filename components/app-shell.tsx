import type { ReactNode } from "react";

/**
 * Anwendungsrahmen: Kopfleiste 44 px, Navigation, Inhalt. Die Seite bewegt
 * sich niemals horizontal; breite Tabellen scrollen in ihrem Container.
 */
export function AppShell({
  header,
  nav,
  children,
}: {
  readonly header: ReactNode;
  readonly nav: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-app">
      {header}
      {nav}
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-[18px] pb-[76px] md:px-6 md:pb-[32px]">
        {children}
      </main>
    </div>
  );
}

/** Seitentitel in Display-Schrift mit optionaler Aktion rechts. */
export function PageHead({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children?: ReactNode;
}) {
  return (
    <div className="mb-[18px] flex flex-wrap items-end justify-between gap-3">
      <h1 className="font-display text-title-md tracking-[-0.01em] text-ink-1">{title}</h1>
      {children}
    </div>
  );
}
