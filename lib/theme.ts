import type { ThemeChoice } from "../components/theme-toggle";

export function parseTheme(value: string | undefined): ThemeChoice {
  return value === "light" || value === "dark" ? value : "system";
}

/**
 * Läuft vor dem ersten Paint und setzt `data-theme` aus localStorage oder
 * Systemeinstellung — ohne Flackern beim Laden.
 */
export const THEME_SCRIPT =
  "(function(){try{var t=localStorage.getItem('theme')||'system';" +
  "var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);" +
  "document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}})()";
