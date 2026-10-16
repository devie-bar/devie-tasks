// Service dates and service windows are Paris time, whatever the device clock says.
const TZ = "Europe/Paris";

function parts(ts: number) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(ts));
  const g = (t: string) => Number(f.find((p) => p.type === t)?.value);
  return { y: g("year"), m: g("month"), d: g("day"), h: g("hour"), mi: g("minute"), s: g("second") };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Today's service date: today in Paris, or yesterday before 06:00. */
export function serviceDateNow(now: Date = new Date()): string {
  const p = parts(now.getTime());
  const base = Date.UTC(p.y, p.m - 1, p.d - (p.h < 6 ? 1 : 0));
  const d = new Date(base);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function offsetMs(ts: number): number {
  const p = parts(ts);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ts / 1000) * 1000;
}

/** The instant at which the Paris wall clock reads y-m-d h:00. Day overflow is allowed (d + 1). */
export function parisInstant(y: number, m: number, d: number, h: number): Date {
  const guess = Date.UTC(y, m - 1, d, h, 0, 0);
  let t = guess - offsetMs(guess);
  const o2 = offsetMs(t);
  t = guess - o2;
  return new Date(t);
}

/** Service window for a date: 15:00 that day to 06:00 the next day, Paris time. */
export function serviceWindow(date: string): { start: Date; end: Date } {
  const [y, m, d] = date.split("-").map(Number);
  return { start: parisInstant(y, m, d, 15), end: parisInstant(y, m, d + 1, 6) };
}

/** "Sat 11 Oct 15:00" in Paris time. */
export function whenShort(iso: string): string {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const g = (t: string) => f.formatToParts(new Date(iso)).find((p) => p.type === t)?.value || "";
  return `${g("weekday")} ${g("day")} ${g("month")} ${g("hour")}:${g("minute")}`;
}

export const timeHM = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
