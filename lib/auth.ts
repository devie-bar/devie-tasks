import { createPublicClient } from "@/lib/supabase/server";

export interface TasksUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
  hasAccess: boolean;
}

// Tasks is open to any active De Vie account — staff or an invited partner with
// a profile row. Access is simply: signed in and the profile is active.
export async function getTasksUser(): Promise<TasksUser | null> {
  const supabase = createPublicClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  const status = profile?.status ?? "active";
  return {
    id: user.id,
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: profile?.role ?? "viewer",
    hasAccess: status === "active",
  };
}
