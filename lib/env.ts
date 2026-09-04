/**
 * Umgebungsvariablen an einer Stelle, träge gelesen, damit `next build`
 * ohne gesetzte Secrets durchläuft und erst der laufende Server sie verlangt.
 */
function required(name: string, minLength = 1): string {
  const value = process.env[name];
  if (value === undefined || value.length < minLength) {
    throw new Error(
      `Umgebungsvariable ${name} fehlt${minLength > 1 ? ` oder ist kürzer als ${minLength} Zeichen` : ""}.`,
    );
  }
  return value;
}

export const env = {
  databasePath: () => process.env.DATABASE_PATH ?? "./data/zeiterfassung.db",
  authSecret: () => required("BETTER_AUTH_SECRET", 32),
  authUrl: () => required("BETTER_AUTH_URL").replace(/\/$/, ""),
  timezone: () => process.env.APP_TIMEZONE ?? "Europe/Berlin",
  isProduction: () => process.env.NODE_ENV === "production",
  bootstrap: () => ({
    organization: process.env.BOOTSTRAP_ORGANIZATION ?? "",
    email: (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "").trim().toLowerCase(),
    name: process.env.BOOTSTRAP_ADMIN_NAME ?? "",
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "",
  }),
};
