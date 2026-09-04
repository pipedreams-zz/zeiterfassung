import { renderToBuffer } from "@react-pdf/renderer";

import { getActor } from "@/lib/actor";
import { env } from "@/lib/env";
import { reportDocument } from "@/lib/pdf/report";
import { buildReport, parseReportQuery } from "@/lib/report";

export const dynamic = "force-dynamic";

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: Request): Promise<Response> {
  const actor = await getActor();
  if (actor === null) return new Response("Nicht angemeldet.", { status: 401 });

  const tz = env.timezone();
  const params: Record<string, string | string[]> = {};
  for (const [k, v] of new URL(request.url).searchParams) {
    const prev = params[k];
    params[k] = prev === undefined ? v : Array.isArray(prev) ? [...prev, v] : [prev, v];
  }
  const query = parseReportQuery(params, tz);
  const report = buildReport(actor, query, tz);
  const buffer = await renderToBuffer(reportDocument(report, tz));

  const filename = `auswertung-${slug(report.periodLabel)}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
