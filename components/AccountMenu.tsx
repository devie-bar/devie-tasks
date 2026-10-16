"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.getAttribute("data-theme") === "dark"); }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    const el = document.documentElement;
    if (next) el.setAttribute("data-theme", "dark"); else el.removeAttribute("data-theme");
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };
  return [dark, toggle] as const;
}

/**
 * Account menu, top right of the header. Same pattern as schedule.devie.bar:
 * initials avatar, name, role and caret; opens to who is signed in plus Sign out.
 */
export function AccountMenu({ name, role, email }: { name: string; role?: string | null; email?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [dark, toggleTheme] = useTheme();
  const initials = name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 items-center gap-2 rounded border border-paper-line bg-paper-card py-0 pl-1.5 pr-3 text-[13px] text-ink transition hover:border-brand"
      >
        <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-copper text-[11px] font-bold text-ink">
          {initials || "·"}
        </span>
        <span className="max-w-[160px] truncate">{name}</span>
        {role && <span className="hidden text-[11px] capitalize text-ink-muted min-[1200px]:inline">{role}</span>}
        <span aria-hidden className="text-[11px] text-ink-muted">▾</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-40 min-w-[224px] rounded border border-paper-line bg-paper-card p-2 shadow-lg">
          <div className="mb-1.5 border-b border-paper-line px-2.5 pb-2.5 pt-2">
            <b className="block text-[13.5px] text-ink">{name}</b>
            {(role || email) && (
              <span className="block truncate text-[11px] text-ink-muted">
                {[role && role.charAt(0).toUpperCase() + role.slice(1), email].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={dark}
            onClick={toggleTheme}
            className="flex h-8 w-full items-center justify-between rounded px-2.5 text-left text-[13px] text-ink hover:bg-paper-line/60"
          >
            <span>Dark mode</span>
            <span className={`relative h-[22px] w-[38px] shrink-0 rounded-full border transition-colors ${dark ? "border-brand-soft bg-brand-soft" : "border-ink-soft bg-paper-line"}`}>
              <i className={`absolute top-[2px] h-4 w-4 rounded-full bg-white transition-all ${dark ? "left-[18px]" : "left-[2px]"}`} />
            </span>
          </button>
          <div className="my-1.5 h-px bg-paper-line" />
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex h-8 w-full items-center rounded px-2.5 text-left text-[13px] text-danger hover:bg-paper-line/60"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
