# Zeiterfassung

Schlichte Webapp zur Projektzeiterfassung für kleine Teams. Projekte anlegen,
Zeiten per Stoppuhr oder von Hand buchen, Dashboard nach Tag, Woche und Monat,
Auswertung nach Projekt, Person und Zeitraum, Export als PDF. Mehrere Benutzer
und Organisationen, Anmeldung mit E-Mail und Passwort, helles und dunkles
Farbschema, auf dem Handy nutzbar.

Ein Container, eine SQLite-Datei, keine externen Dienste.

## Für Benutzer

### Anmelden

Konten legt ein Owner unter **Verwaltung** an; es gibt keine Selbstregistrierung.
Du bekommst E-Mail-Adresse und Anfangspasswort persönlich und meldest dich unter
`/login` an. Das Passwort ändert der Owner in der Verwaltung; ein Weg zum
Zurücksetzen per E-Mail ist nicht vorgesehen.

Rechts oben wählst du das Farbschema (Auto folgt dem System, Hell, Dunkel) und
meldest dich ab. Auf dem Handy liegt die Navigation am unteren Rand.

### Dashboard und Stoppuhr

Die Startseite zeigt oben die **Stoppuhr**: Projekt wählen, optional eine Notiz,
**Starten**. Die Uhr läuft serverseitig weiter, auch wenn du den Browser
schließt oder das Gerät wechselst, und erscheint auf jeder Seite in der
Kopfleiste. **Stoppen** bucht die Zeit; kürzer als eine Minute wird verworfen.
Wer eine zweite Stoppuhr startet, beendet damit die laufende.

Darunter wechselst du zwischen **Tag**, **Woche** und **Monat**, blätterst mit
‹ › und springst mit **Heute** zurück. Das Diagramm zeigt am Tag die Stunden je
Projekt, in Woche und Monat die Stunden je Tag. Die Liste darunter führt alle
Einträge des Zeitraums mit Bearbeiten und Löschen.

### Zeiten nachtragen

Unter **Zeiten** buchst du von Hand: Projekt, Datum, dann entweder **Von** und
**Bis** (die Dauer wird berechnet; liegt Bis vor Von, endet der Eintrag am
Folgetag) oder nur eine **Dauer** wie `1:30`, `1,5` oder `90m`, dann beginnt der
Eintrag um „Von" oder um 08:00. Höchstens 24 Stunden, kein Beginn in der
Zukunft. Über **Bearbeiten** änderst du Projekt, Zeiten und Notiz später.

### Projekte

Unter **Projekte** legst du Projekte mit Name, optionalem Kürzel und
Beschreibung an. Die Liste zeigt je Projekt die Summe der Stunden. Owner können
Projekte **archivieren**: sie sind dann für neue Buchungen gesperrt, bleiben
aber in der Auswertung wählbar. Löschen geht nur, solange keine Buchung
existiert.

### Auswertung und PDF

Unter **Auswertung** wählst du den Zeitraum (Heute, diese Woche, dieser Monat,
letzter Monat, dieses Jahr, gesamt oder frei von/bis), filterst nach Projekten
und gruppierst nach Projekt, Person oder Tag. Die Tabelle zeigt Zwischensummen
und die Gesamtsumme in Stunden:Minuten und als Dezimalstunden. **PDF
exportieren** lädt dieselbe Auswertung als Dokument mit Kopf, Gruppen,
Summen und Seitenzahlen herunter.

### Rollen: Owner und Mitarbeiter

|                                               | Owner | Mitarbeiter |
| --------------------------------------------- | ----- | ----------- |
| Zeiten buchen, eigene Einträge bearbeiten     | ja    | ja          |
| Zeiten anderer sehen, bearbeiten, auswerten   | ja    | nein        |
| Projekte anlegen                              | ja    | ja          |
| Projekte archivieren, löschen                 | ja    | nein        |
| Mitglieder anlegen, Rolle und Passwort setzen | ja    | nein        |
| Organisationen anlegen, umbenennen            | ja    | nein        |

Mitarbeiter sehen überall nur ihre eigenen Zeiten: im Dashboard, in den
Projektsummen, in der Auswertung und im PDF. Owner sehen alles und können in
der Auswertung nach Person filtern.

### Verwaltung und Organisationen

Unter **Verwaltung** (nur Owner) legst du Mitglieder an, änderst Name, Rolle und
Passwort, deaktivierst Konten (sie können sich nicht mehr anmelden, ihre Zeiten
bleiben) oder entfernst sie aus der Organisation.

Eine **Organisation** ist der Rahmen für Projekte, Mitglieder und Zeiten. Ein
Owner kann weitere Organisationen anlegen und wird dort Owner. Bestehende Konten
ordnet er über „Neues Mitglied" ohne Passwort zu. Wer in mehr als einer
Organisation ist, wechselt in der Kopfleiste; Projekte, Zeiten und Auswertung
zeigen dann nur die aktive Organisation.

## Für Betreiber

### Stack

Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind 4,
Drizzle ORM mit SQLite (`better-sqlite3`), Better Auth (Session-Cookies),
`@react-pdf/renderer` für den Export.

### Lokal starten

Voraussetzungen: Node 22 (`.nvmrc`), pnpm 11.

```bash
pnpm install
cp .env.example .env.local   # Werte eintragen, siehe unten
pnpm dev
```

Beim ersten Start legt die App die Datenbank an, führt die Migrationen aus und
erzeugt Organisation und ersten Owner aus den `BOOTSTRAP_*`-Variablen. Danach:
`http://127.0.0.1:3000/login`. Testdaten mit zweiter Person und drei Wochen
Buchungen:

```bash
pnpm seed:dev
```

### Umgebungsvariablen

| Variable                   | Bedeutung                                                         |
| -------------------------- | ----------------------------------------------------------------- |
| `DATABASE_PATH`            | Pfad der SQLite-Datei (Container: `/data/zeiterfassung.db`)       |
| `BETTER_AUTH_SECRET`       | Mindestens 32 Zeichen, z. B. `openssl rand -base64 48`            |
| `BETTER_AUTH_URL`          | Öffentliche Basis-URL ohne Pfad, z. B. `https://zeit.example.com` |
| `APP_TIMEZONE`             | Zeitzone für Tages-, Wochen- und Monatsgrenzen (`Europe/Berlin`)  |
| `BOOTSTRAP_ORGANIZATION`   | Name der ersten Organisation                                      |
| `BOOTSTRAP_ADMIN_EMAIL`    | E-Mail des ersten Owners                                          |
| `BOOTSTRAP_ADMIN_NAME`     | Anzeigename des ersten Owners                                     |
| `BOOTSTRAP_ADMIN_PASSWORD` | Anfangspasswort (mindestens 10 Zeichen)                           |

Die `BOOTSTRAP_*`-Werte wirken nur, solange die Datenbank keinen Benutzer
enthält. Das Anfangspasswort danach aus der Datei entfernen.

### Docker

Selbst bauen und starten:

```bash
cp .env.example .env         # BETTER_AUTH_URL auf die öffentliche https-URL setzen
docker compose up -d --build
```

Der Container bindet an `127.0.0.1:3000`; davor gehört ein Reverse-Proxy mit
TLS (Caddy, Traefik, nginx), der `Host` und `Origin` unverändert durchreicht.
Die Datenbank liegt im Volume `zeiterfassung-data`. Migrationen laufen bei
jedem Start automatisch.

Backup ist eine konsistente Kopie der SQLite-Datei:

```bash
docker compose exec zeiterfassung node -e "require('better-sqlite3')('/data/zeiterfassung.db').backup('/data/backup.db')"
docker compose cp zeiterfassung:/data/backup.db ./backup-$(date +%F).db
```

### Fertiges Image und automatischer Deploy

Jeder Push auf `main` lässt GitHub Actions Typecheck, Lint und Tests laufen und
baut `ghcr.io/pipedreams-zz/zeiterfassung:latest`. Unter `deploy/` liegen
Beispiele für einen Host, auf dem bereits ein Caddy in einem Docker-Netz läuft:

| Datei                                     | Zweck                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `deploy/zeiterfassung/docker-compose.yml` | App aus dem Image, im Netz des Proxys, ohne veröffentlichten Port                   |
| `deploy/zeiterfassung/.env.example`       | Produktionswerte, ausgefüllt als `.env` daneben, `chmod 600`                        |
| `deploy/watchtower/docker-compose.yml`    | Watchtower zieht neue Images, nur für Container mit Label                           |
| `deploy/Caddyfile.example`                | Site-Block; danach `docker exec <caddy> caddy reload --config /etc/caddy/Caddyfile` |

Manuell aktualisieren geht jederzeit, auch ohne Watchtower:

```bash
docker compose pull && docker compose up -d
```

Auf eine bestimmte Version zurück: `:latest` durch `:sha-<Commit>` ersetzen.

### Befehle

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

### Struktur

```text
app/
├── (app)/            geschützter Bereich: Dashboard, zeiten, projekte, auswertung, verwaltung
├── api/auth/         Better-Auth-Handler
├── api/export/pdf/   PDF-Download
├── login/
├── globals.css       Tailwind-Theme aus den Tokens
└── tokens.css        Designtokens, dunkel und hell
components/           Bausteine (Buttons, Panels), Shell, Navigation, Stoppuhr, Diagramm
lib/
├── auth.ts, actor.ts, permissions.ts   Anmeldung, aktive Organisation, Rechte
├── db.ts, schema.ts, bootstrap.ts
├── data/             Projekte, Einträge, Mitglieder, Buchungsregeln
├── time/             Zeiträume, Aggregation, Formate, Dauer-Parser
├── report.ts, pdf/   Auswertung und PDF
drizzle/              Migrationen
deploy/               Beispiele für Host, Watchtower und Caddy
```

Rechtefragen sind in `lib/permissions.ts` gebündelt; `entryScope` bestimmt, wessen
Zeiten eine Person sieht.

## Gestaltung

Ruhig und reduziert: zwei Schriften (Space Grotesk für Titel, Supreme für Text),
keine Rundungen, keine Schatten, ein Akzent, eine Achtungsfarbe. Status wird nie
allein über Farbe vermittelt, kein Text unter 12 px, sichtbarer Tastaturfokus,
reduzierte Bewegung wird respektiert.
