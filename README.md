# De Vie — Dashboard (dashboard.devie.bar)

Live operations hub for De Vie (SAS Smithfield). Standalone Next.js App Router
app matching the finance/library apps: shared Supabase (De Vie Database), magic-
link auth gated to internal staff, PWA-installable.

## KPIs
Period selector + tiles: Sales (hero), Total spend, Cashflow due, Wage %, Food
cost %, Drink cost %. Numbers are deterministic **mock** data behind
`lib/kpi.ts` — swap `getKpiSnapshot` for real feeds (Square, invoices, payroll)
with no UI change. Tiles drill through to finance/schedule/library.

## Auth
`middleware.ts` refreshes the Supabase session and gates access; `(app)/layout`
checks `profiles` for internal role (admin/team). External partners never see
the hub.

## Dev
    npm install
    npm run dev

Env (optional locally; set on Vercel): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` — defaults point at the De Vie Database project.
