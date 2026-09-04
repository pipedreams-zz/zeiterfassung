# Zeiterfassung

Schlichte Webapp zur Projektzeiterfassung für kleine Teams: Projekte anlegen,
Zeiten per Stoppuhr oder manuell buchen, Dashboard nach Tag / Woche / Monat,
Auswertung nach Projekt, Person und Zeitraum, PDF-Export. Mehrere Benutzer je
Organisation, Anmeldung mit E-Mail und Passwort, hell und dunkel, responsiv.

Die Gestaltung folgt der Design-Baseline von rendertaxi.ai (Tokens, Schriften,
Bausteine übernommen): Radius 0, keine Schatten, ein Akzent, Status nie nur
über Farbe.

## Stack

Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind 4,
Drizzle ORM mit SQLite (`better-sqlite3`), Better Auth (Session-Cookies),
`@react-pdf/renderer` für den Export. Eine App, ein Container, eine Datei als
Datenbank.

## Lokal starten

Voraussetzungen: Node 22 (`.nvmrc`), pnpm 11.

```bash
pnpm install
cp .env.example .env.local   # Werte eintragen, siehe unten
pnpm dev
```

Beim ersten Start legt die App die Datenbank an, führt die Migrationen aus und
erzeugt Organisation und ersten Owner aus den `BOOTSTRAP_*`-Variablen. Danach:
`http://127.0.0.1:3000/login`.

Testdaten (zweite Person `mia@example.com`, drei Wochen Buchungen):

```bash
pnpm seed:dev
```

## Umgebungsvariablen

| Variable                   | Bedeutung                                                     |
| -------------------------- | ------------------------------------------------------------- |
| `DATABASE_PATH`            | Pfad der SQLite-Datei (Container: `/data/zeiterfassung.db`)   |
| `BETTER_AUTH_SECRET`       | Mindestens 32 Zeichen, z. B. `openssl rand -base64 48`        |
| `BETTER_AUTH_URL`          | Öffentliche Basis-URL ohne Pfad, z. B. `https://zeit.example` |
| `APP_TIMEZONE`             | Zeitzone für Tages-/Wochen-/Monatsgrenzen (`Europe/Berlin`)   |
| `BOOTSTRAP_ORGANIZATION`   | Name der ersten Organisation                                  |
| `BOOTSTRAP_ADMIN_EMAIL`    | E-Mail des ersten Owners                                      |
| `BOOTSTRAP_ADMIN_NAME`     | Anzeigename des ersten Owners                                 |
| `BOOTSTRAP_ADMIN_PASSWORD` | Anfangspasswort (mindestens 10 Zeichen)                       |

Die `BOOTSTRAP_*`-Werte wirken nur, solange die Datenbank keinen Benutzer
enthält. Weitere Benutzer legt ein Owner unter **Verwaltung** an; es gibt
bewusst keine Selbstregistrierung und keinen Mailversand.

## Docker auf der VPS

```bash
cp .env.example .env         # BETTER_AUTH_URL auf die öffentliche https-URL setzen
docker compose up -d --build
```

Der Container bindet an `127.0.0.1:3000`; davor gehört ein Reverse-Proxy mit
TLS (Caddy, Traefik, nginx), der `Host` und `Origin` unverändert durchreicht.
Die Datenbank liegt im Volume `zeiterfassung-data`. Backup:

```bash
docker compose exec zeiterfassung node -e "require('better-sqlite3')('/data/zeiterfassung.db').backup('/data/backup.db')"
docker compose cp zeiterfassung:/data/backup.db ./backup-$(date +%F).db
```

Migrationen laufen bei jedem Start automatisch (`instrumentation.ts`).

## Deploy auf ampsrvr.xyz (timetrack.ampsrvr.xyz)

Jeder Push auf `main` lässt GitHub Actions Typecheck, Lint und Tests laufen und baut
danach das Image `ghcr.io/pipedreams-zz/zeiterfassung:latest`. Auf dem Host holt
Watchtower neue Images automatisch (nur Container mit Watchtower-Label, alle
5 Minuten). Die Vorlagen liegen unter `deploy/`:

| Datei                                     | Ziel auf dem Host                                                                                           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `deploy/zeiterfassung/docker-compose.yml` | `~/stacks/zeiterfassung/docker-compose.yml`                                                                 |
| `deploy/zeiterfassung/.env.example`       | `~/stacks/zeiterfassung/.env` (ausgefüllt, `chmod 600`)                                                     |
| `deploy/watchtower/docker-compose.yml`    | `~/stacks/watchtower/docker-compose.yml`                                                                    |
| `deploy/Caddyfile.timetrack`              | anhängen an `/opt/n8n/Caddyfile`, dann `docker exec n8n-caddy-1 caddy reload --config /etc/caddy/Caddyfile` |

Der App-Container hängt im Compose-Netz `n8n_default` des bestehenden Caddy und
veröffentlicht keinen Port; Caddy besorgt das Zertifikat selbst.

Manuell aktualisieren geht jederzeit, auch ohne Watchtower:

```bash
cd ~/stacks/zeiterfassung && docker compose pull && docker compose up -d
```

Auf eine bestimmte Version zurück: im Compose-File `:latest` durch `:sha-<kurzer Commit>`
ersetzen und `docker compose up -d` (Watchtower folgt dann diesem Tag).

## Rollen und Sichtbarkeit

Jeder Benutzer gehört zu einer Organisation mit der Rolle `owner` oder
`member`. Projekte sind organisationsweit; Zeiten hängen an der Person.
Im aktuellen Stand sehen beide Rollen alle Zeiten der Organisation; nur Owner
verwalten Benutzer und archivieren Projekte. Die Sichtbarkeit ist an einer
Stelle gebündelt (`lib/permissions.ts`, `entryScope`), damit eine spätere
Einschränkung für Mitarbeiter eine Ein-Stellen-Änderung bleibt. Mehrere
Organisationen sind im Datenmodell vorgesehen, eine Umschaltung in der
Oberfläche noch nicht.

## Befehle

| Befehl             | Wirkung                                    |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Entwicklungsserver auf 127.0.0.1:3000      |
| `pnpm build`       | Produktionsbuild (standalone)              |
| `pnpm start`       | Produktionsserver                          |
| `pnpm typecheck`   | TypeScript                                 |
| `pnpm lint`        | ESLint und Prettier                        |
| `pnpm test`        | Vitest (Zeiträume, Aggregation, Rechte, …) |
| `pnpm db:generate` | Migration aus `lib/schema.ts` ableiten     |
| `pnpm db:migrate`  | Migrationen manuell anwenden               |
| `pnpm seed:dev`    | Testdaten                                  |

## Struktur

```text
app/
├── (app)/            geschützter Bereich: Dashboard, zeiten, projekte, auswertung, verwaltung
├── api/auth/         Better-Auth-Handler
├── api/export/pdf/   PDF-Download
├── login/
├── globals.css       Tailwind-Theme aus den Tokens
└── tokens.css        Designtokens, dunkel und hell
components/           Chrome (Buttons, Panels), Shell, Navigation, Stoppuhr, Diagramm
lib/
├── auth.ts, actor.ts, permissions.ts
├── db.ts, schema.ts, bootstrap.ts
├── data/             Projekte, Einträge, Mitglieder, Buchungsregeln
├── time/             Zeiträume, Aggregation, Formate, Dauer-Parser
├── report.ts, pdf/   Auswertung und PDF
drizzle/              Migrationen
```
