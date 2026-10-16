"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { ESTATE } from "@/lib/estate";

/**
 * DESIGN.md pattern 3.7. The same strip sits at the top of every De Vie app:
 * the wordmark, then a switcher listing the whole estate. It is what makes the
 * seven apps read as one product and removes the dead end where an app links
 * to nothing but itself.
 *
 * This component is IDENTICAL in every repo. Do not restyle it in one app.
 */
export function EstateNav({ current, children }: { current: string; children?: ReactNode }) {
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
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="relative" style={{ background: "#025B4C" }}>
      <div className="mx-auto flex min-w-0 max-w-[1100px] items-center gap-3 px-5 py-4">
        {/* The brand book's wordmark, never letterspaced type. Same asset in
            every repo: public/devie-wordmark-white.png. The wordmark is the
            switcher: click it for the whole estate. */}
        <div className="relative" ref={wrap}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={`De Vie apps${here ? `, you are in ${here.label}` : ""}`}
            className="flex items-center gap-2"
          >
            <img
              src="/devie-wordmark-white.png"
              alt=""
              width={96}
              height={20}
              className="block h-9 w-auto"
            />
            <span aria-hidden className="text-xs text-white/70">▾</span>
          </button>

          {open && (
            <div
              role="menu"
              className="absolute left-0 z-50 mt-1 w-72 rounded border border-paper-line bg-paper-card p-1.5 shadow-lg"
            >
              {ESTATE.map((a) => {
                const isHere = a.key === current;
                return (
                  <a
                    key={a.key}
                    href={isHere ? undefined : a.url}
                    role="menuitem"
                    aria-current={isHere ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`block rounded px-3 py-2 ${
                      isHere ? "bg-brand-wash" : "hover:bg-paper-line/60"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink">
                      {a.label}
                      {isHere && <span className="ml-2 text-xs font-medium uppercase tracking-wide text-ink-muted">you are here</span>}
                    </span>
                    <span className="block text-xs text-ink-muted">{a.blurb}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
        {/* An app may put its top-level sections in the strip, to the right of
            the wordmark. Apps that pass nothing are unchanged. */}
        {children}
      </div>
    </div>
  );
}
