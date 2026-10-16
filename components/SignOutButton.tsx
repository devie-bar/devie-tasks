"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string } = {}) {
  const router = useRouter();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  }
  return (
    <button
      onClick={signOut}
      className={className ?? "rounded-lg border border-paper-line px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-paper-line/50"}
    >
      Sign out
    </button>
  );
}
