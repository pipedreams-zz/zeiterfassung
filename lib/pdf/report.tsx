import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Report } from "../report";
import { decimalHours, formatDateTime, formatTime, hm } from "../time/format";

/*
 * PDF der Auswertung: Helvetica, Schwarz und Grau, Haarlinien, Großbuchstaben-
 * Labels — die Baseline auf Papier. Die WOFF2-Schriften der Oberfläche kann
 * react-pdf nicht laden; Helvetica ist die neutrale Entsprechung.
 */
const INK = "#141414";
const INK_2 = "#3a3a37";
const INK_3 = "#5a5a56";
const LINE = "#c9c7c1";
const LINE_SOFT = "#e5e3de";
const RAISED = "#f4f3f0";

const s = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: INK_2,
  },
  label: { fontSize: 7, letterSpacing: 1, textTransform: "uppercase", color: INK_3 },
  title: { fontSize: 18, color: INK, marginTop: 2 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: INK,
    paddingBottom: 10,
    marginBottom: 14,
  },
  meta: { flexDirection: "row", gap: 24, marginBottom: 18 },
  metaItem: { flexDirection: "column", gap: 2 },
  metaValue: { fontSize: 9, color: INK_2 },
  total: { fontSize: 20, color: INK },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: 0.5,
    borderTopColor: LINE_SOFT,
    paddingVertical: 4,
  },
  head: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: 4 },
  groupRow: {
    flexDirection: "row",
    backgroundColor: RAISED,
    paddingVertical: 5,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  groupTitle: { fontSize: 9.5, color: INK },
  cDate: { width: 70 },
  cTime: { width: 64 },
  cWho: { width: 110 },
  cNote: { flex: 1, paddingRight: 8 },
  cDur: { width: 48, textAlign: "right" },
  right: { textAlign: "right" },
  ink: { color: INK },
  sum: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: INK,
    paddingTop: 8,
    marginTop: 10,
  },
  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: INK_3,
  },
});

/** Das fertige Dokument für `renderToBuffer`. */
export function reportDocument(report: Report, tz: string) {
  const whoHeader = report.query.group === "project" ? "Person" : "Projekt";
  return (
    <Document
      title={`Zeitauswertung ${report.periodLabel}`}
      author={report.organizationName}
      language="de"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View>
            <Text style={s.label}>{report.organizationName}</Text>
            <Text style={s.title}>Zeitauswertung</Text>
          </View>
          <Text style={[s.label, { fontSize: 8 }]}>{report.periodLabel}</Text>
        </View>

        <View style={s.meta}>
          <View style={s.metaItem}>
            <Text style={s.label}>Gesamt</Text>
            <Text style={s.total}>{hm(report.totalSeconds)} h</Text>
            <Text style={{ fontSize: 8, color: INK_3 }}>
              {decimalHours(report.totalSeconds)} Dezimalstunden · {report.entryCount} Einträge
            </Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.label}>Projekte</Text>
            <Text style={s.metaValue}>{report.projectLabel}</Text>
            <Text style={[s.label, { marginTop: 4 }]}>Person</Text>
            <Text style={s.metaValue}>{report.personLabel}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.label}>Gruppiert nach</Text>
            <Text style={s.metaValue}>{report.groupLabel}</Text>
            <Text style={[s.label, { marginTop: 4 }]}>Erstellt</Text>
            <Text style={s.metaValue}>{formatDateTime(report.generatedAt, tz)}</Text>
          </View>
        </View>

        <View style={s.head} fixed>
          <Text style={[s.label, s.cDate]}>Datum</Text>
          <Text style={[s.label, s.cTime]}>Zeit</Text>
          <Text style={[s.label, s.cWho]}>{whoHeader}</Text>
          <Text style={[s.label, s.cNote]}>Notiz</Text>
          <Text style={[s.label, s.cDur]}>Dauer</Text>
        </View>

        {report.groups.map((g) => (
          <View key={g.key}>
            <View style={s.groupRow} wrap={false}>
              <Text style={[s.groupTitle, { flex: 1 }]}>
                {g.sublabel === null ? "" : `${g.sublabel}  `}
                {g.label}
                <Text style={{ color: INK_3 }}> {g.entries.length} Einträge</Text>
              </Text>
              <Text style={[s.cDur, s.ink]}>{hm(g.seconds)}</Text>
            </View>
            {g.entries.map((e) => (
              <View key={e.id} style={s.row} wrap={false}>
                <Text style={s.cDate}>{formatDateTime(e.startedAt, tz).split(",")[0]}</Text>
                <Text style={s.cTime}>
                  {formatTime(e.startedAt, tz)}–{formatTime(e.endedAt ?? e.startedAt, tz)}
                </Text>
                <Text style={s.cWho}>
                  {report.query.group === "project" ? e.userName : e.projectName}
                </Text>
                <Text style={s.cNote}>{e.note ?? ""}</Text>
                <Text style={s.cDur}>{hm(e.durationSeconds)}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={s.sum} wrap={false}>
          <Text style={[s.label, { flex: 1, fontSize: 8, color: INK }]}>Gesamt</Text>
          <Text style={[s.cDur, s.ink, { fontSize: 12 }]}>{hm(report.totalSeconds)}</Text>
        </View>

        <View style={s.footer} fixed>
          <Text>
            {report.organizationName} · Zeiterfassung · {report.periodLabel}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
