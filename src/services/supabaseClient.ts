import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase URL & Anon Key
export const SUPABASE_URL = 
  (typeof process !== "undefined" && process.env?.SUPABASE_URL) ||
  import.meta.env?.VITE_SUPABASE_URL ||
  "https://genogaejxepnwaqmwoho.supabase.co";

export const SUPABASE_ANON_KEY = 
  (typeof process !== "undefined" && process.env?.SUPABASE_ANON_KEY) ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdlbm9nYWVqeGVwbndhcW13b2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NjIzMTQsImV4cCI6MjEwMjIzODMxNH0.5b2Tff8E5_2bYq8VlM9s2U3W8vM9s_placeholder"; // fallback anon key

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseInstance;
}
