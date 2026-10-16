import { NextResponse } from "next/server";
import { getTasksUser, type TasksUser } from "@/lib/auth";

export function fail(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

/** Resolve the caller for an API route. Returns a ready JSON error when they may not proceed. */
export async function requireUser(): Promise<
  { error: NextResponse; user?: undefined } | { error?: undefined; user: TasksUser }
> {
  const user = await getTasksUser();
  if (!user) return { error: fail(401, "Not signed in.") };
  if (!user.hasAccess) return { error: fail(403, "This account has no profile, so it cannot use Tasks.") };
  return { user };
}

export const isIsoDate = (s: string | null | undefined): s is string =>
  !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s + "T12:00:00Z").getTime());
