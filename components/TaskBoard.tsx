"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTask, toggleDone, updateTask, deleteTask } from "@/app/actions";

export type TaskRow = {
  id: string;
  title: string;
  scope: "team" | "personal";
  assignee_id: string | null;
  due_date: string | null;
  done: boolean;
  done_at: string | null;
  created_at: string;
};
export type Member = { id: string; full_name: string | null; email: string | null };

const todayISO = () => new Date().toISOString().slice(0, 10);

export function TaskBoard({
  scope, title, subtitle, tasks, members, currentUserId,
}: {
  scope: "team" | "personal";
  title: string;
  subtitle: string;
  tasks: TaskRow[];
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDue, setNewDue] = useState("");
  const [filter, setFilter] = useState("all");

  const nameOf = useMemo(() => {
    const m = new Map(members.map((x) => [x.id, x.full_name || x.email || "Someone"]));
    return (id: string | null) => (id ? m.get(id) || "Someone" : null);
  }, [members]);

  const run = (fn: () => Promise<void>, after?: () => void) => {
    setErr(null);
    start(async () => {
      try { await fn(); after?.(); router.refresh(); }
      catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    });
  };

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const t = newTitle.trim();
    if (!t) return;
    run(
      () => addTask({ title: t, scope, assigneeId: scope === "team" ? newAssignee || null : null, dueDate: newDue || null }),
      () => { setNewTitle(""); setNewAssignee(""); setNewDue(""); },
    );
  };

  const today = todayISO();
  const visible = useMemo(() => {
    if (scope !== "team" || filter === "all") return tasks;
    if (filter === "me") return tasks.filter((t) => t.assignee_id === currentUserId);
    if (filter === "unassigned") return tasks.filter((t) => !t.assignee_id);
    return tasks;
  }, [tasks, filter, scope, currentUserId]);

  const open = visible.filter((t) => !t.done);
  const done = visible.filter((t) => t.done);

  const itemProps = { scope, members, nameOf, today, pending, run } as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-extralight tracking-[-0.03em] text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
      </div>

      <form onSubmit={onAdd} className="flex flex-wrap items-center gap-2 rounded-xl border border-paper-line bg-paper-card p-3">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task…"
          className="min-w-[200px] flex-1 rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        {scope === "team" && (
          <select
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            className="rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
            aria-label="Assign to"
          >
            <option value="">Anyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={newDue}
          onChange={(e) => setNewDue(e.target.value)}
          className="rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
          aria-label="Due date"
        />
        <button
          type="submit"
          disabled={pending || !newTitle.trim()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-soft disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {scope === "team" && members.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-muted">Filter:</span>
          {[{ k: "all", label: "All" }, { k: "me", label: "Mine" }, { k: "unassigned", label: "Unassigned" }].map((f) => (
            <button
              key={f.k}
              type="button"
              onClick={() => setFilter(f.k)}
              className={`rounded-full border px-3 py-1 transition ${filter === f.k ? "border-brand bg-brand-wash text-brand" : "border-paper-line text-ink-soft hover:bg-paper-line/50"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {err && <p className="text-sm text-rose-700">{err}</p>}

      <ul className="divide-y divide-paper-line overflow-hidden rounded-xl border border-paper-line bg-paper-card">
        {open.map((t) => <TaskItem key={t.id} t={t} {...itemProps} />)}
        {open.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-ink-muted">
            {done.length > 0 ? "All done — nice." : "Nothing here yet. Add your first task above."}
          </li>
        )}
      </ul>

      {done.length > 0 && (
        <details className="overflow-hidden rounded-xl border border-paper-line bg-paper-card">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink-soft">Done ({done.length})</summary>
          <ul className="divide-y divide-paper-line border-t border-paper-line">
            {done.map((t) => <TaskItem key={t.id} t={t} {...itemProps} />)}
          </ul>
        </details>
      )}
    </div>
  );
}

function TaskItem({ t, scope, members, today, pending, run }: {
  t: TaskRow;
  scope: "team" | "personal";
  members: Member[];
  nameOf: (id: string | null) => string | null;
  today: string;
  pending: boolean;
  run: (fn: () => Promise<void>, after?: () => void) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(t.title);
  const overdue = !t.done && !!t.due_date && t.due_date < today;

  const saveTitle = () => {
    const v = draft.trim();
    setEditing(false);
    if (!v || v === t.title) { setDraft(t.title); return; }
    run(() => updateTask(t.id, { title: v }, scope));
  };

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <input
        type="checkbox"
        checked={t.done}
        disabled={pending}
        onChange={(e) => run(() => toggleDone(t.id, e.target.checked, scope))}
        className="h-4 w-4 shrink-0 cursor-pointer accent-[#025B4C]"
        aria-label={t.done ? "Mark not done" : "Mark done"}
      />

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") { setDraft(t.title); setEditing(false); }
            }}
            className="w-full rounded border border-paper-line bg-white px-2 py-1 text-sm text-ink outline-none focus:border-brand"
          />
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(t.title); setEditing(true); }}
            className={`block w-full truncate text-left text-sm ${t.done ? "text-ink-muted line-through" : "text-ink"}`}
            title="Click to rename"
          >
            {t.title}
          </button>
        )}
      </div>

      {scope === "team" && (
        <select
          value={t.assignee_id ?? ""}
          disabled={pending}
          onChange={(e) => run(() => updateTask(t.id, { assigneeId: e.target.value || null }, scope))}
          className="shrink-0 rounded-md border border-paper-line bg-white px-2 py-1 text-xs text-ink-soft outline-none focus:border-brand"
          aria-label="Assignee"
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
          ))}
        </select>
      )}

      <input
        type="date"
        value={t.due_date ?? ""}
        disabled={pending}
        onChange={(e) => run(() => updateTask(t.id, { dueDate: e.target.value || null }, scope))}
        className={`shrink-0 rounded-md border bg-white px-2 py-1 text-xs outline-none focus:border-brand ${overdue ? "border-rose-300 text-rose-700" : "border-paper-line text-ink-soft"}`}
        aria-label="Due date"
      />

      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => deleteTask(t.id, scope))}
        className="shrink-0 rounded-md px-2 py-1 text-xs text-ink-muted hover:bg-rose-50 hover:text-rose-700"
        aria-label="Delete task"
        title="Delete"
      >
        ✕
      </button>
    </li>
  );
}
