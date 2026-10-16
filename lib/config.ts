// Public Supabase config, the shared De Vie Database project (also home to the
// Liquid Library and Finance). The URL and publishable key are safe to embed in
// the client bundle by design, row access is enforced server-side by RLS.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://izkvvdlkdywtvzmqmvos.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_KKlRhZx1kpp1lztC4C-bsQ_fQ2pLXoG";
