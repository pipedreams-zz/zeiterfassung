import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";

import { db } from "./db";
import { env } from "./env";
import { uuidv7 } from "./ids";
import { accounts, sessions, users, verifications } from "./schema";

/**
 * Better Auth: E-Mail und Passwort, serverseitige Sessions als HTTP-only-
 * Cookie. Die HTTP-Instanz lässt keine Registrierung zu; Benutzer entstehen
 * ausschließlich über die interne Instanz (`internalAuth`), die nur
 * Server-Code erreicht — Bootstrap und die Verwaltungsseite.
 */
function build(allowSignUp: boolean) {
  return betterAuth({
    baseURL: env.authUrl(),
    secret: env.authSecret(),
    trustedOrigins: [env.authUrl()],
    database: drizzleAdapter(db(), {
      provider: "sqlite",
      usePlural: true,
      schema: { users, sessions, accounts, verifications },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !allowSignUp,
      minPasswordLength: 10,
      autoSignIn: false,
    },
    user: {
      additionalFields: {
        active: { type: "boolean", required: false, defaultValue: true, input: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      database: { generateId: () => uuidv7() },
      useSecureCookies: env.isProduction() && env.authUrl().startsWith("https://"),
    },
    rateLimit: { enabled: true },
    telemetry: { enabled: false },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // Deaktivierte Konten werden wie ein falsches Passwort abgewiesen —
        // ein anderer Text würde verraten, dass das Konto existiert.
        if (ctx.path === "/sign-in/email") {
          const email = String((ctx.body as { email?: unknown } | undefined)?.email ?? "")
            .trim()
            .toLowerCase();
          if (email !== "") {
            const row = db()
              .select({ active: users.active })
              .from(users)
              .where(eq(users.email, email))
              .get();
            if (row !== undefined && !row.active) {
              throw new APIError("UNAUTHORIZED", { message: "Invalid email or password" });
            }
          }
        }
      }),
    },
  });
}

type Auth = ReturnType<typeof build>;

const store = globalThis as unknown as { __zfAuth?: Auth; __zfAuthInternal?: Auth };

/** Die Instanz hinter `/api/auth` und `getSession`. Ohne Registrierung. */
export function auth(): Auth {
  store.__zfAuth ??= build(false);
  return store.__zfAuth;
}

/** Nur für Server-Code: legt Konten an. Nie an eine Route gebunden. */
export function internalAuth(): Auth {
  store.__zfAuthInternal ??= build(true);
  return store.__zfAuthInternal;
}

/** Setzt ein neues Passwort und beendet alle Sessions des Kontos. */
export async function setPassword(userId: string, password: string): Promise<void> {
  const ctx = await auth().$context;
  const hash = await ctx.password.hash(password);
  await ctx.internalAdapter.updatePassword(userId, hash);
  await ctx.internalAdapter.deleteUserSessions(userId);
}

export async function revokeSessions(userId: string): Promise<void> {
  const ctx = await auth().$context;
  await ctx.internalAdapter.deleteUserSessions(userId);
}
