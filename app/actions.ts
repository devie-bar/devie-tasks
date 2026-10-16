"use server";

import { revalidatePath } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import { getTasksUser } from "@/lib/auth";

type Scope = "team" | "personal";

async function requireUser() {
  const user = await getTasksUser();
  if (!user || !user.hasAccess) throw new Error("Not signed in.");
  return { user, supabase: createPublicClient() };
}

const revalidate = (scope: Scope) => revalidatePath(scope === "personal" ? "/mine" : "/");

export async function addTask(input: {
  title: string; scope: Scope; assigneeId?: string | null; dueDate?: string | null;
}) {
  const { user, supabase } = await requireUser();
  const title = input.title.trim();
  if (!title) throw new Error("A task needs a title.");
  const { error } = await supabase.from("tasks").insert({
    title,
    scope: input.scope,
    created_by: user.id,
    owner_id: input.scope === "personal" ? user.id : null,
    assignee_id: input.scope === "team" ? (input.assigneeId || null) : null,
    due_date: input.dueDate || null,
  });
  if (error) throw new Error(error.message);
  revalidate(input.scope);
}

export async function toggleDone(id: string, done: boolean, scope: Scope) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks")
    .update({ done, done_at: done ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidate(scope);
}

export async function updateTask(
  id: string,
  patch: { title?: string; assigneeId?: string | null; dueDate?: string | null },
  scope: Scope,
) {
  const { supabase } = await requireUser();
  const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) throw new Error("A task needs a title.");
    upd.title = t;
  }
  if (patch.assigneeId !== undefined) upd.assignee_id = patch.assigneeId || null;
  if (patch.dueDate !== undefined) upd.due_date = patch.dueDate || null;
  const { error } = await supabase.from("tasks").update(upd).eq("id", id);
  if (error) throw new Error(error.message);
  revalidate(scope);
}

export async function deleteTask(id: string, scope: Scope) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidate(scope);
}
