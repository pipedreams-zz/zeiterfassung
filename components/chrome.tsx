import type { ReactNode } from "react";

/**
 * Die wiederkehrenden Bausteine der Oberfläche: Label, Panelkopf,
 * Panelabschnitt, Chip und die Schaltflächenformen. Sie stehen an einer
 * Stelle, damit Maße, Schriftgrade und Kanten nicht in jeder Ansicht neu —
 * und unmerklich anders — entstehen.
 */

/** 12 px, Großbuchstaben, Laufweite 0.14em. Die Beschriftung eines Bereichs. */
export function Label({ children }: { readonly children: ReactNode }) {
  return <span className="text-meta tracking-[0.14em] text-ink-3 uppercase">{children}</span>;
}

/** Kopfzeile eines Bereichs: feste 38 px, Titel links, Aktionen rechts. */
export function PanelHead({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children?: ReactNode;
}) {
  return (
    <div className="flex h-[38px] flex-none items-center justify-between gap-3 border-b border-line-soft px-4">
      <span className="truncate text-meta tracking-[0.14em] text-ink-2 uppercase">{title}</span>
      {children}
    </div>
  );
}

/** Abschnitt innerhalb eines Bereichs, getrennt durch eine Haarlinie. */
export function PanelSection({
  label,
  ariaLabel,
  children,
  grow = false,
}: {
  readonly label?: ReactNode;
  readonly ariaLabel?: string;
  readonly children: ReactNode;
  readonly grow?: boolean;
}) {
  return (
    <section
      {...(ariaLabel === undefined ? {} : { "aria-label": ariaLabel })}
      className={`flex flex-col gap-[11px] border-b border-line-soft px-4 py-[14px] ${
        grow ? "min-h-0 flex-1 overflow-y-auto" : "flex-none"
      }`}
    >
      {label === undefined ? null : <Label>{label}</Label>}
      {children}
    </section>
  );
}

/** Ein Panel: Fläche mit 1-px-Kante, kein Radius, kein Schatten. */
export function Panel({
  children,
  className = "",
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <div className={`flex flex-col border border-line bg-panel ${className}`}>{children}</div>;
}

/** Rechtezustand, Rolle, Herkunft: kleiner Rahmen ohne Fläche. */
export function Chip({
  children,
  tone = "normal",
}: {
  readonly children: ReactNode;
  readonly tone?: "normal" | "attention" | "empty" | "selected";
}) {
  const style =
    tone === "attention"
      ? "border-attention text-attention"
      : tone === "empty"
        ? "border-dashed border-line-strong text-ink-3"
        : tone === "selected"
          ? "border-ink-1 bg-chip text-ink-1"
          : "border-line-frame text-ink-2";

  return (
    <span className={`border px-[7px] py-[2px] text-meta whitespace-nowrap ${style}`}>
      {children}
    </span>
  );
}

/**
 * Vier Größenklassen für Bedienelemente:
 *
 * | Klasse             | Mindesthöhe |
 * |--------------------|-------------|
 * | `PRIMARY_ACTION`   | 44 px       |
 * | `SECONDARY_ACTION` | 36 px       |
 * | `COMPACT_ACTION`   | 24 px       |
 * | `TEXT_LINK`        | keine       |
 */

/** Primäre Aktion: die einzige Schaltfläche mit Fläche. */
export const PRIMARY_ACTION =
  "flex min-h-[44px] items-center justify-center gap-2 bg-accent px-[22px] " +
  "text-ui tracking-[0.1em] text-on-accent uppercase disabled:bg-raised disabled:text-ink-off";

/** Sekundäre Aktion: eine Kante statt einer Fläche. */
export const SECONDARY_ACTION =
  "flex min-h-[36px] items-center justify-center gap-[6px] border border-line-strong px-[9px] " +
  "text-ui-sm tracking-[0.04em] text-ink-1 uppercase hover:border-line-frame disabled:text-ink-off";

/** Kompakte Textaktion: Metaschrift ohne Kante. */
export const COMPACT_ACTION =
  "inline-flex min-h-[24px] items-center text-meta text-ink-3 hover:text-ink-1 disabled:text-ink-off";

/** Link im normalen Textfluss. */
export const TEXT_LINK = "text-meta text-ink-3 hover:text-ink-1";

/** Eingabefelder: eingelassene Fläche, 1-px-Kante, kein Radius. */
export const FIELD =
  "min-h-[36px] w-full border border-line bg-inset px-3 py-2 text-ui text-ink-1 placeholder:text-ink-3 " +
  "disabled:text-ink-off";

/** Umschalter-Segment (Tag | Woche | Monat). */
export function segment(active: boolean): string {
  return (
    "inline-flex min-h-[36px] items-center justify-center px-3 text-ui-sm tracking-[0.04em] uppercase " +
    (active ? "bg-accent text-on-accent" : "text-ink-2 hover:text-ink-1")
  );
}

/** Auswahlfeld: wie FIELD, mit Platz für den Pfeil rechts. */
export const SELECT = `${FIELD} pr-7`;
