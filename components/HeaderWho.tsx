"use client";

import { useTasks } from "@/components/TasksProvider";
import { AccountMenu } from "@/components/AccountMenu";

/** The account controls at the right of the green strip, where the Library puts its EN/FR toggle. */
export function HeaderWho({ name, email }: { name: string; email?: string | null }) {
  const { status } = useTasks();
  return (
    <div className="tk-who">
      <span className="tk-st" aria-live="polite">{status}</span>
      <AccountMenu name={name} email={email} />
    </div>
  );
}
