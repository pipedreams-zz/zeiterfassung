"use client";

import { useEffect, useState } from "react";

import { runningSeconds } from "@/lib/time/aggregate";
import { hms } from "@/lib/time/format";

import { FIELD, SELECT } from "./chrome";
import { SubmitButton } from "./form";

export interface TimerProject {
  readonly id: string;
  readonly name: string;
  readonly code: string | null;
}

export interface TimerRunning {
  readonly id: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly startedAt: string;
  readonly note: string | null;
}

/** Tickt sekündlich ab `startedAt`; der Server hält den Beginn. */
export function useElapsed(startedAt: string | null): number {
  const [seconds, setSeconds] = useState(() =>
    startedAt === null ? 0 : runningSeconds(startedAt),
  );
  useEffect(() => {
    if (startedAt === null) return;
    setSeconds(runningSeconds(startedAt));
    const t = setInterval(() => setSeconds(runningSeconds(startedAt)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  return seconds;
}

export function Timer({
  projects,
  running,
  startAction,
  stopAction,
  noteAction,
}: {
  readonly projects: readonly TimerProject[];
  readonly running: TimerRunning | null;
  readonly startAction: (form: FormData) => Promise<void>;
  readonly stopAction: () => Promise<void>;
  readonly noteAction: (form: FormData) => Promise<void>;
}) {
  const elapsed = useElapsed(running?.startedAt ?? null);

  if (running !== null) {
    return (
      <div className="flex flex-col gap-[14px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-meta tracking-[0.14em] text-ink-3 uppercase">
              Läuft · {running.projectName}
            </span>
            <span className="tabular font-display text-clock text-ink-1" aria-live="off">
              {hms(elapsed)}
            </span>
          </div>
          <form action={stopAction}>
            <SubmitButton pendingLabel="Stoppen …" className="min-w-[160px]">
              <span aria-hidden="true">■</span> Stoppen
            </SubmitButton>
          </form>
        </div>
        <form action={noteAction} className="flex gap-2">
          <input
            className={FIELD}
            name="note"
            defaultValue={running.note ?? ""}
            placeholder="Notiz zur laufenden Zeit"
            maxLength={500}
          />
          <SubmitButton secondary pendingLabel="…">
            Notiz
          </SubmitButton>
        </form>
        <p className="text-meta text-ink-3">
          Kürzer als eine Minute wird nicht gebucht. Ein neuer Start stoppt die laufende Zeit.
        </p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <p className="text-ui text-ink-2">
        Lege zuerst ein Projekt an, dann kannst du die Stoppuhr starten.
      </p>
    );
  }

  return (
    <form action={startAction} className="flex flex-col gap-[14px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-meta tracking-[0.14em] text-ink-3 uppercase">Stoppuhr</span>
          <span className="tabular font-display text-clock text-ink-3">0:00:00</span>
        </div>
        <SubmitButton pendingLabel="Starten …" className="min-w-[160px]">
          <span aria-hidden="true">▶</span> Starten
        </SubmitButton>
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <select className={SELECT} name="projectId" required aria-label="Projekt" defaultValue="">
          <option value="" disabled>
            Projekt wählen …
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code === null ? p.name : `${p.code} · ${p.name}`}
            </option>
          ))}
        </select>
        <input className={FIELD} name="note" placeholder="Notiz (optional)" maxLength={500} />
      </div>
    </form>
  );
}

/** Kleine Anzeige in der Kopfleiste. */
export function RunningBadge({ running }: { readonly running: TimerRunning }) {
  const elapsed = useElapsed(running.startedAt);
  return (
    <a
      href="/"
      className="flex min-h-[28px] items-center gap-2 border border-ink-1 px-[9px] text-ui-sm text-ink-1"
    >
      <span aria-hidden="true" className="text-ink-1">
        ●
      </span>
      <span className="hidden max-w-[160px] truncate sm:inline">{running.projectName}</span>
      <span className="tabular">{hms(elapsed)}</span>
    </a>
  );
}
