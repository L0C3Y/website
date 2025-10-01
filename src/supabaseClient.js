import { createClient } from "@supabase/supabase-js";

// ✅ Replace with your real Supabase project values
const supabaseUrl = "https://YOUR_PROJECT_ID.supabase.co"; // quotes are required
const supabaseAnonKey = "YOUR_ANON_KEY";                   // quotes are required

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
