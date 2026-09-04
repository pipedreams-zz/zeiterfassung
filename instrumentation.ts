/** Einmal beim Serverstart: Migrationen und erster Owner. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrap } = await import("./lib/bootstrap");
    await bootstrap();
  }
}
