# De Vie Dashboard

## Before changing any interface in this repo

Read `DESIGN.md` in this repo first. It is the De Vie Design Standard and it is
identical in every De Vie repo. It defines the colour, type, spacing, radius and
breakpoint tokens, the six shared UI patterns, and a twelve-point checklist to run
before merging a UI change.

Do not introduce a hex value, a breakpoint or a control size that is not in
`DESIGN.md` Part 2. If something genuinely needs a new token, add it to
`DESIGN.md` in every repo rather than only here.

## Where this app stands

Loads no De Vie typeface, same Tailwind config as Finance. As the hub linking to Library, Schedule and Finance it is the app most exposed to inconsistency, and currently the furthest from the house style.

**First fix:** Load the brand fonts, see DESIGN.md Part 4. Then fix the layout viewport: at a 390px device width the page lays out at 598px, so the right-hand third of every card needs horizontal panning.

## Non-negotiables

- No horizontal scrolling without a visible affordance and a sticky first column.
- The value a screen exists for (price, amount, status, commit button) is never the
  thing that scrolls out of view.
- 44px minimum control height below 840px, 32px at and above.
- PP Editorial New is always set at -0.05em letter-spacing.
- Every async view has a timeout, a visible error and a retry.
