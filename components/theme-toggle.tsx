"use client";

import { useEffect, useState } from "react";

export type ThemeChoice = "system" | "light" | "dark";

const CHOICES: readonly ThemeChoice[] = ["system", "light", "dark"];
const LABEL: Record<ThemeChoice, string> = { system: "Auto", light: "Hell", dark: "Dunkel" };

function resolve(choice: ThemeChoice): "light" | "dark" {
  if (choice === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return choice;
}

function apply(choice: ThemeChoice) {
  document.documentElement.dataset.theme = resolve(choice);
}

function persist(choice: ThemeChoice) {
  try {
    localStorage.setItem("theme", choice);
  } catch {
    /* privates Fenster o. ä. */
  }
  document.cookie = `theme=${choice}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Umschalter Auto / Hell / Dunkel. Das gewählte Verhalten liegt in
 * `localStorage` (für das Inline-Script vor dem ersten Paint) und in einem
 * Cookie (damit der Server das Attribut bereits beim Rendern setzt).
 */
export function ThemeToggle({ initial }: { readonly initial: ThemeChoice }) {
  const [choice, setChoice] = useState<ThemeChoice>(initial);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (choice === "system") apply("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [choice]);

  return (
    <div className="flex border border-line-strong" role="radiogroup" aria-label="Farbschema">
      {CHOICES.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={choice === c}
          className={`min-h-[24px] px-2 text-meta tracking-[0.1em] uppercase ${
            choice === c ? "bg-accent text-on-accent" : "text-ink-3 hover:text-ink-1"
          }`}
          onClick={() => {
            setChoice(c);
            persist(c);
            apply(c);
          }}
        >
          {LABEL[c]}
        </button>
      ))}
    </div>
  );
}
