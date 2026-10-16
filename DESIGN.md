# De Vie Design Standard

The shared design rules for every De Vie app: Library, Schedule, Finance, Pitch, Events, Dashboard, Book, and anything built after them.

Version 1.0, 3 September 2026.

---

## How to use this file

Read it before changing any interface in this repo. It is the same file in every De Vie repo, so a rule agreed here applies everywhere.

**Authority order.** When two sources disagree, the higher one wins.

1. The De Vie brand book (typography, logo, colour range)
2. This file
3. WCAG 2.2 AA
4. Framework defaults (Tailwind, Next.js, whatever the repo uses)

Each app is highly specialised. None of them is visually independent. A person moving from the rota to the recipe archive to the invoice register should not have to re-learn where anything lives or notice that the paper colour changed.

---

# Part 1. Principles

Ten rules. Each has a reason and a test, because a principle you cannot test is a preference.

### 1. Content forms the layout, surfaces mark emphasis

Group things with white space and alignment first. A border, fill, shadow or radius says "this is a separate object", so spending one on every block flattens the hierarchy instead of building it.

*Test:* count the bordered containers on the screen. If more than one competes for attention, or if a container holds only a row of controls, remove it and use spacing.

### 2. The value is never the thing that scrolls away

Layouts get built identity-first and value-last, so when space runs out the number falls off the right edge. Prices, amounts, statuses and commit buttons are the reason the screen exists.

*Test:* at 390px, is the number a person opened this screen for visible without scrolling sideways? If not, the layout is wrong, not the screen size.

### 3. No horizontal scrolling without an affordance

WCAG 1.4.10 allows a data table to scroll in two dimensions. It does not allow the surrounding page, and it never permits hiding content with no indication it exists. A scroller with no scrollbar, fade or arrow is invisible, and invisible is worse than absent.

*Test:* `document.documentElement.scrollWidth === window.innerWidth` at 320, 390, 600 and 840. Any deliberate inner scroller has a visible edge fade and a sticky first column.

### 4. Reflow to 320px

Everything except genuinely two-dimensional content works at 320 CSS pixels wide with vertical scrolling only. Headings, filters, search and pagination reflow even when the table beside them does not.

*Test:* WCAG 2.2 SC 1.4.10, checked at 320px.

### 5. Controls are sized for the finger that will use them

Half this estate is used standing up, on a phone, mid-service.

*Test:* below 840px, every interactive element is at least 44 x 44 CSS px. At and above 840px, at least 32px high with a 24 x 24 hit area and 8px of clear space, which satisfies WCAG 2.2 SC 2.5.8.

### 6. Every asynchronous view can fail out loud

A spinner with no timeout is a dead end. Every fetch has a timeout, a visible error that says what went wrong, and a retry.

*Test:* open the view in a cold browser session with no warm client store. It must resolve or explain itself within 10 seconds.

### 7. Every view a person would return to has a URL

If someone might bookmark it, send it to Barney, or hit back, it is addressable. Section, sub-tab, filter and record all live in the URL.

*Test:* copy the address bar, open it in a private window, land in the same place.

### 8. One header, one navigation pattern, one shell

The header does not change between routes within an app, and the navigation behaves the same way in every app.

*Test:* screenshot the header on a list route and a record route. They match.

### 9. Empty is a line, not a box

An empty state occupies the space of its message, never a reserved container. Placeholders for unbuilt features are text, not cards styled like finished work.

The states allowed more room are the two that carry controls: first run, where
the call to action is the point of the screen, and no results, where the query
echo and the clear controls are (3.3). Even then it is text and buttons, not an
illustrated panel.

The cap applies to the **fixed** parts: heading, sentence, actions. A list of
active filter chips wraps and is measured separately, because a person with five
filters would otherwise fail a rule they cannot see.

*Test:* an empty section is under 80px tall, or its fixed parts are under 240px
if it carries controls. Measured at 390px, the narrowest real width.

### 10. Say the specific thing

Buttons name the action that happens. Errors say what went wrong and how to fix it. Empty states say which of "nothing yet", "nothing matches your filter" and "not loaded" is true, and offer the action that changes it.

**Casing (Alex, Sept 2026). Two rules, no exceptions:**

- **Primary navigation is fully UPPER CASE.** The top-line sections (DASHBOARD, BAR, KITCHEN...), the MENU button and every item in its panel, the hover menus under the top line, and the EN/FR toggle. Set with `text-transform: uppercase`, in PP Editorial (2.3).
- **Every other button is Title Case**, every word capitalized: secondary buttons, actions, toggles and segmented controls ("Copy As Text", "New Version", "Push To Square", "Card View"). Never ALL CAPS and never plain sentence case.

Write labels normally in the source (`Copy as text`) and apply the case in CSS (`text-transform: capitalize` or `uppercase`) rather than hand-casing every string, so a label typed in lowercase still renders correctly.

*Test:* read the string alone, with no surrounding screen. Does it still tell you something?

---

# Part 2. Tokens

These are the values. Copy them into the repo verbatim. Do not invent near-misses.

## 2.1 Colour

The base set is already live and identical in `devie-archive`, `devie-pitch-builder` and `devie-events-builder`. That is the house set.

```css
:root {
  /* Brand, from the brand book's eight colours */
  --dv-green:        #025B4C;  /* brand 2/91/76, primary structural colour */
  --dv-green-2:      #0B7A63;  /* hover, focus rings */
  --dv-green-soft:   #71C3C4;  /* brand 113/195/196, accents on dark */
  --dv-copper:       #E16000;  /* brand 225/96/0, primary action fill */
  --dv-copper-deep:  #B24700;  /* copper as TEXT, see 2.2 */
  --dv-copper-soft:  #F0B37A;  /* kickers on green ground */

  /* Neutrals */
  --dv-paper:        #FBFBF8;  /* page ground, the only one */
  --dv-surface:      #FFFFFF;  /* raised surface */
  --dv-ink:          #17201D;
  --dv-ink-soft:     #5C6B66;
  --dv-line:         #E6E8E2;
  --dv-wash:         #F4F1EC;  /* hover states, expanded rows, table striping (3.6) */
  --dv-skeleton:     #EFF0EC;  /* skeleton fill on --dv-surface, see 3.5 */
  --dv-skeleton-high:#F7F8F5;  /* skeleton sweep highlight */

  /* Semantic. Adopted from schedule-devie, the best-built set in the estate. */
  --dv-good:         #1E7A57;  --dv-good-tint:   #E5F2EC;  --dv-good-line:   #BFE0CD;
  --dv-warn:         #A9781A;  --dv-warn-tint:   #F6ECCF;  --dv-warn-line:   #E3D3AD;
  --dv-danger:       #C0392B;  --dv-danger-tint: #F7E1DE;  --dv-danger-line: #E0B8B2;
  --dv-info:         #1D5FA8;  --dv-info-tint:   #E6EEFA;  --dv-info-line:   #C2D5F0;
}
```

**Retired.** These are in the estate today and must be removed as each app is touched:

| Value | Where | Replace with |
|---|---|---|
| `#1B5E7D` steel blue | Schedule accent | `--dv-green` |
| `#7C5A3A` brown | Finance, Dashboard brand | `--dv-green`. It is the primary structural colour and is paired with white text, which is 8.0:1. Copper is registered separately as the action and rule colour. |
| `#1D3D30` green | Book | `--dv-green` |
| `#F6F4EF`, `#F7F4EF`, `#FBF9F5` papers | Schedule, Finance, Dashboard, Book | `--dv-paper` |
| `#C98A2B` amber, `#8D9E3A` chartreuse | Book | `--dv-warn`, `--dv-good` |

Semantic colour is separate from the accent. Green and copper never mean "good" or "warning".

## 2.2 Colour and contrast rules

Measured against WCAG 2.2 AA, which needs 4.5:1 for body text, 3:1 for large text and for the boundary of any interactive component.

- **Copper is a fill, not a text colour.** `#E16000` on paper is 3.6:1 and fails for body text. Use `--dv-copper-deep` `#B24700` for copper-coloured text, which is 5.2:1 on paper.
- **On a copper fill, use ink.** `--dv-ink` on `--dv-copper` is 4.65:1 and passes. White on copper is 3.6:1, so it is allowed only at 18px semibold or larger.
- **On a green fill, use white.** `#FFFFFF` on `--dv-green` is 8.0:1.
- Never rely on colour alone. A status is a word plus a colour, never only a dot.

## 2.3 Type

Both faces are already in `devie-archive/public/fonts` as woff2. Copy them, do not re-source them.

```css
--dv-display: "PP Editorial New", Cambria, "Hoefler Text", Georgia, serif;
--dv-ui:      "Epilogue", "Segoe UI", system-ui, -apple-system, sans-serif;
```

**House rules from the brand book: PP Editorial is always set at minus 50 tracking, and its default weight is Ultralight.** Use another weight only where one is expressly chosen, and say why beside it.

```css
h1, h2, h3, .display { font-family: var(--dv-display); letter-spacing: -0.05em; font-weight: 200; }
```

Set the weight explicitly on every rule that uses the display face. A heading with no weight inherits the browser's bold, which resolves to the Ultrabold file: that is how the Library's card titles ended up far heavier than intended.

All three weights ship in `public/fonts`: Ultralight (200), Regular (400) and Ultrabold (700), each with an italic. The Library applies this as of September 2026; the one deliberate exception there is the printed card sheet, which keeps 700 because a hairline weight breaks up on an office laser printer.

| Role | Face | Size / line-height | Notes |
|---|---|---|---|
| Display XL | Display | 40 / 1.05 | page title, one per page |
| Display L | Display | 32 / 1.10 | |
| Display M | Display | 26 / 1.15 | section heading |
| Display S | Display | 21 / 1.20 | card or panel heading |
| Body L | UI | 17 / 1.55 | lede |
| Body | UI | 15 / 1.55 | default |
| Body S | UI | 13.5 / 1.50 | table cells, dense lists |
| Caption | UI | 12 / 1.45 | secondary detail |
| Label | UI | 11 / 1.40 | uppercase, letter-spacing 0.12em, weight 600 |

- Nothing below 12px, ever. Apple's floor is 11pt and this estate is read in low light.
- Running text stays near 65 characters. Set `max-width: 70ch` on prose.
- Any column of digits gets `font-variant-numeric: tabular-nums`.

## 2.4 Spacing

One 4px scale. No arbitrary values.

```
4  8  12  16  24  32  48  64
```

Page gutters: 16px below 600, 24px from 600 to 839, 32px at 840 and above.

Vertical rhythm between sections: 32 below 840, 48 above. Between a heading and its content: 12. Inside a control: 10 vertical, 16 horizontal.

## 2.5 Radius, border and elevation

```css
--dv-radius-control: 10px;  /* buttons, inputs, selects, toggles (Alex, Sept 2026) */
--dv-radius-chip:    2px;   /* chips and tags */
--dv-radius-module: 12px;   /* cards, boxes, panels, modals (Alex, Sept 2026: 4px read as too subtle) */
--dv-radius-inner:   8px;   /* boxes nested inside a module, popovers, toasts */
--dv-radius-media:   8px;   /* images, video, map tiles */
--dv-radius-guest:  16px;   /* book.devie.bar hero surfaces only */
--dv-shadow-overlay: 0 6px 20px rgba(2, 91, 76, .07);
```

- One border weight: 1px `--dv-line`.
- Shadow is for things that float above the page: modals, sheets, popovers, sticky bars. Never on a static card. A static card that needs separating gets a hairline or nothing.
- Modules use `--dv-radius-module` and anything nested inside one uses `--dv-radius-inner`, so the inner corner never looks sharper than the outer. The selected option inside a segmented control takes `--dv-radius-inner` for the same reason. In the Library these are `--r-module`, `--r-inner` and `--r-control`.
- The old 10px and 14px radii in Schedule and Book move to these two tokens, except Book's guest-facing hero surfaces which may keep `--dv-radius-guest`.

## 2.6 Breakpoints

Three values, aligned to the Material 3 window size classes so the same device gets the same treatment as it does in every other product a person uses.

| Name | Range | Layout |
|---|---|---|
| Compact | < 600 | one column, one pane |
| Medium | 600 to 839 | one column with a wider gutter, or two panes if both fit honestly |
| Expanded | 840 to 1199 | two panes |
| Large | 1200 and up | two or three panes, content capped at 1280 |

```css
/* new work: mobile first */
@media (min-width: 600px)  { }
@media (min-width: 840px)  { }
@media (min-width: 1200px) { }
```

Existing max-width code should consolidate onto `599.98px`, `839.98px`, `1199.98px` until it is refactored. The estate currently uses nine different breakpoints in two opposite directions, which is why an iPad gets a different layout in every app.

## 2.7 Controls

| Context | Minimum height | Minimum hit area | Gap between targets |
|---|---|---|---|
| Below 840 | 44px | 44 x 44 | 8px |
| 840 and above | 32px | 24 x 24 | 8px |
| Table row action | 32px | 24 x 24 | 8px |

Focus is always visible: `outline: 2px solid var(--dv-green-2); outline-offset: 2px`. Never `outline: none` without a replacement.

## 2.8 Motion

150ms ease-out for state changes, 200ms for overlays entering. Nothing animates on load. Always honour `prefers-reduced-motion: reduce`.

**Toggles swipe.** Every control that swaps one view for another (a section's own tabs, Card/List, Single/Batch, ALC/DGS, By item/By category and so on) slides the content horizontally: pick an option to the right and the new view comes in from the right, pick one to the left and it comes in from the left. 750ms, `cubic-bezier(.65,0,.35,1)`, the box easing between the two heights. Use the `SlideSwap` component in the Library (`index` = the selected option's position) rather than writing a new animation. Moving between top-level sections does not swipe, and filters that narrow a list rather than swap a view (multi-select chips, Any/All) do not either.

## 2.9 The logo

The brand book gives three lockups: the simple logo for use with visuals, the
mixe logo when it appears alone, and the DV monogram. Never change its colour,
distort it, outline it, or change its line thickness.

**Never set "De Vie" as letterspaced uppercase type in place of the logo.** It
is not a near-miss, it is the wrong asset. Use the wordmark file.

```
public/devie-wordmark-white.png   on a green or dark ground
public/devie-wordmark-green.png   on paper
```

Both live in `devie-archive/public` and are copied into each repo. In the
estate strip the white wordmark sits at `h-5` (20px) with `width:auto`.

---

# Part 3. Patterns

Eight patterns that already exist somewhere in the estate and work. Use these rather than inventing.

### 3.1 Navigation

**Reference: Finance at phone width.**

When the full navigation does not fit, it collapses to a single button: two lines that rotate into a cross while the panel is open (`aria-label` Menu / Close menu), which drops the whole navigation down. The language toggle is hidden in that collapsed header and the icon sits flush right. The button says what it does, not where you are; the open panel marks the current page. The panel lists top-level sections only: sub-sections are reached from the section's own tab row once you are there, which suits a touchscreen better than a nested column. At 840 and above, either the same dropdown or grouped menus, never a flat row of more than eight items.

Every label in the primary navigation (the bar, the Menu button and its panel, the hover menus) is fully upper case; see principle 10.

The full bar is justified: it fills the space between the wordmark and the language toggle, first section flush left, last flush right, the rest spread evenly. The hover menus under it are justified the same way. Collapsed, the Menu button sits on the true centre of the header.

Secondary navigation (a section's own tabs, such as Cocktails / House Ingredients / Raw Materials) spans the full width below 840px, justified: first tab flush left, last flush right, the rest spread evenly. If it does not fit on one row it splits into two justified rows of equal count (the first row takes the extra one). In the Library this is the `SubNav` component.

A horizontally scrolling nav row is banned. It currently hides 4 of 20 destinations in Finance at 1512px, 11 of 20 at 834px, and 7 of 11 in Schedule at 390px.

### 3.2 Dense data

**Reference: Schedule's rota at phone width.**

Below 840px, a table becomes a grouped list. A heading for each group, then two-line rows: identity on the first line, the value right-aligned and bold on the second. No card per row.

At 840 and above, a real table, with the value column last and always visible. If it must scroll, the first column is sticky and the scrolling edge is marked with a fade.

### 3.3 Empty state

Height follows content. One sentence saying which kind of empty this is, then the action that changes it. An empty pipeline stage is a heading and a zero, not a 200px box.

There are three kinds of empty and they are never allowed to share a string.
Picking the wrong one is the single most common way a working app reads as
broken.

```
first run     the person has never created anything here
no results    a query or filter ran and returned nothing
not loaded    the fetch failed, or has not happened yet
```

**First run.** This is the only empty state that gets a call to action, because
it is the only one where the person's next move is to create something. Say
what the space is for in one line, then the button. The button names the object,
not the verb in the abstract: "Create your first drink", never "Add" or
"Get started". A person landing on an empty personal space should be able to
tell what it is for without leaving it.

```
You have not saved any drinks yet. Your space is where your own
recipes live before they go to the team.

[ Create your first drink ]
```

Height stays under 240px including the button. No illustration, no card, no
dashed border box. Measured in the Library at 390px: 183px.

**No results.** The distinguishing job is to prove the query ran. Echo the query
back in quotation marks, name any filters still in force, and offer the control
that clears them. Never show a create button here: the person is looking for
something that exists, and offering to make a new one reads as though the search
was not understood.

```
No drinks match "mezcal clarified".
Filters: Spirit-forward, In season.

[ Clear search ]  [ Clear filters ]
```

If a filter is the likely cause, say so. Zero results with three filters active
is a filter problem, not a search problem.

Same 240px cap on the fixed parts, with the filter chips measured separately.
Measured in the Library at 390px: 183px with a query alone, 246px with two filter
chips wrapping onto their own line, which is within the rule.

**Not loaded.** Covered by 3.5. It is an error, not an empty state, and it says
what failed.

### 3.4 Commit actions

Save, Publish, Submit and Delete are always inside the viewport. Below 840px they live in a sticky bar at the bottom of the screen. They are never inside a horizontally scrolling region, and never below a fold that a person has to find.

### 3.5 Loading and error

```
loading  -> skeleton, with a 10 second timeout
error    -> what failed, in a sentence, plus Retry
empty    -> which empty (3.3), plus the action if there is one
```

No view ships with only the first of these.

**Skeletons, not spinners.** A spinner says "something is happening". A skeleton
says "a list of eight rows is arriving, and the price sits on the right". The
second is worth more, and it stops the layout jumping when content lands. Use a
labelled spinner only where the shape of the result genuinely is not knowable in
advance.

A skeleton must match the real thing it is standing in for. Same row height,
same column positions, same number of rows as the page normally shows. A
skeleton that is one size and content that is another is worse than no skeleton,
because the page visibly reflows at the exact moment the person starts reading.

**Timing is the whole pattern.** A skeleton that flashes for 80ms on a cached
load reads as jank. Two rules, both required:

```
delay    200ms   nothing renders before this; fast loads show no skeleton at all
floor    400ms   once shown, it stays at least this long
```

So a 150ms load shows nothing. A 250ms load shows a skeleton for 400ms. A 3s
load shows a skeleton for 3s. The floor is what stops the flicker, and it is the
half people forget.

**Fill and motion.**

```css
--dv-skeleton:      #EFF0EC;   /* on --dv-surface */
--dv-skeleton-high: #F7F8F5;   /* the sweep highlight */
```

The fill is a flat `--dv-skeleton` block at the element's real radius. A single
1.4s sweep left to right is permitted and nothing else: no pulse, no opacity
breathing, no shimmer on more than one axis. Under
`prefers-reduced-motion: reduce` the sweep is removed and the flat fill stays.
This is the one exception to 2.8's "nothing animates on load", and it is
deliberate: the movement is what distinguishes a skeleton from a broken render.

**Accessibility.** The skeleton container carries `aria-busy="true"` and
`aria-live="polite"` with a visually hidden "Loading" label. Skeleton blocks
themselves are `aria-hidden`. A screen reader should hear "Loading", then the
content, and never hear eight empty rows.

**Never skeleton.** Anything already on screen. Re-sorting a loaded table, or
paginating within data you already hold, does not get a skeleton, because
replacing real content with grey blocks is a step backwards. Those get the
existing rows dimmed to 60% with the control disabled.

### 3.6 Table striping

Any table of three or more rows — a real `<table>` or a flex/grid row list standing in for one — alternates a faint tint on every other row so a wide row stays legible across without the eye losing its place.

```css
tr:nth-child(even), .row:nth-of-type(even) { background: var(--dv-wash, #F4F1EC); }
```

`--dv-wash` is the same faint neutral already used for hover states (row hover, chip hover, expanded-breakdown backgrounds) — striping reuses it rather than adding a second grey. A striped row keeps the same 1px `--dv-line` bottom border as an unstriped one; the tint is the only thing that changes.

*Rule:* apply to `.dv-table`-equivalent components and any custom row list with three or more rows. Skip it on a two-row table (nothing to alternate) and on rows that are already selected/hovered/flagged with their own background — a state colour always wins over the stripe.

### 3.7 Page header

One component per app, on every route: wordmark, section name, language toggle where the app has one, account menu. It does not lose controls on record routes.


### 3.8 Moving between apps

**Reference: `EstateNav`, identical in every repo.**

Every De Vie app carries the same strip at the very top: the wordmark, then a
switcher listing the whole estate with a line on what each app is for. The app
you are in is marked, not linked.

The registry lives in `lib/estate.ts` and is byte-identical in every repo.
Change it in one place and copy it to the others.

```
Dashboard   Live overview of the whole operation
Library     Recipes, house ingredients and costing
Schedule    Rota, holidays, tips and payroll
Finance     Invoice register and cashflow
Pitch       Consultancy proposals
Events      Event enquiries through to invoicing
Book        Guest booking for the bar
```

The Dashboard is the estate's front door and also lists all seven as a plain
list, so there is one page anyone can be pointed at. The switcher does the
daily work; the page is for someone new.

An app's own sections sit below the strip and never mix with cross-app links.
Before this, Events linked only to Pitch, the Library linked to nothing, and
the Dashboard linked to three of six.

---

# Part 4. Where each app stands

Current state as measured on 3 September 2026, and what each needs. Full findings in the estate audit.

| App | Repo | Family | First fix |
|---|---|---|---|
| Library | `devie-archive` | House set, correct | Unit cost is off-screen in list view at every width. Adopt pattern 3.2 |
| Pitch | `devie-pitch-builder` | House set, correct | Empty stages reserve full-height cards. Adopt pattern 3.3 |
| Events | `devie-events-builder` | House set, correct | Same as Pitch, plus three empty stages fill the first phone screen |
| Schedule | `schedule-devie` | Right faces, wrong palette | Rota cannot be published at 834px. Adopt pattern 3.4, then re-map the accent |
| Finance | `devie-finance` | House tokens, brand faces loaded | Twenty destinations are grouped into five: Overview, Invoices, Cash & tax, People, Planning. The grouping lives in `lib/nav-links.ts` |
| Dashboard | `devie-dashboard` | No brand faces | Load the fonts, then fix the 598px layout viewport at 390px |
| Book | `devie-book` | Own system, best responsive behaviour | Pull green, paper and body face onto the tokens. Keep the radius and imagery |

**Loading the fonts in Finance and Dashboard.** The woff2 files are in `devie-archive/public/fonts`. Copy them to `public/fonts` in each repo, add the `@font-face` block from `devie-archive/app/globals.css`, then in `tailwind.config.ts` replace:

```ts
fontFamily: {
  sans: ["ui-sans-serif", "system-ui", ...],
}
```

with:

```ts
fontFamily: {
  sans:    ["Epilogue", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
  display: ["PP Editorial New", "Cambria", "Hoefler Text", "Georgia", "serif"],
}
```

Two apps move into the house style for the cost of one commit each.

---

# Part 5. Before you merge

Run this on any UI change. It is fifteen checks and takes about five minutes.

- [ ] `scrollWidth === innerWidth` at 320, 390, 600, 840 and 1200
- [ ] Every horizontal scroller has a visible edge and a sticky first column
- [ ] The screen's key value is visible at 390px without sideways scrolling
- [ ] No interactive element under 44px below 840, or under 32px above it
- [ ] Body text 15px, nothing below 12px
- [ ] Text contrast 4.5:1, component boundaries 3:1
- [ ] Focus visible on every control, keyboard reaches everything
- [ ] Only tokens from Part 2. No new hex values, no new breakpoints
- [ ] PP Editorial set at -0.05em wherever it appears
- [ ] Async views have a timeout, an error and a retry
- [ ] Loading is a skeleton matching the real layout, 200ms delay and 400ms floor
- [ ] The view has a URL that survives a private-window paste
- [ ] Empty states are a line, not a box, and name which of the three they are
- [ ] A zero-result search echoes the query and offers to clear it
- [ ] No emoji used as an icon, no decorative gradient or glow
- [ ] The accent rule appears once on the screen, not on every block
- [ ] Every status colour carries a word

---

# Part 6. Tells

A short list of the things that make an interface look like it was generated
rather than designed. Most of them are the same mistake: a visual device applied
uniformly instead of spent where it means something.

Each one is followed by what this estate actually does today.

### 1. A container around everything

The most common tell. Content gets wrapped in a card, then that card sits in a
panel, then the panel sits in a section. Nesting adds visual weight without
adding hierarchy.

*Here:* Finance wraps a plain six-button period selector in its own bordered
card. Pitch and Events wrap empty pipeline stages in 200px cards.

*Rule:* Principle 1. Group with white space. A surface has to earn its place.

### 2. The same accent bar on every block

A coloured rule at the top of one card says "start here". The same rule on
fourteen cards says nothing, and reads as decoration.

*Here:* the Library puts a copper top rule on every card on the dashboard and
every card in the Bar grid.

*Rule:* the copper rule marks the one item that needs emphasis on a screen. If
every block has it, none of them do.

### 3. Uniform padding and one radius everywhere

Real hierarchy comes from varying the spacing according to how related two things
are. When everything has the same 24px padding and the same 8px radius, the
interface flattens.

*Rule:* the 4px scale in Part 2.4, used deliberately. Tight (8) inside a group,
medium (24) between groups, generous (48) around the primary action. Radius by
role, per Part 2.5, not one value stamped on everything.

### 4. Emoji standing in for an icon set

An emoji in the interface is a decision that was skipped. It also renders
differently on every platform, so it is not even consistent with itself.

*Here:* Finance uses an envelope emoji on its sign-in screen and a warning emoji
in its filter row.

*Rule:* no emoji in the interface. One icon set per app, and if there is no icon,
use a word.

### 5. Status dots that do not mean a status

A coloured circle with no label is not information, it is a texture.

*Here:* Schedule's rota uses colour to identify a person, which is legitimate and
carries a name beside it. That is the version to keep.

*Rule:* every indicator maps to a defined state and carries a word. Colour is
never the only signal, which is also a WCAG requirement.

### 6. The framework default typeface

Inter, or the system sans, is what an interface wears when nobody chose
anything.

*Here:* Finance and Dashboard both ran on `ui-sans-serif` until this branch.

*Rule:* Epilogue and PP Editorial New, per Part 2.3. The brand book already made
this decision.

### 7. Gradients, glows and blurs as decoration

Purple-to-blue gradient headers, radial glows on dark backgrounds and frosted
blur panels are the current house style of generated interfaces.

*Here:* none of them, and that is worth protecting.

*Rule:* one shadow token, used only on things that genuinely float. No gradient
unless it is carrying data, as in a chart.

### 8. Placeholder content dressed as finished work

*Here:* the Dashboard's six PLANNED cards, styled identically to the live
metrics, so the front door of the estate reads as mostly unbuilt.

*Rule:* a roadmap is a line of text.

### 9. Big number tiles by default

A row of large figures is right when the figures are the point of the screen and
wrong when it is just the easiest layout to reach for.

*Here:* Finance's payables row and the Dashboard's metrics both earn it. The
Library's dashboard cards are descriptions, not numbers, and should not look like
KPI tiles.

*Rule:* lead with a number only when someone came to the screen for that number.

### 10. Type standing in for the logo

Setting the company name as letterspaced capitals is what an interface does
when nobody wired up the asset. It also drifts: the tracking, weight and case
end up slightly different in every app.

*Here:* the estate strip shipped with "DE VIE" as type before this was caught.

*Rule:* 2.9. The wordmark is a file.

### 11. Everything centred

Centred headings, centred cards, centred empty states. Left alignment gives the
eye a consistent starting edge and is easier to scan.

*Rule:* left align by default. Centre only short, genuinely standalone content
such as a sign-in card.


---

# Sources

- De Vie brand book: typography, logo lockups, eight-colour range
- WCAG 2.2, W3C: SC 1.4.3 Contrast, 1.4.10 Reflow, 1.4.11 Non-text Contrast, 2.4.11 Focus Not Obscured, 2.5.8 Target Size (Minimum)
- Apple Human Interface Guidelines: 44 x 44 pt minimum control, 11pt text floor
- Material 3 and Android window size classes: the 600 / 840 / 1200 breakpoints
- Nielsen Norman Group: data tables and mobile tables
- Refactoring UI: hierarchy by weight and colour rather than borders
- Zander Whitehurst: content layouts over container layouts, which is principle 1
- The Fountain Institute, signs of a vibe-coded UI, and thecrit.co's vibe-coding design guide: Part 6
- Hayden Schmitty, on making a generated UI not look generated: Part 6

---

## Working on these repos through Claude

Claude reaches these folders through a bridge that cannot delete files. Git
needs deletes to switch branches, so `git checkout`, `merge`, `clean` and
`stash` are unreliable from that side and will leave stale `.git/*.lock` files
and half-switched working trees.

The rule: Claude commits on the current branch and stops there. Branch
switching, merging and pushing happen in your own terminal.

---

*Changes to this file are changes to every De Vie app. Discuss before editing.*
---

## Layout width — estate standard (1100px)

Every app holds to one content width so it reads identically on iPad landscape and laptop. This supersedes the earlier "content capped at 1280" guidance.

- **Max-width: 1100px**, centred, with an **18px side gutter**.
- Coloured bars (primary nav, any sub-nav) are **full-bleed** — the background spans the viewport — but their **content is centred at 1100px**, so the logo and tabs line up with the page content below.
- **Data-dense tools** (schedule, library, dashboard, finance, socials, handovers) cap every page at 1100px. A genuinely wide view — e.g. the rota's week grid — **scrolls horizontally inside the 1100px frame** rather than widening the page.
- **Reading-first apps** (pitch proposals, guest booking) may sit narrower where a shorter line keeps prose readable; they never exceed 1100px.
- In Tailwind apps use `max-w-[1100px]`; in CSS apps set `max-width:1100px;margin:0 auto` on the main wrapper and the nav inner container.
