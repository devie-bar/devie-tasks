"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "Live" | "Reconnecting";
interface Ctx { displayName: string; status: Status; }
const TasksCtx = createContext<Ctx>({ displayName: "Someone", status: "Live" });
export const useTasks = () => useContext(TasksCtx);

/**
 * Holds the signed-in name (the default "Done by") and a connection word for the
 * header. The word is realtime state on task_completions: a status is a word,
 * never only a dot (DESIGN.md 2.2).
 */
export function TasksProvider({ displayName, children }: { displayName: string; children: ReactNode }) {
  const [status, setStatus] = useState<Status>("Reconnecting");
  useEffect(() => {
    const sb = createClient();
    const ch = sb.channel("tasks-status").subscribe((s) => setStatus(s === "SUBSCRIBED" ? "Live" : "Reconnecting"));
    return () => { sb.removeChannel(ch); };
  }, []);
  const value = useMemo(() => ({ displayName, status }), [displayName, status]);
  return <TasksCtx.Provider value={value}>{children}</TasksCtx.Provider>;
}
