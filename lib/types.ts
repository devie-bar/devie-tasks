// Shapes of the three Tasks tables (see supabase/migrations/20261016_tasks_v1.sql).
// Weekdays are ISO: 1 = Monday ... 7 = Sunday.

export type ListKind = "opening" | "closing" | "other";

export interface TaskList {
  id: string;
  name: string;
  kind: ListKind;
  /** ISO weekdays this list runs on. */
  days: number[];
  sort_order: number;
  active: boolean;
}

export interface TaskItem {
  id: string;
  list_id: string;
  title: string;
  detail: string | null;
  sort_order: number;
  active: boolean;
}

export interface Completion {
  id: string;
  item_id: string;
  /** Service date (Paris, see lib/paris.ts). One completion per item per date. */
  service_date: string;
  done_by: string;
  done_at: string;
  note: string | null;
}

export const DAY_LABELS: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };
export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

/** ISO weekday of a yyyy-mm-dd service date. */
export function isoWeekday(date: string): number {
  const d = new Date(date + "T12:00:00Z").getUTCDay();
  return d === 0 ? 7 : d;
}

/** "Mon to Fri", "Every day", "Mon, Wed, Sat". */
export function daysLabel(days: number[]): string {
  const s = [...days].sort((a, b) => a - b);
  if (s.length === 7) return "Every day";
  if (s.length === 0) return "Never";
  const run = s.length > 2 && s.every((d, i) => i === 0 || d === s[i - 1] + 1);
  if (run) return `${DAY_LABELS[s[0]]} to ${DAY_LABELS[s[s.length - 1]]}`;
  return s.map((d) => DAY_LABELS[d]).join(", ");
}
