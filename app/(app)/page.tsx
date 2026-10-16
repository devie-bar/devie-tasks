import { createPublicClient } from "@/lib/supabase/server";
import { getTasksUser } from "@/lib/auth";
import { TaskBoard, type TaskRow, type Member } from "@/components/TaskBoard";

export const dynamic = "force-dynamic";

export default async function TeamTasksPage() {
  const user = await getTasksUser();
  const supabase = createPublicClient();
  const [{ data: tasks }, { data: members }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, scope, assignee_id, due_date, done, done_at, created_at")
      .eq("scope", "team")
      .order("done", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("status", "active")
      .order("full_name"),
  ]);

  return (
    <TaskBoard
      scope="team"
      title="Team tasks"
      subtitle="Shared across everyone — assign them, set due dates, tick them off."
      tasks={(tasks ?? []) as TaskRow[]}
      members={(members ?? []) as Member[]}
      currentUserId={user?.id ?? ""}
    />
  );
}
