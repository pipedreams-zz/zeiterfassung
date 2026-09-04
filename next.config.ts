import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Für den Docker-Container: minimaler Server ohne node_modules-Kopie.
  output: "standalone",
  // Native Module bleiben außerhalb des Bundles.
  serverExternalPackages: ["better-sqlite3", "@react-pdf/renderer"],
};

export default config;
