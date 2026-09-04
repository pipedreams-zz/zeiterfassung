import type { ReactNode } from "react";

/**
 * Leer-, Lade- und Fehlerzustand an einer Stelle. Kein Zustand wird allein
 * über Farbe vermittelt: Fehler tragen die Glyphe ▲ und ihren Text (D-09).
 */
export function LoadingState({ children }: { readonly children: ReactNode }) {
  return (
    <p className="px-4 py-6 text-ui text-ink-2" role="status" aria-live="polite">
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  children,
}: {
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-line-dashed bg-select px-6 py-8">
      <p className="font-display text-title-sm tracking-[-0.01em] text-ink-1">{title}</p>
      {children === undefined ? null : <div className="mt-2 text-body text-ink-2">{children}</div>}
    </div>
  );
}

export function ErrorState({ message }: { readonly message: string }) {
  return (
    <p
      className="hatch-attention flex gap-2 border border-attention px-4 py-3 text-ui text-attention"
      role="alert"
    >
      <span aria-hidden="true">▲</span>
      <span>{message}</span>
    </p>
  );
}
