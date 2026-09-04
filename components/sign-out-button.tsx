"use client";

import { useState } from "react";

const SIGN_OUT_PATH = "/api/auth/sign-out";

/** Beendet die Session serverseitig und führt zur Anmeldung. */
export function SignOutButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      className="inline-flex min-h-[28px] items-center border border-line-strong px-2 text-meta tracking-[0.1em] text-ink-2 uppercase hover:text-ink-1 disabled:text-ink-off"
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await fetch(SIGN_OUT_PATH, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{}",
          });
        } finally {
          window.location.assign("/login");
        }
      }}
    >
      {pending ? "Abmelden …" : "Abmelden"}
    </button>
  );
}
