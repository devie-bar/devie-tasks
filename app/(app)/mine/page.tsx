import { createPublicClient } from "@/lib/supabase/server";
import { getTasksUser } from "@/lib/auth";
import { TaskBoard, type TaskRow, type Member } from "@/components/TaskBoard";

export const dynamic = "force-dynamic";

export default async function MyTasksPage() {
  const user = await getTasksUser();
  const supabase = createPublicClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, scope, assignee_id, due_date, done, done_at, created_at")
    .eq("scope", "personal")
    .order("done", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <TaskBoard
      scope="personal"
      title="My tasks"
      subtitle="Your private checklist — only you can see these."
      tasks={(tasks ?? []) as TaskRow[]}
      members={[]}
      currentUserId={user?.id ?? ""}
    />
  );
}
