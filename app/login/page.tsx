"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CALLBACK = "https://tasks.devie.bar/auth/callback";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"email" | "sent">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setVerifying(false);
    if (error) {
      setError(
        error.message.toLowerCase().includes("expired") || error.message.toLowerCase().includes("invalid")
          ? "That code didn't work, check it and try again, or request a new one."
          : error.message
      );
      return;
    }
    window.location.href = "/";
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const addr = email.trim();

    // Gate: only approved staff (by domain) or explicitly-invited partners.
    const { data: allowed, error: gateErr } = await supabase.rpc("is_email_allowed", {
      p_email: addr,
    });
    if (gateErr) {
      setBusy(false);
      setError("Couldn't check access right now, try again in a moment.");
      return;
    }
    if (!allowed) {
      setBusy(false);
      setError("That email isn't set up for access yet. Ask an admin to add you.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { shouldCreateUser: true, emailRedirectTo: CALLBACK },
    });
    setBusy(false);
    if (error) {
      setError(
        error.message.toLowerCase().includes("rate limit")
          ? "Too many emails just now, wait a minute and try again."
          : error.message
      );
      return;
    }
    setStage("sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">De Vie</div>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Tasks</h1>
          <p className="mt-1 text-sm text-ink-muted">Recurring opening and closing checks</p>
        </div>

        <div className="rounded-2xl border border-paper-line bg-paper-card p-6 shadow-sm">
          {stage === "email" ? (
            <form onSubmit={sendLink} className="space-y-4">
              <label className="block text-sm font-medium text-ink-soft">
                Work email
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@devie.bar"
                  className="mt-1 w-full rounded-lg border border-paper-line bg-white px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-soft disabled:opacity-60"
              >
                {busy ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl">✉️</div>
                <p className="mt-1 text-sm text-ink">
                  We&apos;ve emailed <span className="font-medium">{email}</span>.
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Click the sign-in link on <em>this</em> device, or enter the code from the
                  email below, the code works on any device.
                </p>
              </div>

              <form onSubmit={verifyCode} className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="12345678"
                  className="w-full rounded-lg border border-paper-line bg-white px-3 py-2 text-center text-lg tracking-[0.4em] text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
                <button
                  type="submit"
                  disabled={verifying || code.length < 6}
                  className="w-full rounded-lg bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-soft disabled:opacity-60"
                >
                  {verifying ? "Verifying…" : "Verify code"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setStage("email");
                  setCode("");
                  setError(null);
                }}
                className="w-full text-center text-xs text-ink-muted underline"
              >
                Use a different email
              </button>
            </div>
          )}
          {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
        </div>
        <p className="mt-6 text-center text-xs text-ink-muted">
          Access is limited to De Vie staff.
        </p>
      </div>
    </main>
  );
}
