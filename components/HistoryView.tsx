"use client";

import "./HistoryView.css";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLoad } from "@/lib/useLoad";
import { AsyncView, Skel } from "@/components/AsyncView";
import { isoWeekday, type Completion, type TaskItem, type TaskList } from "@/lib/types";
import { serviceDateNow, timeHM } from "@/lib/paris";

const RANGES = [14, 30, 60];
const PAGE = 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface Data {
  key: string;
  lists: TaskList[];
  items: TaskItem[];
  completions: Completion[];
}

function validDate(s: string | null): s is string {
  if (!s || !DATE_RE.test(s)) return false;
  const d = new Date(s + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function shiftDate(date: string, delta: number): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function dateLabel(date: string): string {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
  const parts = f.formatToParts(new Date(date + "T12:00:00Z"));
  const g = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return `${g("weekday")} ${g("day")} ${g("month")}`;
}

interface NightList { list: TaskList; items: TaskItem[]; done: number }
interface Night {
  date: string;
  lists: NightList[];
  total: number;
  done: number;
  status: "complete" | "partial" | "missed" | "progress" | "none";
}

function buildNight(date: string, today: string, d: Data, byDate: Map<string, Set<string>>): Night {
  const wd = isoWeekday(date);
  const ticked = byDate.get(date) ?? new Set<string>();
  const lists: NightList[] = d.lists
    .filter((l) => l.active && l.days.includes(wd))
    .map((l) => {
      const items = d.items.filter((i) => i.list_id === l.id && i.active).sort((a, b) => a.sort_order - b.sort_order);
      return { list: l, items, done: items.filter((i) => ticked.has(i.id)).length };
    })
    .filter((l) => l.items.length > 0)
    .sort((a, b) => a.list.sort_order - b.list.sort_order);
  const total = lists.reduce((n, l) => n + l.items.length, 0);
  const done = lists.reduce((n, l) => n + l.done, 0);
  let status: Night["status"];
  if (total === 0) status = "none";
  else if (done === total) status = "complete";
  else if (date === today) status = "progress";
  else if (done > 0) status = "partial";
  else status = "missed";
  return { date, lists, total, done, status };
}

function StatusChip({ status }: { status: Night["status"] }) {
  if (status === "complete") return <span className="tk-chip good">Complete</span>;
  if (status === "partial") return <span className="tk-chip warn">Partial</span>;
  if (status === "missed") return <span className="tk-chip danger">Missed</span>;
  if (status === "progress") return <span className="tk-chip">In progress</span>;
  return null;
}

function counts(n: Night): string {
  if (n.status === "none") return "Nothing scheduled";
  return n.lists.map((l) => `${l.list.name} ${l.done} of ${l.items.length}`).join(", ");
}

function IndexSkeleton() {
  return (
    <>
      <div className="tk-hist-list tk-stack" style={{ gap: 24 }}>
        {[7, 7].map((n, g) => (
          <div key={g} className="tk-hist-group">
            <Skel w={140} h={28} />
            <div className="tk-rows">
              {Array.from({ length: n }, (_, i) => <Skel key={i} h={56} r={0} />)}
            </div>
          </div>
        ))}
      </div>
      <div className="tk-hist-skeltable">
        {Array.from({ length: 14 }, (_, i) => <Skel key={i} h={40} r={0} />)}
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="tk-stack">
      {[0, 1].map((s) => (
        <div key={s} className="tk-hist-section">
          <Skel w={160} h={28} />
          <div className="tk-rows">
            {Array.from({ length: 6 }, (_, i) => <Skel key={i} h={44} r={0} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const today = serviceDateNow();
  const rawDate = sp.get("date");
  const date = validDate(rawDate) ? rawDate : null;
  const rawDays = Number(sp.get("days"));
  const days = RANGES.includes(rawDays) ? rawDays : 14;

  const from = date ?? shiftDate(today, -(days - 1));
  const to = date ?? today;
  const key = `${from}|${to}`;

  const load = useLoad<Data>(
    async () => {
      const sb = createClient();
      const comps = async () => {
        const all: Completion[] = [];
        for (let start = 0; ; start += PAGE) {
          const r = await sb.from("task_completions").select("*").gte("service_date", from).lte("service_date", to)
            .order("service_date").order("id").range(start, start + PAGE - 1);
          if (r.error) throw r.error;
          const rows = (r.data ?? []) as Completion[];
          all.push(...rows);
          if (rows.length < PAGE) return all;
        }
      };
      const [l, i, completions] = await Promise.all([
        sb.from("task_lists").select("*").order("sort_order"),
        sb.from("task_items").select("*").order("sort_order"),
        comps(),
      ]);
      if (l.error) throw l.error;
      if (i.error) throw i.error;
      return { key, lists: (l.data ?? []) as TaskList[], items: (i.data ?? []) as TaskItem[], completions };
    },
    [key],
    "the history",
  );

  const suffix = days !== 14 ? `?days=${days}` : "";
  const setRange = (n: number) => router.replace(n === 14 ? "/history" : `/history?days=${n}`);

  return (
    <div className="tk-stack">
      <header>
        {date ? (
          <>
            <Link href={`/history${suffix}`} className="tk-hist-back">All Nights</Link>
            <h1>{dateLabel(date)}</h1>
          </>
        ) : (
          <>
            <h1>History</h1>
            <p className="tk-hist-cap">Counts use today&apos;s check lists.</p>
          </>
        )}
      </header>
      {!date && (
        <div className="tk-hist-range" role="group" aria-label="Range">
          {RANGES.map((n) => (
            <button key={n} type="button" className="tk-btn tk-sm" aria-pressed={days === n} onClick={() => setRange(n)}>
              {days === n ? "\u2713 " : ""}{n} days
            </button>
          ))}
        </div>
      )}
      <AsyncView load={load} skeleton={date ? <DetailSkeleton /> : <IndexSkeleton />}>
        {(d) => {
          if (d.key !== key) return date ? <DetailSkeleton /> : <IndexSkeleton />;
          return date ? <Detail data={d} date={date} today={today} /> : <Index data={d} days={days} today={today} />;
        }}
      </AsyncView>
    </div>
  );
}

function NoLists({ data }: { data: Data }) {
  if (data.lists.length > 0) {
    return (
      <div className="tk-empty">
        <p>All check lists are paused.</p>
        <Link href="/checks" className="tk-btn">Manage Checks</Link>
      </div>
    );
  }
  return (
    <div className="tk-empty">
      <p>No check lists yet, so there is no history.</p>
      <Link href="/checks" className="tk-btn tk-primary">Create Your First Check List</Link>
    </div>
  );
}

function tickedByDate(d: Data): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const c of d.completions) {
    const s = m.get(c.service_date) ?? new Set<string>();
    s.add(c.item_id);
    m.set(c.service_date, s);
  }
  return m;
}

function Index({ data, days, today }: { data: Data; days: number; today: string }) {
  const router = useRouter();
  const nights = useMemo(() => {
    const byDate = tickedByDate(data);
    return Array.from({ length: days }, (_, i) => buildNight(shiftDate(today, -i), today, data, byDate));
  }, [data, days, today]);

  if (!data.lists.some((l) => l.active)) return <NoLists data={data} />;

  const href = (date: string) => `/history?date=${date}${days !== 14 ? `&days=${days}` : ""}`;
  const groups: { label: string; rows: Night[] }[] = [];
  for (const n of nights) {
    const wd = isoWeekday(n.date);
    const monday = shiftDate(n.date, -(wd - 1));
    const label = `Week of ${dateLabel(monday)}`;
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.rows.push(n);
    else groups.push({ label, rows: [n] });
  }

  return (
    <>
      <div className="tk-hist-list tk-stack" style={{ gap: 24 }}>
        {groups.map((g) => (
          <section key={g.label} className="tk-hist-group">
            <h2>{g.label}</h2>
            <div className="tk-rows">
              {g.rows.map((n) => (
                <Link key={n.date} href={href(n.date)} className="tk-hist-item">
                  <span className="tk-hist-date">{dateLabel(n.date)}</span>
                  <span className="tk-hist-counts">{counts(n)}</span>
                  <StatusChip status={n.status} />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
      <table className="tk-hist-table">
        <thead>
          <tr><th scope="col">Date</th><th scope="col">Checks</th><th scope="col">Status</th></tr>
        </thead>
        <tbody>
          {nights.map((n) => (
            <tr key={n.date} onClick={() => router.push(href(n.date))}>
              <td><Link href={href(n.date)}>{dateLabel(n.date)}</Link></td>
              <td>{counts(n)}</td>
              <td><StatusChip status={n.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Detail({ data, date, today }: { data: Data; date: string; today: string }) {
  const night = useMemo(() => buildNight(date, today, data, tickedByDate(data)), [data, date, today]);
  const byItem = useMemo(() => {
    const m = new Map<string, Completion>();
    for (const c of data.completions) if (c.service_date === date) m.set(c.item_id, c);
    return m;
  }, [data, date]);
  const removed = useMemo(() => {
    const shown = new Set(night.lists.flatMap((l) => l.items.map((i) => i.id)));
    return data.completions.filter((c) => c.service_date === date && !shown.has(c.item_id));
  }, [data, date, night]);
  const cause = (c: Completion): string => {
    const item = data.items.find((i) => i.id === c.item_id);
    if (!item) return "Removed check";
    if (!item.active) return "Paused check";
    return "Not scheduled that day";
  };

  if (!data.lists.some((l) => l.active)) return <NoLists data={data} />;
  if (night.total === 0 && removed.length === 0) {
    return <div className="tk-empty"><p>No checks were scheduled on this date.</p></div>;
  }

  return (
    <div className="tk-stack">
      {night.lists.map((l) => (
        <section key={l.list.id} className="tk-hist-section">
          <h2>{l.list.name}</h2>
          <p className="tk-hist-cap">{l.done} of {l.items.length} done</p>
          <div className="tk-rows">
            {l.items.map((i) => {
              const c = byItem.get(i.id);
              return (
                <div key={i.id} className="tk-row tk-hist-row">
                  {c ? <span className="tk-chip good">Done</span> : <span className="tk-chip danger">Not done</span>}
                  <div className="tk-hist-title">
                    <div>{i.title}</div>
                    {c && <div className="tk-hist-removed">{c.done_by} at {timeHM(c.done_at)}</div>}
                    {c?.note && <div className="tk-hist-note">{c.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {removed.length > 0 && (
        <section className="tk-hist-section">
          <h2>Other checks</h2>
          <div className="tk-rows">
            {removed.map((c) => {
              const item = data.items.find((i) => i.id === c.item_id);
              return (
                <div key={c.id} className="tk-row tk-hist-row">
                  <span className="tk-chip good">Done</span>
                  <div className="tk-hist-title">
                    <div>{item ? item.title : "Removed check"}</div>
                    <div className="tk-hist-removed">{cause(c)}. {c.done_by} at {timeHM(c.done_at)}</div>
                    {c.note && <div className="tk-hist-note">{c.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export function HistoryView() {
  return (
    <Suspense fallback={<IndexSkeleton />}>
      <Inner />
    </Suspense>
  );
}
