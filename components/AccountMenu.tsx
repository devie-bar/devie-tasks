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
 * Account menu, top right of the green strip. Same pattern as schedule.devie.bar:
 * initials avatar, name and caret; opens to who is signed in plus Sign out.
 */
export function AccountMenu({ name, email }: { name: string; email?: string | null }) {
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
    <div className="tk-um" ref={ref}>
      <button type="button" className="tk-um-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <span className="tk-um-av" aria-hidden>{initials || "·"}</span>
        <span className="tk-um-nm">{name}</span>
        <span className="tk-um-cx" aria-hidden>▾</span>
      </button>
      {open && (
        <div className="tk-um-pop" role="menu">
          <div className="tk-um-hd"><b>{name}</b>{email && <span>{email}</span>}</div>
          <button type="button" className="tk-um-item tk-um-row" role="menuitemcheckbox" aria-checked={dark} onClick={toggleTheme}>
            <span>Dark mode</span>
            <span className={"tk-um-sw" + (dark ? " on" : "")}><i /></span>
          </button>
          <div className="tk-um-sep" />
          <button type="button" className="tk-um-item" role="menuitem" onClick={signOut}>Sign out</button>
        </div>
      )}
    </div>
  );
}
