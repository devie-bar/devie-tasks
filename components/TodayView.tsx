"use client";

import "./TodayView.css";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLoad } from "@/lib/useLoad";
import { AsyncView, Skel } from "@/components/AsyncView";
import { useTasks } from "@/components/TasksProvider";
import { serviceDateNow, timeHM } from "@/lib/paris";
import { isoWeekday, type Completion, type TaskItem, type TaskList, type TaskSection } from "@/lib/types";

interface TodayData { date: string; lists: TaskList[]; sections: TaskSection[]; items: TaskItem[]; done: Completion[]; }

const WRITE_TIMEOUT_MS = 10_000;

function withTimeout<T>(p: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const t = new Promise<never>((_, rej) => { timer = setTimeout(() => rej(new Error("It took longer than 10 seconds.")), WRITE_TIMEOUT_MS); });
  return Promise.race([Promise.resolve(p), t]).finally(() => clearTimeout(timer));
}

type RtEvent = { type: "INSERT" | "DELETE"; row: Partial<Completion> };

function applyEvent(d: TodayData, ev: RtEvent, date: string): TodayData {
  if (ev.row.service_date && ev.row.service_date !== date) return d;
  if (ev.type === "INSERT") {
    const row = ev.row as Completion;
    return { ...d, done: [...d.done.filter((x) => x.item_id !== row.item_id), row] };
  }
  return { ...d, done: d.done.filter((x) => x.id !== ev.row.id) };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validDate(s: string | null): s is string {
  if (!s || !DATE_RE.test(s)) return false;
  const d = new Date(s + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function addDays(date: string, n: number): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts }).format(new Date(date + "T12:00:00Z"));
const shortDate = (d: string) => fmt(d, { weekday: "short", day: "numeric", month: "short" }).replace(/,/g, "");
const longDate = (d: string) => fmt(d, { weekday: "long", day: "numeric", month: "long" }).replace(/,/g, "");

function Check() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </svg>
  );
}

function TodaySkeleton() {
  return (
    <div className="tk-stack">
      <section className="tk-today-section">
        <Skel w={180} h={34} />
        <Skel w={90} h={22} />
        {[0, 1].map((g) => (
          <div key={g} className="tk-today-group">
            <Skel w={120} h={26} />
            <Skel w={90} h={20} />
            <div>
              {[0, 1, 2, 3].map((r) => (
                <div key={r} className="tk-today-skelrow">
                  <Skel w={24} h={24} r={4} />
                  <span className="tk-today-skeltext"><Skel w={`${50 + ((r * 13) % 30)}%`} h={18} /><Skel w="30%" h={14} /></span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export function TodayView() {
  const router = useRouter();
  const params = useSearchParams();
  const { displayName } = useTasks();
  const [today, setToday] = useState(() => serviceDateNow());
  useEffect(() => {
    const tick = () => setToday(serviceDateNow());
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    tick();
    const id = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  const dateParam = params.get("date");
  const date = validDate(dateParam) ? dateParam : today;
  const listParam = params.get("list");

  const load = useLoad<TodayData>(async () => {
    const sb = createClient();
    const [l, sc, i, c] = await Promise.all([
      sb.from("task_lists").select("id,name,kind,days,sort_order,active").order("sort_order"),
      sb.from("task_sections").select("id,list_id,name,sort_order,active").eq("active", true).order("sort_order"),
      sb.from("task_items").select("id,list_id,section_id,title,detail,sort_order,active").eq("active", true).order("sort_order"),
      sb.from("task_completions").select("id,item_id,service_date,done_by,done_at,note").eq("service_date", date),
    ]);
    if (l.error) throw l.error;
    if (sc.error) throw sc.error;
    if (i.error) throw i.error;
    if (c.error) throw c.error;
    return { date, lists: (l.data ?? []) as TaskList[], sections: (sc.data ?? []) as TaskSection[], items: (i.data ?? []) as TaskItem[], done: (c.data ?? []) as Completion[] };
  }, [date], "today's checks");

  const setData = load.set;
  const reload = load.reload;

  // Realtime. Events before the first load of this date are buffered, then applied.
  const loadedDate = load.data?.date;
  const bufferRef = useRef<RtEvent[]>([]);
  const readyRef = useRef(false);
  useEffect(() => {
    readyRef.current = false;
    bufferRef.current = [];
  }, [date]);
  useEffect(() => {
    if (loadedDate !== date) return;
    readyRef.current = true;
    const buffered = bufferRef.current;
    bufferRef.current = [];
    if (buffered.length) setData((prev) => (prev ? buffered.reduce((acc, ev) => applyEvent(acc, ev, date), prev) : (prev as never)));
  }, [loadedDate, date, setData]);

  useEffect(() => {
    const sb = createClient();
    let subscribedBefore = false;
    const ch = sb
      .channel(`today-completions-${date}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_completions", filter: `service_date=eq.${date}` }, (p) => {
        if (p.eventType !== "INSERT" && p.eventType !== "DELETE") return;
        const ev: RtEvent = { type: p.eventType, row: (p.eventType === "INSERT" ? p.new : p.old) as Partial<Completion> };
        if (!readyRef.current) { bufferRef.current.push(ev); return; }
        setData((prev) => (prev ? applyEvent(prev, ev, date) : (prev as never)));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          if (subscribedBefore) reload();
          subscribedBefore = true;
        }
      });
    return () => { sb.removeChannel(ch); };
  }, [date, setData, reload]);

  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busyRef = useRef(busy);
  busyRef.current = busy;

  const toggle = useCallback(async (item: TaskItem, existing: Completion | undefined) => {
    if (busyRef.current.has(item.id)) return;
    setBusy((b) => new Set(b).add(item.id));
    setErrors((e) => { const n = { ...e }; delete n[item.id]; return n; });
    const sb = createClient();
    const release = () => setBusy((b) => { const n = new Set(b); n.delete(item.id); return n; });
    const fail = (verb: string, msg: string) => setErrors((e) => ({ ...e, [item.id]: `Could not ${verb} "${item.title}". ${msg}` }));
    const put = (fn: (d: Completion[]) => Completion[]) => setData((prev) => prev ? { ...prev, done: fn(prev.done) } : prev as never);

    if (existing) {
      put((d) => d.filter((x) => x.item_id !== item.id));
      let error: { message: string } | null = null;
      try { ({ error } = await withTimeout(sb.from("task_completions").delete().eq("id", existing.id))); } catch (e) { error = { message: e instanceof Error ? e.message : "Unknown error." }; }
      if (error) { put((d) => [...d.filter((x) => x.item_id !== item.id), existing]); fail("untick", error.message); }
    } else {
      const temp: Completion = { id: `temp-${item.id}`, item_id: item.id, service_date: date, done_by: displayName, done_at: new Date().toISOString(), note: null };
      put((d) => [...d.filter((x) => x.item_id !== item.id), temp]);
      let data: unknown = null;
      let error: { message: string; code?: string } | null = null;
      try {
        ({ data, error } = await withTimeout(sb.from("task_completions")
          .insert({ item_id: item.id, service_date: date, done_by: displayName })
          .select("id,item_id,service_date,done_by,done_at,note").single()));
      } catch (e) { error = { message: e instanceof Error ? e.message : "Unknown error." }; }
      if (error) {
        if (error.code === "23505") { reload(); }
        else { put((d) => d.filter((x) => x.item_id !== item.id)); fail("tick", error.message); }
      } else if (data) {
        put((d) => [...d.filter((x) => x.item_id !== item.id), data as Completion]);
      }
    }
    release();
  }, [date, displayName, reload, setData]);

  const go = (d: string) => {
    const q = new URLSearchParams();
    if (d !== today) q.set("date", d);
    if (listParam) q.set("list", listParam);
    const s = q.toString();
    router.replace(s ? `/?${s}` : "/");
  };

  return (
    <div className="tk-stack">
      <header className="tk-today-head">
        <h1>{date === today ? "Today" : shortDate(date)}</h1>
        <div className="tk-today-nav">
          <button type="button" className="tk-btn" onClick={() => go(addDays(date, -1))}>Previous Day</button>
          <span className="tk-today-date">{shortDate(date)}</span>
          <button type="button" className="tk-btn" onClick={() => go(addDays(date, 1))}>Next Day</button>
          {date !== today && <button type="button" className="tk-btn tk-quiet" onClick={() => go(today)}>Back To Today</button>}
        </div>
      </header>

      <AsyncView load={load} skeleton={<TodaySkeleton />}>
        {(data) => {
          if (data.date !== date) return <TodaySkeleton />;
          if (data.lists.length === 0) {
            return (
              <div className="tk-empty">
                <p>No check lists yet. Opening and closing checks live here.</p>
                <Link href="/checks" className="tk-btn tk-primary">Create Your First Check List</Link>
              </div>
            );
          }
          const wd = isoWeekday(date);
          let lists = data.lists.filter((l) => l.active && l.days.includes(wd)).sort((a, b) => a.sort_order - b.sort_order);
          if (lists.length === 0) {
            return (
              <div className="tk-empty">
                <p>No checks are scheduled for {longDate(date)}.</p>
                <Link href="/checks" className="tk-btn">Manage Checks</Link>
              </div>
            );
          }
          if (listParam && lists.some((l) => l.id === listParam)) lists = lists.filter((l) => l.id === listParam);
          const doneByItem = new Map(data.done.map((c) => [c.item_id, c]));
          return (
            <div className="tk-stack">
              {lists.map((list) => {
                const items = data.items.filter((i) => i.list_id === list.id && i.active);
                const secs = data.sections.filter((x) => x.list_id === list.id && x.active).sort((x, y) => x.sort_order - y.sort_order);
                const bySort = (x: TaskItem, y: TaskItem) => x.sort_order - y.sort_order;
                const secIds = new Set(secs.map((x) => x.id));
                const loose = items.filter((i) => !i.section_id || !secIds.has(i.section_id)).sort(bySort);
                const doneCount = items.filter((i) => doneByItem.has(i.id)).length;
                const rowsFor = (group: TaskItem[]) => (
                  <div className="tk-rows tk-today-rows">
                    {group.map((item) => {
                      const c = doneByItem.get(item.id);
                      const err = errors[item.id];
                      return (
                        <div key={item.id}>
                          <div className="tk-row">
                            <button type="button" className="tk-today-btn" aria-pressed={!!c} disabled={busy.has(item.id)} onClick={() => toggle(item, c)}>
                              <span className="tk-today-mark" aria-hidden="true"><Check /></span>
                              <span className="tk-today-text">
                                <span className="tk-today-title">{item.title}</span>
                                {c && <span className="tk-today-meta">Done by {c.done_by} at {timeHM(c.done_at)}</span>}
                                {item.detail && <span className="tk-today-meta">{item.detail}</span>}
                              </span>
                            </button>
                          </div>
                          {err && (
                            <div className="tk-today-rowerr" role="alert">
                              <p>{err}</p>
                              <button type="button" className="tk-btn tk-sm" onClick={() => toggle(item, c)}>Try Again</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
                return (
                  <section key={list.id} className="tk-today-section" aria-labelledby={`tk-list-${list.id}`}>
                    <h2 id={`tk-list-${list.id}`}>{list.name}</h2>
                    {items.length === 0 && secs.length === 0 ? (
                      <div className="tk-empty">
                        <p>No checks on this list yet.</p>
                        <Link href="/checks" className="tk-btn tk-sm">Manage Checks</Link>
                      </div>
                    ) : (
                      <>
                        <p className="tk-today-progress">{doneCount} of {items.length} done</p>
                        {loose.length > 0 && rowsFor(loose)}
                        {secs.map((sec) => {
                          const group = items.filter((i) => i.section_id === sec.id).sort(bySort);
                          const n = group.filter((i) => doneByItem.has(i.id)).length;
                          return (
                            <div key={sec.id} className="tk-today-group">
                              <h3 id={`tk-sec-${sec.id}`}>{sec.name}</h3>
                              {group.length === 0 ? (
                                <p className="tk-today-meta">No checks in {sec.name} yet.</p>
                              ) : (
                                <>
                                  <p className="tk-today-progress">{n} of {group.length} done</p>
                                  {rowsFor(group)}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </section>
                );
              })}
            </div>
          );
        }}
      </AsyncView>
    </div>
  );
}

/** Suspense fallback: the page header placeholder plus the same skeleton the view uses. */
export function TodaySkeletonPage() {
  return (
    <div className="tk-stack" aria-busy="true">
      <header className="tk-today-head">
        <Skel w={140} h={48} />
        <Skel w={320} h={44} />
      </header>
      <TodaySkeleton />
    </div>
  );
}
