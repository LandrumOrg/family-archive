import { createBrowserClient } from "@supabase/ssr";

// Used in Client Components ("use client"). Reads the public
// anon key — safe to expose, since real access control happens
// via Row Level Security policies in Postgres, not this key.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
