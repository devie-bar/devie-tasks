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
        // called from a Server Component, middleware refreshes the session
      }
    },
  };
}

// Public schema (profiles, auth helpers). Reads run as the signed-in user.
export function createPublicClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: cookieAdapter(),
  });
}

// Finance schema, the dashboard reads finance's read-only aggregate RPCs/views
// (pnl_range, labour_monthly, v_invoice_register) to source live KPIs. All reads
// run as the signed-in user and are gated by finance RLS / has_finance_access().
export function createFinanceClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: "finance" },
    cookies: cookieAdapter(),
  });
}
