import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

function cookieAdapter() {
  const cookieStore = cookies();
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: { name: string; value: string; options?: unknown }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          // @ts-expect-error - options shape from @supabase/ssr is compatible
          cookieStore.set(name, value, options)
        );
      } catch {
        // called from a Server Component — middleware refreshes the session
      }
    },
  };
}

// Public schema (profiles, tasks). Reads/writes run as the signed-in user and
// are gated by RLS.
export function createPublicClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: cookieAdapter(),
  });
}
