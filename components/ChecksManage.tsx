"use client";

import "./ChecksManage.css";
import { useRef, useState } from "react";
import type { FormEvent, MutableRefObject } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLoad } from "@/lib/useLoad";
import type { Load } from "@/lib/useLoad";
import { AsyncView, Skel } from "@/components/AsyncView";
import { ALL_DAYS, DAY_LABELS, daysLabel } from "@/lib/types";
import type { ListKind, TaskItem, TaskList, TaskSection } from "@/lib/types";

const MAX = 120;
const MAX_SECTION = 60;
const KIND_LABEL: Record<ListKind, string> = { opening: "Opening", closing: "Closing", other: "Other" };

/** Every write gets the same 10 second ceiling as a load (DESIGN.md principle 6). */
function timed<T>(p: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new Error("It took longer than 10 seconds.")), 10_000);
  });
  return Promise.race([Promise.resolve(p), timeout]).finally(() => clearTimeout(timer));
}

function errText(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e && "message" in e) return String((e as { message: unknown }).message);
  return "Unknown error.";
}

/** Returns a sentence describing what is wrong, or null when the value is fine. */
function checkText(value: string, what: string): string | null {
  const v = value.trim();
  if (!v) return `Give the ${what} a name before saving.`;
  if (v.length > MAX) return `The ${what} name is ${v.length} characters. Keep it to ${MAX} or fewer.`;
  return null;
}
function checkTitle(value: string): string | null {
  const v = value.trim();
  if (!v) return "A check needs a title.";
  if (v.length > MAX) return `The title is ${v.length} characters. Keep it to ${MAX} or fewer.`;
  return null;
}

export function ChecksManage() {
  const params = useSearchParams();
  const listId = params.get("list");
  const focusName = useRef(false);
  return listId ? <Editor key={listId} listId={listId} focusName={focusName} /> : <Index focusName={focusName} />;
}

/* Index */

interface Counts { sections: number; checks: number }
interface IndexData { lists: TaskList[]; counts: Record<string, Counts> }

function IndexSkeleton() {
  return (
    <div>
      {[0, 1, 2, 3].map((i) => <Skel key={i} h={56} r={0} />)}
    </div>
  );
}

/** Suspense fallback for the route: the index layout (heading, 4 rows of 56px). */
export function ChecksManageFallback() {
  return (
    <div className="tk-manage-lists" aria-busy="true">
      <Skel h={40} w="40%" />
      <IndexSkeleton />
    </div>
  );
}

function countText(c: Counts | undefined): string {
  const s = c?.sections ?? 0;
  const k = c?.checks ?? 0;
  return `${s} ${s === 1 ? "section" : "sections"}, ${k} ${k === 1 ? "check" : "checks"}`;
}

function Index({ focusName }: { focusName: MutableRefObject<boolean> }) {
  const router = useRouter();
  const load = useLoad<IndexData>(async () => {
    const sb = createClient();
    const [l, i, sc] = await Promise.all([
      sb.from("task_lists").select("*").order("sort_order", { ascending: true }),
      sb.from("task_items").select("list_id").eq("active", true),
      sb.from("task_sections").select("list_id").eq("active", true),
    ]);
    if (l.error) throw l.error;
    if (i.error) throw i.error;
    if (sc.error) throw sc.error;
    const counts: Record<string, Counts> = {};
    const bump = (id: string, k: keyof Counts) => { (counts[id] ??= { sections: 0, checks: 0 })[k] += 1; };
    for (const r of (i.data ?? []) as { list_id: string }[]) bump(r.list_id, "checks");
    for (const r of (sc.data ?? []) as { list_id: string }[]) bump(r.list_id, "sections");
    return { lists: (l.data ?? []) as TaskList[], counts };
  }, [], "your check lists");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create(lists: TaskList[]) {
    setBusy(true);
    setErr(null);
    const next = lists.reduce((m, l) => Math.max(m, l.sort_order), 0) + 1;
    try {
      const { data, error } = await timed(createClient()
        .from("task_lists")
        .insert({ name: "New check list", kind: "other", days: ALL_DAYS, sort_order: next })
        .select("id")
        .single());
      if (error || !data) throw error ?? new Error("No row came back.");
      focusName.current = true;
      router.push(`/checks?list=${(data as { id: string }).id}`);
    } catch (e) {
      setErr(`Could not create the check list. ${errText(e)}`);
      setBusy(false);
    }
  }

  return (
    <div className="tk-manage-lists">
      <h1>Check Lists</h1>
      <AsyncView load={load} skeleton={<IndexSkeleton />}>
        {({ lists, counts }) => (
          <>
            {lists.length === 0 ? (
              <div className="tk-empty">
                <p>No check lists yet. A check list is a set of checks that repeat on the days you choose, like Opening or Closing.</p>
                <button type="button" className="tk-btn tk-primary" disabled={busy} onClick={() => create(lists)}>Create Your First Check List</button>
              </div>
            ) : (
              <>
                <nav aria-label="Check lists" className="tk-manage-index">
                  {lists.map((l) => (
                    <Link key={l.id} href={`/checks?list=${l.id}`} className="tk-manage-link">
                      <span className="tk-manage-link-name">{l.name}</span>
                      <span className="tk-manage-link-meta">
                        <span>{KIND_LABEL[l.kind]}</span>
                        <span>{daysLabel(l.days)}</span>
                        {!l.active && <span className="tk-chip warn">Paused</span>}
                      </span>
                      <span className="tk-manage-count">{countText(counts[l.id])}</span>
                    </Link>
                  ))}
                </nav>
                <button type="button" className="tk-btn tk-primary" disabled={busy} onClick={() => create(lists)}>New Check List</button>
              </>
            )}
            {err && (
              <div role="alert" className="tk-err">
                <p>{err}</p>
                <button type="button" className="tk-btn" onClick={() => { setErr(null); load.reload(); }}>Try Again</button>
              </div>
            )}
          </>
        )}
      </AsyncView>
    </div>
  );
}

/* Editor */

interface EditorData { list: TaskList | null; items: TaskItem[]; sections: TaskSection[] }

function EditorSkeleton() {
  return (
    <div className="tk-manage-editor" style={{ display: "grid", gap: 32 }}>
      <div className="tk-manage-stack">
        <Skel h={44} w={128} />
        <Skel h={40} w="60%" />
      </div>
      <div style={{ display: "grid", gap: 24, maxWidth: 560 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "grid", gap: 8 }}>
            <Skel h={16} w={96} />
            <Skel h={44} r={10} />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 16 }}>
        <Skel h={32} w={160} />
        <Skel h={44} r={10} />
        {[0, 1].map((g) => (
          <div key={g} style={{ display: "grid", gap: 8 }}>
            <Skel h={44} r={10} />
            {(g === 0 ? [0, 1, 2] : [0, 1]).map((i) => <Skel key={i} h={56} r={0} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

function Editor({ listId, focusName }: { listId: string; focusName: MutableRefObject<boolean> }) {
  const load = useLoad<EditorData>(async () => {
    const sb = createClient();
    const [l, i, sc] = await Promise.all([
      sb.from("task_lists").select("*").eq("id", listId).maybeSingle(),
      sb.from("task_items").select("*").eq("list_id", listId).order("sort_order", { ascending: true }),
      sb.from("task_sections").select("*").eq("list_id", listId).order("sort_order", { ascending: true }),
    ]);
    if (l.error) throw l.error;
    if (i.error) throw i.error;
    if (sc.error) throw sc.error;
    return { list: (l.data as TaskList | null) ?? null, items: (i.data ?? []) as TaskItem[], sections: (sc.data ?? []) as TaskSection[] };
  }, [listId], "this check list");

  return (
    <AsyncView load={load} skeleton={<EditorSkeleton />}>
      {(data) =>
        data.list ? (
          <EditorBody list={data.list} items={data.items} sections={data.sections} load={load} focusName={focusName} />
        ) : (
          <div className="tk-manage-stack">
            <Link href="/checks" className="tk-manage-back">All Check Lists</Link>
            <div className="tk-empty"><p>This check list was not found. It may have been deleted.</p></div>
          </div>
        )
      }
    </AsyncView>
  );
}

function sameDays(a: number[], b: number[]) {
  return [...a].sort().join(",") === [...b].sort().join(",");
}

function EditorBody({ list, items, sections, load, focusName }: { list: TaskList; items: TaskItem[]; sections: TaskSection[]; load: Load<EditorData>; focusName: MutableRefObject<boolean> }) {
  const router = useRouter();
  const [name, setName] = useState(list.name);
  const [kind, setKind] = useState<ListKind>(list.kind);
  const [days, setDays] = useState<number[]>(list.days);
  const [active, setActive] = useState(list.active);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [checkErr, setCheckErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmList, setConfirmList] = useState(false);
  const [listErr, setListErr] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const orderedSections = [...sections].sort((x, y) => x.sort_order - y.sort_order);
  const unsectioned = items.filter((it) => it.section_id == null).sort((x, y) => x.sort_order - y.sort_order);

  const dirty = name !== list.name || kind !== list.kind || active !== list.active || !sameDays(days, list.days);

  function nameInput(el: HTMLInputElement | null) {
    nameRef.current = el;
    if (el && focusName.current) {
      focusName.current = false;
      el.focus();
      el.select();
    }
  }

  function touch() { setSaved(false); setSaveErr(null); }

  function toggleDay(d: number) {
    touch();
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort((a, b) => a - b)));
  }

  async function save() {
    const problem = checkText(name, "check list");
    if (problem) { setNameErr(problem); return; }
    setNameErr(null);
    setSaving(true);
    setSaveErr(null);
    const patch = { name: name.trim(), kind, days: [...days].sort((a, b) => a - b), active };
    try {
      const { error } = await timed(createClient().from("task_lists").update(patch).eq("id", list.id));
      if (error) throw error;
    } catch (e) {
      setSaving(false);
      setSaveErr(`Could not save the list. ${errText(e)}`);
      return;
    }
    setSaving(false);
    setName(patch.name);
    load.set((prev) => ({ items: prev?.items ?? [], sections: prev?.sections ?? [], list: { ...list, ...patch } }));
    setSaved(true);
  }

  function updateItems(fn: (cur: TaskItem[]) => TaskItem[]) {
    load.set((prev) => ({ list: prev?.list ?? list, sections: prev?.sections ?? sections, items: fn(prev?.items ?? items) }));
  }
  function updateSections(fn: (cur: TaskSection[]) => TaskSection[]) {
    load.set((prev) => ({ list: prev?.list ?? list, items: prev?.items ?? items, sections: fn(prev?.sections ?? sections) }));
  }

  /** A failed write leaves the database in an unknown state, so show the truth by reloading. */
  function failed(what: string, e: unknown) {
    setCheckErr(`Could not ${what}. ${errText(e)}`);
    load.reload();
  }

  const byOrder = <T extends { sort_order: number }>(a: T[]) => [...a].sort((x, y) => x.sort_order - y.sort_order);
  const itemsIn = (sid: string | null) => byOrder(items.filter((it) => (it.section_id ?? null) === sid));

  async function patchItem(id: string, patch: Partial<TaskItem>): Promise<boolean> {
    setCheckErr(null);
    updateItems((cur) => cur.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    try {
      const { error } = await timed(createClient().from("task_items").update(patch).eq("id", id));
      if (error) throw error;
      return true;
    } catch (e) {
      failed("update the check", e);
      return false;
    }
  }

  async function changeSection(id: string, sid: string | null) {
    const sort_order = itemsIn(sid).reduce((m, it) => Math.max(m, it.sort_order), 0) + 1;
    await patchItem(id, { section_id: sid, sort_order });
  }

  async function move(sid: string | null, index: number, dir: -1 | 1) {
    const group = itemsIn(sid);
    const j = index + dir;
    if (j < 0 || j >= group.length) return;
    const arr = [...group];
    [arr[index], arr[j]] = [arr[j], arr[index]];
    const next = arr.map((it, i) => ({ ...it, sort_order: i + 1 }));
    const changed = next.filter((it) => it.sort_order !== group.find((p) => p.id === it.id)!.sort_order);
    setCheckErr(null);
    setBusy(true);
    updateItems((cur) => cur.map((it) => next.find((n) => n.id === it.id) ?? it));
    const sb = createClient();
    try {
      const results = await timed(Promise.all(changed.map((it) => sb.from("task_items").update({ sort_order: it.sort_order }).eq("id", it.id))));
      const bad = results.find((r) => r.error);
      if (bad?.error) throw bad.error;
    } catch (e) {
      failed("move the check", e);
    }
    setBusy(false);
  }

  async function remove(id: string) {
    setCheckErr(null);
    updateItems((cur) => cur.filter((it) => it.id !== id));
    try {
      const { error } = await timed(createClient().from("task_items").delete().eq("id", id));
      if (error) throw error;
    } catch (e) {
      failed("delete the check", e);
    }
  }

  async function add(title: string, sid: string | null): Promise<boolean> {
    setCheckErr(null);
    const max = itemsIn(sid).reduce((m, it) => Math.max(m, it.sort_order), 0);
    try {
      const { data, error } = await timed(createClient()
        .from("task_items")
        .insert({ list_id: list.id, section_id: sid, title: title.trim(), detail: null, sort_order: max + 1 })
        .select("*")
        .single());
      if (error || !data) throw error ?? new Error("No row came back.");
      updateItems((cur) => [...cur, data as TaskItem]);
      return true;
    } catch (e) {
      failed("add the check", e);
      return false;
    }
  }

  /** Returns a sentence when the name is not allowed, otherwise null. */
  function sectionProblem(value: string, selfId: string | null): string | null {
    const v = value.trim();
    if (!v) return "A section needs a name.";
    if (v.length > MAX_SECTION) return `The section name is ${v.length} characters. Keep it to ${MAX_SECTION} or fewer.`;
    if (sections.some((x) => x.id !== selfId && x.name.trim().toLowerCase() === v.toLowerCase())) return `This list already has a section called ${v}. Section names must be different within a list.`;
    return null;
  }

  async function patchSection(id: string, patch: Partial<TaskSection>): Promise<boolean> {
    setCheckErr(null);
    updateSections((cur) => cur.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    try {
      const { error } = await timed(createClient().from("task_sections").update(patch).eq("id", id));
      if (error) throw error;
      return true;
    } catch (e) {
      failed("update the section", e);
      return false;
    }
  }

  async function moveSection(index: number, dir: -1 | 1) {
    const ordered = byOrder(sections);
    const j = index + dir;
    if (j < 0 || j >= ordered.length) return;
    const arr = [...ordered];
    [arr[index], arr[j]] = [arr[j], arr[index]];
    const next = arr.map((x, i) => ({ ...x, sort_order: i + 1 }));
    const changed = next.filter((x) => x.sort_order !== ordered.find((p) => p.id === x.id)!.sort_order);
    setCheckErr(null);
    setBusy(true);
    updateSections((cur) => cur.map((x) => next.find((n) => n.id === x.id) ?? x));
    const sb = createClient();
    try {
      const results = await timed(Promise.all(changed.map((x) => sb.from("task_sections").update({ sort_order: x.sort_order }).eq("id", x.id))));
      const bad = results.find((r) => r.error);
      if (bad?.error) throw bad.error;
    } catch (e) {
      failed("move the section", e);
    }
    setBusy(false);
  }

  async function removeSection(id: string) {
    setCheckErr(null);
    updateSections((cur) => cur.filter((x) => x.id !== id));
    updateItems((cur) => cur.filter((it) => it.section_id !== id));
    try {
      const { error } = await timed(createClient().from("task_sections").delete().eq("id", id));
      if (error) throw error;
    } catch (e) {
      failed("delete the section", e);
    }
  }

  async function addSection(name: string): Promise<boolean> {
    setCheckErr(null);
    const max = sections.reduce((m, x) => Math.max(m, x.sort_order), 0);
    try {
      const { data, error } = await timed(createClient()
        .from("task_sections")
        .insert({ list_id: list.id, name: name.trim(), sort_order: max + 1 })
        .select("*")
        .single());
      if (error || !data) throw error ?? new Error("No row came back.");
      updateSections((cur) => [...cur, data as TaskSection]);
      return true;
    } catch (e) {
      failed("add the section", e);
      return false;
    }
  }

  async function deleteList() {
    setListErr(null);
    setBusy(true);
    try {
      const { error } = await timed(createClient().from("task_lists").delete().eq("id", list.id));
      if (error) throw error;
      router.push("/checks");
    } catch (e) {
      setListErr(`Could not delete the check list. ${errText(e)}`);
    }
    setBusy(false);
  }

  return (
    <div className="tk-manage-editor">
      <div className="tk-manage-stack" style={{ order: 0 }}>
        <Link href="/checks" className="tk-manage-back">All Check Lists</Link>
        <h1>{list.name}</h1>
      </div>

      <div className="tk-manage-fields">
        <div className="tk-f">
          <label htmlFor="tk-manage-name">Name</label>
          <input
            id="tk-manage-name"
            ref={nameInput}
            type="text"
            maxLength={MAX + 40}
            value={name}
            aria-invalid={nameErr ? true : undefined}
            aria-describedby={nameErr ? "tk-manage-name-err" : undefined}
            onChange={(e) => { setName(e.target.value); setNameErr(null); touch(); }}
          />
          {nameErr && <p id="tk-manage-name-err" className="tk-manage-fielderr" role="alert">{nameErr}</p>}
        </div>

        <div className="tk-f">
          <label htmlFor="tk-manage-kind">Kind</label>
          <select id="tk-manage-kind" className="tk-manage-select" value={kind} onChange={(e) => { setKind(e.target.value as ListKind); touch(); }}>
            <option value="opening">Opening</option>
            <option value="closing">Closing</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="tk-f" role="group" aria-labelledby="tk-manage-days-l">
          <span id="tk-manage-days-l" className="tk-manage-fieldlabel">Days</span>
          <div className="tk-manage-days">
            {ALL_DAYS.map((d) => (
              <button key={d} type="button" className="tk-manage-day" aria-pressed={days.includes(d)} onClick={() => toggleDay(d)}>
                {DAY_LABELS[d]}
              </button>
            ))}
          </div>
          <div className="tk-manage-quick">
            <button type="button" className="tk-btn tk-sm" onClick={() => { touch(); setDays(ALL_DAYS); }}>Every Day</button>
            <button type="button" className="tk-btn tk-sm" onClick={() => { touch(); setDays([1, 2, 3, 4, 5]); }}>Mon To Fri</button>
          </div>
          {days.length === 0 && <p className="tk-manage-fielderr">No days are chosen, so this list will never run.</p>}
        </div>

        <div className="tk-f">
          <span className="tk-manage-fieldlabel">Status</span>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            className="tk-btn tk-manage-switch"
            onClick={() => { setActive(!active); touch(); }}
          >
            {active ? "Active" : "Paused"}
          </button>
        </div>
      </div>

      <div className="tk-bar tk-manage-bar">
        <button type="button" className="tk-btn tk-green" disabled={!dirty || saving} onClick={save}>
          {saving ? "Saving" : "Save List"}
        </button>
        <span aria-live="polite">{saved && !dirty && <span className="tk-manage-saved">Saved</span>}</span>
        {saveErr && (
          <div role="alert" className="tk-manage-inlineerr">
            <p>{saveErr}</p>
            <button type="button" className="tk-btn tk-sm" onClick={save}>Try Again</button>
          </div>
        )}
      </div>

      <section className="tk-manage-checks" aria-labelledby="tk-manage-checks-h">
        <h2 id="tk-manage-checks-h">Sections</h2>
        {orderedSections.length === 0 && items.length === 0 && <p className="tk-empty" style={{ margin: 0 }}>No sections or checks on this list yet.</p>}
        {(unsectioned.length > 0 || orderedSections.length === 0) && (
          <div className="tk-manage-group">
            <h3 className="tk-manage-group-h">No section</h3>
            <CheckGroup sid={null} items={unsectioned} sections={orderedSections} busy={busy} idKey="none"
              onPatch={patchItem} onMove={move} onDelete={remove} onSection={changeSection} onAdd={add} />
          </div>
        )}
        {orderedSections.map((sec, si) => (
          <div key={sec.id} className="tk-manage-group">
            <SectionHead
              section={sec}
              first={si === 0}
              last={si === orderedSections.length - 1}
              busy={busy}
              validate={(v) => sectionProblem(v, sec.id)}
              onPatch={(p) => patchSection(sec.id, p)}
              onMove={(d) => moveSection(si, d)}
              onDelete={() => removeSection(sec.id)}
            />
            <CheckGroup sid={sec.id} items={itemsIn(sec.id)} sections={orderedSections} busy={busy} idKey={sec.id}
              onPatch={patchItem} onMove={move} onDelete={remove} onSection={changeSection} onAdd={add} />
          </div>
        ))}
        <SectionAdd validate={(v) => sectionProblem(v, null)} onAdd={addSection} />
        {checkErr && (
          <div role="alert" className="tk-err">
            <p>{checkErr}</p>
            <button type="button" className="tk-btn" onClick={() => { setCheckErr(null); load.reload(); }}>Try Again</button>
          </div>
        )}
      </section>

      <section className="tk-manage-danger" aria-label="Delete this check list">
        {confirmList ? (
          <div className="tk-manage-confirm" role="alert">
            <p>Delete this check list? It also removes its checks and their history.</p>
            <button type="button" className="tk-btn tk-sm" disabled={busy} onClick={deleteList}>Delete</button>
            <button type="button" className="tk-btn tk-sm tk-quiet" onClick={() => setConfirmList(false)}>Keep</button>
          </div>
        ) : (
          <button type="button" className="tk-btn tk-sm" onClick={() => setConfirmList(true)}>Delete List</button>
        )}
        {listErr && (
          <div role="alert" className="tk-err">
            <p>{listErr}</p>
            <button type="button" className="tk-btn" onClick={deleteList}>Try Again</button>
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHead({ section, first, last, busy, validate, onPatch, onMove, onDelete }: {
  section: TaskSection;
  first: boolean;
  last: boolean;
  busy: boolean;
  validate: (v: string) => string | null;
  onPatch: (p: Partial<TaskSection>) => Promise<boolean>;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(section.name);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const id = `tk-manage-s-${section.id}`;

  async function commit() {
    const v = name.trim();
    if (v === section.name) { setName(section.name); setErr(null); return; }
    const problem = validate(name);
    if (problem) { setErr(`${problem} The previous name was put back.`); setName(section.name); return; }
    setErr(null);
    const ok = await onPatch({ name: v });
    setName(ok ? v : section.name);
  }

  return (
    <div className={`tk-manage-sechead${section.active ? "" : " is-paused"}`}>
      <h3 className="tk-manage-group-h">
        <label className="tk-sr" htmlFor={id}>Section name</label>
        <input
          id={id}
          type="text"
          className="tk-input"
          value={name}
          maxLength={MAX_SECTION + 20}
          aria-invalid={err ? true : undefined}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        />
        {!section.active && <span className="tk-chip warn">Paused</span>}
      </h3>
      {err && <p className="tk-manage-fielderr" role="alert">{err}</p>}
      {confirm ? (
        <div className="tk-manage-confirm" role="alert">
          <p>Delete this section? It also removes its checks and their history.</p>
          <button type="button" className="tk-btn tk-sm" onClick={onDelete}>Delete</button>
          <button type="button" className="tk-btn tk-sm tk-quiet" onClick={() => setConfirm(false)}>Keep</button>
        </div>
      ) : (
        <div className="tk-manage-actions">
          <button type="button" className="tk-btn tk-sm" disabled={first || busy} onClick={() => onMove(-1)}>Move Up</button>
          <button type="button" className="tk-btn tk-sm" disabled={last || busy} onClick={() => onMove(1)}>Move Down</button>
          <button type="button" className="tk-btn tk-sm" onClick={() => onPatch({ active: !section.active })}>{section.active ? "Pause" : "Resume"}</button>
          <button type="button" className="tk-btn tk-sm" onClick={() => setConfirm(true)}>Delete</button>
        </div>
      )}
    </div>
  );
}

function SectionAdd({ validate, onAdd }: { validate: (v: string) => string | null; onAdd: (name: string) => Promise<boolean> }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const problem = validate(name);
    if (problem) { setErr(problem); ref.current?.focus(); return; }
    setErr(null);
    setBusy(true);
    const ok = await onAdd(name);
    setBusy(false);
    if (ok) { setName(""); ref.current?.focus(); }
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: 8 }}>
      <div className="tk-manage-add">
        <label className="tk-sr" htmlFor="tk-manage-newsec">New section name</label>
        <input
          id="tk-manage-newsec"
          ref={ref}
          type="text"
          className="tk-input"
          placeholder="New section"
          value={name}
          maxLength={MAX_SECTION + 20}
          aria-invalid={err ? true : undefined}
          onChange={(e) => { setName(e.target.value); setErr(null); }}
        />
        <button type="submit" className="tk-btn tk-primary" disabled={busy}>Add Section</button>
      </div>
      {err && <p className="tk-manage-fielderr" role="alert">{err}</p>}
    </form>
  );
}

function CheckGroup({ sid, items, sections, busy, idKey, onPatch, onMove, onDelete, onSection, onAdd }: {
  sid: string | null;
  items: TaskItem[];
  sections: TaskSection[];
  busy: boolean;
  idKey: string;
  onPatch: (id: string, p: Partial<TaskItem>) => Promise<boolean>;
  onMove: (sid: string | null, index: number, d: -1 | 1) => void;
  onDelete: (id: string) => void;
  onSection: (id: string, sid: string | null) => void;
  onAdd: (title: string, sid: string | null) => Promise<boolean>;
}) {
  return (
    <div className="tk-manage-groupbody">
      {items.length === 0 ? (
        <p className="tk-empty" style={{ margin: 0 }}>{sid ? "No checks in this section yet." : "No checks on this list yet."}</p>
      ) : (
        <div className="tk-rows">
          {items.map((it, i) => (
            <CheckRow
              key={it.id}
              item={it}
              sections={sections}
              first={i === 0}
              last={i === items.length - 1}
              busy={busy}
              onPatch={(p) => onPatch(it.id, p)}
              onMove={(d) => onMove(sid, i, d)}
              onDelete={() => onDelete(it.id)}
              onSection={(v) => onSection(it.id, v)}
            />
          ))}
        </div>
      )}
      <AddRow idKey={idKey} onAdd={(t) => onAdd(t, sid)} />
    </div>
  );
}

function CheckRow({ item, sections, first, last, busy, onPatch, onMove, onDelete, onSection }: {
  item: TaskItem;
  sections: TaskSection[];
  first: boolean;
  last: boolean;
  busy: boolean;
  onPatch: (p: Partial<TaskItem>) => Promise<boolean>;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
  onSection: (sid: string | null) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [detail, setDetail] = useState(item.detail ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  async function commitTitle() {
    const v = title.trim();
    if (v === item.title) { setTitle(item.title); setErr(null); return; }
    const problem = checkTitle(title);
    if (problem) { setErr(`${problem} The previous title was put back.`); setTitle(item.title); return; }
    setErr(null);
    const ok = await onPatch({ title: v });
    if (!ok) setTitle(item.title);
    else setTitle(v);
  }

  async function commitDetail() {
    const v = detail.trim();
    if (v === (item.detail ?? "")) return;
    const ok = await onPatch({ detail: v === "" ? null : v });
    if (!ok) setDetail(item.detail ?? "");
  }

  const id = `tk-manage-t-${item.id}`;
  return (
    <div className={`tk-row tk-manage-check${item.active ? "" : " is-paused"}`}>
      <div className="tk-manage-check-head">
        <label className="tk-sr" htmlFor={id}>Check title</label>
        <input
          id={id}
          type="text"
          className="tk-input"
          value={title}
          maxLength={MAX + 40}
          aria-invalid={err ? true : undefined}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        />
        {!item.active && <span className="tk-chip warn">Paused</span>}
      </div>
      <label className="tk-sr" htmlFor={`${id}-d`}>Detail, optional</label>
      <input
        id={`${id}-d`}
        type="text"
        className="tk-input"
        placeholder="Detail, optional"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        onBlur={commitDetail}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
      <div className="tk-f">
        <label htmlFor={`${id}-s`}>Section</label>
        <select id={`${id}-s`} className="tk-manage-select" value={item.section_id ?? ""} onChange={(e) => onSection(e.target.value === "" ? null : e.target.value)}>
          <option value="">No section</option>
          {sections.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </div>
      {err && <p className="tk-manage-fielderr" role="alert">{err}</p>}
      {confirm ? (
        <div className="tk-manage-confirm" role="alert">
          <p>Delete this check? It also removes its history.</p>
          <button type="button" className="tk-btn tk-sm" onClick={onDelete}>Delete</button>
          <button type="button" className="tk-btn tk-sm tk-quiet" onClick={() => setConfirm(false)}>Keep</button>
        </div>
      ) : (
        <div className="tk-manage-actions">
          <button type="button" className="tk-btn tk-sm" disabled={first || busy} onClick={() => onMove(-1)}>Move Up</button>
          <button type="button" className="tk-btn tk-sm" disabled={last || busy} onClick={() => onMove(1)}>Move Down</button>
          <button type="button" className="tk-btn tk-sm" onClick={() => onPatch({ active: !item.active })}>{item.active ? "Pause" : "Resume"}</button>
          <button type="button" className="tk-btn tk-sm" onClick={() => setConfirm(true)}>Delete</button>
        </div>
      )}
    </div>
  );
}

function AddRow({ idKey, onAdd }: { idKey: string; onAdd: (title: string) => Promise<boolean> }) {
  const [title, setTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const problem = checkTitle(title);
    if (problem) { setErr(problem); ref.current?.focus(); return; }
    setErr(null);
    setBusy(true);
    const ok = await onAdd(title);
    setBusy(false);
    if (ok) { setTitle(""); ref.current?.focus(); }
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: 8 }}>
      <div className="tk-manage-add">
        <label className="tk-sr" htmlFor={`tk-manage-new-${idKey}`}>New check title</label>
        <input
          id={`tk-manage-new-${idKey}`}
          ref={ref}
          type="text"
          className="tk-input"
          placeholder="New check"
          value={title}
          maxLength={MAX + 40}
          aria-invalid={err ? true : undefined}
          onChange={(e) => { setTitle(e.target.value); setErr(null); }}
        />
        <button type="submit" className="tk-btn tk-primary" disabled={busy}>Add Check</button>
      </div>
      {err && <p className="tk-manage-fielderr" role="alert">{err}</p>}
    </form>
  );
}
