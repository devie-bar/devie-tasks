import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

// Exchanges the magic-link code for a session cookie, then sends the user into
// the hub. Excluded from the middleware auth-gate (see middleware matcher).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (code) {
    const supabase = createPublicClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
