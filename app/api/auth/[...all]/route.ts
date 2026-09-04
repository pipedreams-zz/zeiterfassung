import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* Träge, damit `next build` die Datenbank nicht öffnet. */
function handler() {
  return toNextJsHandler(auth());
}

export async function GET(request: Request): Promise<Response> {
  return handler().GET(request);
}

export async function POST(request: Request): Promise<Response> {
  return handler().POST(request);
}
