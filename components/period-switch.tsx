import Link from "next/link";

import {
  PERIOD_KINDS,
  periodLabel,
  shiftAnchor,
  todayKey,
  type PeriodKind,
} from "@/lib/time/periods";

import { COMPACT_ACTION, segment } from "./chrome";

const KIND_LABEL: Record<PeriodKind, string> = { day: "Tag", week: "Woche", month: "Monat" };

function href(base: string, kind: PeriodKind, anchor: string, extra: string): string {
  return `${base}?p=${kind}&d=${anchor}${extra}`;
}

/** Tag | Woche | Monat mit Blättern; Zustand liegt in der URL. */
export function PeriodSwitch({
  base,
  kind,
  anchor,
  tz,
  extraQuery = "",
}: {
  readonly base: string;
  readonly kind: PeriodKind;
  readonly anchor: string;
  readonly tz: string;
  readonly extraQuery?: string;
}) {
  const today = todayKey(tz);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex items-center gap-3">
        <div className="flex border border-line-strong" role="group" aria-label="Zeitraum">
          {PERIOD_KINDS.map((k) => (
            <Link
              key={k}
              href={href(base, k, anchor, extraQuery)}
              className={segment(k === kind)}
              aria-current={k === kind ? "true" : undefined}
            >
              {KIND_LABEL[k]}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Link
            className={`${COMPACT_ACTION} min-w-[24px] justify-center text-ui`}
            href={href(base, kind, shiftAnchor(kind, anchor, -1, tz), extraQuery)}
            aria-label="Zurück"
          >
            ‹
          </Link>
          <Link
            className={`${COMPACT_ACTION} min-w-[24px] justify-center text-ui`}
            href={href(base, kind, shiftAnchor(kind, anchor, 1, tz), extraQuery)}
            aria-label="Weiter"
          >
            ›
          </Link>
          {anchor === today ? null : (
            <Link
              className={`${COMPACT_ACTION} ml-1 uppercase tracking-[0.1em]`}
              href={href(base, kind, today, extraQuery)}
            >
              Heute
            </Link>
          )}
        </div>
      </div>
      <span className="text-ui text-ink-2">{periodLabel(kind, anchor, tz)}</span>
    </div>
  );
}

/** Liest `p` und `d` aus den Suchparametern. */
export function readPeriod(
  params: { readonly p?: string; readonly d?: string },
  tz: string,
  fallback: PeriodKind,
): { kind: PeriodKind; anchor: string } {
  const kind =
    params.p === "day" || params.p === "week" || params.p === "month" ? params.p : fallback;
  const anchor =
    params.d !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(params.d) ? params.d : todayKey(tz);
  return { kind, anchor };
}
