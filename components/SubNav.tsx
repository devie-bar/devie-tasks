"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { findActiveGroup, isActiveHref } from "@/components/PrimaryNav";

/**
 * The active section's pages, as the cream secondary bar beneath the green
 * strip. Renders only when the section has more than one page.
 */
export function SubNav() {
  const pathname = usePathname();
  const group = findActiveGroup(pathname);
  if (!group || group.items.length < 2) return null;
  return (
    <nav className="tk-subnav" aria-label={`${group.label} pages`}>
      <div className="tk-subnav-in">
        {group.items.map((it) => {
          const on = isActiveHref(pathname, it.href);
          return (
            <Link key={it.href} href={it.href} className={"tk-subtab" + (on ? " on" : "")} aria-current={on ? "page" : undefined}>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
