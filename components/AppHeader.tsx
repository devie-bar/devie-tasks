"use client";

import { useEffect, useRef, useState } from "react";
import { ESTATE } from "@/lib/estate";
import { HeaderWho } from "@/components/HeaderWho";
import { PrimaryNav } from "@/components/PrimaryNav";
import { SubNav } from "@/components/SubNav";

/**
 * The one green strip (DESIGN.md 3.1, 3.7, 3.8): wordmark and estate switcher on the
 * left, the app's own sections justified across the middle, account controls on the
 * right. Sticky. The switcher is EstateNav's, moved into the strip so there is a
 * single bar; EstateNav.tsx is left byte-identical to the other repos and is no
 * longer rendered here.
 */
export function AppHeader({ current, name, email }: { current: string; name: string; email?: string | null }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const here = ESTATE.find((a) => a.key === current);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);

  return (
    <>
    <header className="tk-top">
      <div className="tk-top-in">
        <div className="tk-brandrow">
          <div className="relative" ref={wrap}>
            <button
              type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
              aria-label={`De Vie apps${here ? `, you are in ${here.label}` : ""}`}
              className="tk-brand tk-brandbtn"
            >
              <img src="/devie-wordmark-white.png" alt="" className="tk-logo" />
              <span aria-hidden className="tk-switch-caret">▾</span>
            </button>
            {open && (
              <div role="menu" className="absolute left-0 z-50 mt-1 w-72 rounded border border-paper-line bg-paper-card p-1.5 shadow-lg">
                {ESTATE.map((a) => {
                  const isHere = a.key === current;
                  return (
                    <a
                      key={a.key} href={isHere ? undefined : a.url} role="menuitem" aria-current={isHere ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`block rounded px-3 py-2 ${isHere ? "bg-brand-wash" : "hover:bg-paper-line/60"}`}
                    >
                      <span className="block text-sm font-semibold text-ink">
                        {a.label}
                        {isHere && <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-ink-muted">you are here</span>}
                      </span>
                      <span className="block text-xs text-ink-muted">{a.blurb}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <PrimaryNav />
        <HeaderWho name={name} email={email} />
      </div>
    </header>
    <SubNav />
    </>
  );
}
