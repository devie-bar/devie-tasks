// The De Vie estate. This file is IDENTICAL in every De Vie repo.
// Change it here and copy it to the others, or the switcher stops agreeing
// with itself. See DESIGN.md pattern 3.7.

export type EstateApp = { key: string; label: string; blurb: string; url: string };

export const ESTATE: EstateApp[] = [
  { key: "dashboard", label: "Dashboard", blurb: "Live overview of the whole operation", url: "https://dashboard.devie.bar" },
  { key: "library",   label: "Library",   blurb: "Recipes, house ingredients and costing", url: "https://library.devie.bar" },
  { key: "schedule",  label: "Schedule",  blurb: "Rota, holidays, tips and payroll", url: "https://schedule.devie.bar" },
  { key: "finance",   label: "Finance",   blurb: "Invoice register and cashflow", url: "https://finance.devie.bar" },
  { key: "pitch",     label: "Pitch",     blurb: "Consultancy proposals", url: "https://pitch.devie.bar" },
  { key: "events",    label: "Events",    blurb: "Event enquiries through to invoicing", url: "https://events.devie.bar" },
  { key: "book",      label: "Book",      blurb: "Guest booking for the bar", url: "https://book.devie.bar" },
  { key: "handovers", label: "Handovers", blurb: "Nightly handovers and the maintenance list", url: "https://handovers.devie.bar" },
  { key: "tasks",     label: "Tasks",     blurb: "Recurring opening and closing checks", url: "https://tasks.devie.bar" },
];

export const ESTATE_HOME = "https://dashboard.devie.bar";
