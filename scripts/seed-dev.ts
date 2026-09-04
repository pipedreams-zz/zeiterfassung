/**
 * Testdaten für die Entwicklung: eine zweite Person und Buchungen der
 * letzten drei Wochen. Aufruf: `pnpm seed:dev` (liest .env.local).
 * Nur für leere oder Entwicklungsdatenbanken gedacht.
 */
import { addDays } from "date-fns";
import { asc } from "drizzle-orm";

import { runMigrations, db } from "../lib/db";
import { createManualEntry } from "../lib/data/entries";
import { createMember } from "../lib/data/members";
import { createProject, projectOptions } from "../lib/data/projects";
import { memberships, organizations } from "../lib/schema";
import { localDateTime, todayKey } from "../lib/time/periods";

const TZ = process.env.APP_TIMEZONE ?? "Europe/Berlin";

async function main() {
  runMigrations();
  const org = db().select().from(organizations).orderBy(asc(organizations.createdAt)).get();
  if (org === undefined)
    throw new Error("Keine Organisation — zuerst die App starten (Bootstrap).");
  const owner = db().select().from(memberships).orderBy(asc(memberships.createdAt)).get();
  if (owner === undefined) throw new Error("Kein Owner.");

  const miaId = await createMember(org.id, {
    email: "mia@example.com",
    name: "Mia Muster",
    password: "mia-passwort-123",
    role: "member",
  });

  let projects = projectOptions(org.id);
  if (projects.length < 3) {
    for (const [name, code] of [
      ["Villa Seeblick Visualisierung", "RTX-12"],
      ["Website Relaunch", "WEB"],
      ["Quartier Nord Wettbewerb", "QN-03"],
    ] as const) {
      if (!projects.some((p) => p.code === code))
        createProject(org.id, owner.userId, { name, code, description: null });
    }
    projects = projectOptions(org.id);
  }

  const notes = [
    "Modellaufbau",
    "Materialien",
    "Renderings",
    "Abstimmung",
    "Korrekturen",
    "Nachbearbeitung",
    "Layout",
  ];
  const today = todayKey(TZ);
  const start = localDateTime(today, "00:00", TZ);
  if (start === null) throw new Error("Datum");

  let n = 0;
  for (let back = 21; back >= 1; back--) {
    const day = addDays(start, -back);
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    const dayKey = day.toISOString().slice(0, 10);
    for (const [userId, slots] of [
      [
        owner.userId,
        [
          ["09:00", "11:30"],
          ["12:30", "15:00"],
          ["15:15", "17:00"],
        ],
      ],
      [
        miaId,
        [
          ["08:30", "12:00"],
          ["13:00", "16:30"],
        ],
      ],
    ] as const) {
      for (const [from, to] of slots) {
        if (Math.random() < 0.15) continue;
        const project = projects[Math.floor(Math.random() * projects.length)];
        const s = localDateTime(dayKey, from, TZ);
        const e = localDateTime(dayKey, to, TZ);
        if (project === undefined || s === null || e === null) continue;
        createManualEntry(org.id, userId, {
          projectId: project.id,
          startedAt: s,
          endedAt: e,
          note: notes[n++ % notes.length] ?? null,
        });
      }
    }
  }
  console.info(`Seed fertig: ${n} Buchungen, Mitglied mia@example.com / mia-passwort-123.`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
