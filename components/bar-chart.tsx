import { hm } from "@/lib/time/format";

export interface Bar {
  readonly key: string;
  readonly label: string;
  readonly seconds: number;
  /** Hervorgehoben, etwa der heutige Tag. */
  readonly emphasis?: boolean;
  readonly title?: string;
}

/**
 * Balkendiagramm aus HTML: eine Serie, Grau, direkt beschriftet, ohne
 * Legende. Gitterlinien in `line-soft`, Nulllinie in `line`. Balken mit
 * Wert tragen ihn über dem Balken, leere Tage bleiben leer.
 */
export function BarChart({
  bars,
  height = 168,
}: {
  readonly bars: readonly Bar[];
  readonly height?: number;
}) {
  const max = Math.max(3600, ...bars.map((b) => b.seconds));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const lines = [];
  for (let v = step; v <= top; v += step) lines.push(v);
  const dense = bars.length > 14;

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative" style={{ height }}>
        {lines.map((v) => (
          <div
            key={v}
            aria-hidden="true"
            className="absolute inset-x-0 flex items-end border-t border-line-soft"
            style={{ bottom: `${(v / top) * 100}%` }}
          >
            <span className="tabular -translate-y-full pr-1 text-meta text-ink-3">{hm(v)}</span>
          </div>
        ))}
        <ol
          className="absolute inset-0 flex items-end gap-[2px] border-b border-line pl-[42px]"
          role="list"
        >
          {bars.map((b) => (
            <li
              key={b.key}
              className="group relative flex h-full flex-1 flex-col justify-end"
              title={b.title ?? `${b.label}: ${hm(b.seconds)} h`}
            >
              {b.seconds > 0 && !dense ? (
                <span className="tabular mb-1 text-center text-meta text-ink-2">
                  {hm(b.seconds)}
                </span>
              ) : null}
              <div
                className={`mx-auto w-full max-w-[160px] ${b.emphasis ? "bg-ink-1" : "bg-ink-3 group-hover:bg-ink-2"}`}
                style={{ height: `${(b.seconds / top) * 100}%`, minHeight: b.seconds > 0 ? 2 : 0 }}
              />
            </li>
          ))}
        </ol>
      </div>
      <ol className="flex gap-[2px] pl-[42px]" aria-hidden="true">
        {bars.map((b) => (
          <li
            key={b.key}
            className={`flex-1 truncate text-center text-meta ${b.emphasis ? "text-ink-1" : "text-ink-3"} ${dense ? "hidden [&:nth-child(7n+1)]:block" : ""}`}
          >
            {b.label}
          </li>
        ))}
      </ol>
      <figcaption className="sr-only">
        {bars.map((b) => `${b.label}: ${hm(b.seconds)} Stunden`).join(", ")}
      </figcaption>
    </figure>
  );
}

function niceStep(maxSeconds: number): number {
  const hours = maxSeconds / 3600;
  if (hours <= 4) return 3600;
  if (hours <= 8) return 2 * 3600;
  if (hours <= 20) return 4 * 3600;
  if (hours <= 60) return 10 * 3600;
  return 20 * 3600;
}
