import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { parseTheme, THEME_SCRIPT } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Zeiterfassung", template: "%s · Zeiterfassung" },
  description: "Projektzeiten erfassen und auswerten.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0c0c0c" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default async function RootLayout({ children }: { readonly children: ReactNode }) {
  const theme = parseTheme((await cookies()).get("theme")?.value);

  return (
    <html
      lang="de"
      {...(theme === "system" ? {} : { "data-theme": theme })}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
