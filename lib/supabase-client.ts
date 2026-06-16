import { createClient } from '@supabase/supabase-js';

// Browser-only Supabase client — used exclusively for Realtime subscriptions.
// The anon key is safe to expose in the browser (Supabase RLS controls access).
// All actual data queries go through our own API routes (/api/teams/...) using
// the cxgrd JWT, not Supabase Auth.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Singleton — reuse across hot reloads in dev
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
