import { createPublicClient } from "@/lib/supabase/server";

export interface TasksUser {
  id: string;
  email: string | null;
  fullName: string | null;
  /** Name used as the default "Done by" name: profiles.full_name, else the email local part. */
  displayName: string;
  /** Anyone with a row in public.profiles may use Tasks. */
  hasAccess: boolean;
}

// Same Supabase project, login and middleware as the dashboard. The dashboard
// gates on a hasDashboard flag (role admin/team); Tasks gates on having a
// profile row, which matches the RLS policies in the tasks migration.
export async function getTasksUser(): Promise<TasksUser | null> {
  const supabase = createPublicClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const email = profile?.email ?? user.email ?? null;
  const fullName = (profile?.full_name as string | null) ?? null;
  const local = email ? email.split("@")[0] : "";
  return {
    id: user.id,
    email,
    fullName,
    displayName: (fullName && fullName.trim()) || local || "Someone",
    hasAccess: !!profile,
  };
}
