"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

/**
 * The Dashboard's own sections, in the green estate strip. DESIGN.md 2.3 + nav:
 * PP Editorial, ultralight, minus-50 tracking, upper case — the one brand nav
 * shared across the estate. Dashboard has only a couple of sections, so they
 * wrap rather than collapse to a control.
 */
export function PrimaryNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    !item.external && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));

  return (
    <nav aria-label="Sections" className="ml-6 flex min-w-0 flex-1 flex-wrap items-stretch gap-x-5 gap-y-1">
      {items.map((item) => {
        const active = isActive(item);
        const cls = `flex h-9 items-center whitespace-nowrap border-b-2 px-1 font-display text-[19px] font-extralight uppercase leading-none tracking-[-0.05em] transition ${
          active ? "border-white text-white" : "border-transparent text-copper-soft hover:text-white"
        }`;
        return item.external ? (
          <a key={item.href} href={item.href} className={cls}>
            {item.label}
          </a>
        ) : (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cls}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
