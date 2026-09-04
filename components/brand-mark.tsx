/**
 * Markenzeichen der Zeiterfassung: ein Quadrat mit Zeiger — Rechteck statt
 * Kreis, passend zu Radius 0. Inline mit `currentColor`.
 */
export function BrandMark({ size = 16 }: { readonly size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" focusable="false">
      <rect x="0.5" y="0.5" width="15" height="15" fill="none" stroke="currentColor" />
      <path d="M8 3v5h4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
