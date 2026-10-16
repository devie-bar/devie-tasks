"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTasks } from "@/components/TasksProvider";
import { SignOutButton } from "@/components/SignOutButton";

/**
 * DESIGN.md pattern 3.1. Ported from the Liquid Library's TopNav: the full bar
 * is justified between the wordmark and the account controls and is measured,
 * not a breakpoint. When it does not fit, it becomes one Menu button that drops
 * the whole navigation down. Two-tier: the green bar carries the top-level
 * sections (today only Checks); each section's pages (Today, Manage,
 * History) sit in the cream secondary bar (SubNav).
 */
const NAV_FULL_GAP = 28; // .tk-top-in column gap in full mode

export type NavItem = { href: string; label: string };
export type NavGroup = { key: string; label: string; items: NavItem[] };

export const GROUPS: NavGroup[] = [
  { key: "checks", label: "Checks", items: [
    { href: "/", label: "Today" },
    { href: "/checks", label: "Manage" },
    { href: "/history", label: "History" },
  ] },
];
export const ALL_PAGES: NavItem[] = GROUPS.flatMap((g) => g.items);

export const isActiveHref = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
export const findActiveGroup = (pathname: string): NavGroup =>
  GROUPS.find((g) => g.items.some((it) => isActiveHref(pathname, it.href))) || GROUPS[0];

export function PrimaryNav() {
  const pathname = usePathname();
  const { status } = useTasks();
  const isActive = (href: string) => isActiveHref(pathname, href);
  const isGroupActive = (g: NavGroup) => g.items.some((it) => isActive(it.href));
  const measureRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
  useIso(() => {
    const measure = measureRef.current;
    const host = measure?.parentElement?.parentElement as HTMLElement | null | undefined;
    if (!measure || !host) return;
    const check = () => {
      const st = getComputedStyle(host);
      const inner = host.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight);
      const others = Array.from(host.children).filter(
        (c) => !c.classList.contains("tk-navslot") && getComputedStyle(c).position !== "absolute",
      ) as HTMLElement[];
      const room = inner - others.reduce((w, c) => w + c.offsetWidth, 0) - 2 * NAV_FULL_GAP;
      const next = measure.scrollWidth > room;
      setCompact(next);
      host.classList.toggle("is-compact", next);
      if (!next) setMenuOpen(false);
    };
    check();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }
    const ro = new ResizeObserver(check);
    ro.observe(host);
    ro.observe(measure);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenuOpen(false); btnRef.current?.focus(); } };
    const onDown = (e: MouseEvent) => {
      const panel = document.getElementById("tk-navpanel");
      const t = e.target as Node;
      if (panel && !panel.contains(t) && btnRef.current && !btnRef.current.contains(t)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [menuOpen]);

  return (
    <>
      {compact ? (
        <>
          <button
            ref={btnRef} type="button" className="tk-navbtn tk-navslot" aria-label={menuOpen ? "Close menu" : "Menu"}
            aria-expanded={menuOpen} aria-controls="tk-navpanel" onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="tk-burger" aria-hidden="true"><i /><i /></span>
          </button>
          {menuOpen && (
            <nav id="tk-navpanel" className="tk-navpanel" aria-label="Tasks sections">
              <div className="tk-navpanel-in">
                {ALL_PAGES.map((s) => (
                  <Link
                    key={s.href} href={s.href} className={"tk-navpanel-item" + (isActive(s.href) ? " on" : "")}
                    aria-current={isActive(s.href) ? "page" : undefined} onClick={() => setMenuOpen(false)}
                  >
                    {s.label}
                  </Link>
                ))}
                <div className="tk-navpanel-acct">
                  <span className="tk-st" aria-live="polite">{status}</span>
                  <SignOutButton className="tk-ctl" />
                </div>
              </div>
            </nav>
          )}
        </>
      ) : (
        <nav className="tk-toptabs tk-navslot" aria-label="Tasks sections">
          {GROUPS.map((g) => (
            <Link key={g.key} href={g.items[0].href} className={"tk-tab" + (isGroupActive(g) ? " on" : "")} aria-current={isGroupActive(g) ? "page" : undefined}>
              {g.label}
            </Link>
          ))}
        </nav>
      )}
      <div className="tk-navmeasure" aria-hidden="true">
        <div ref={measureRef} className="tk-toptabs">
          {GROUPS.map((g) => <span key={g.key} className="tk-tab">{g.label}</span>)}
        </div>
      </div>
    </>
  );
}
