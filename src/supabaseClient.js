// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Replace with your own Supabase project info
const supabaseUrl = "https://YOUR_PROJECT_URL.supabase.co";
const supabaseAnonKey = "YOUR_ANON_KEY"; // from Supabase → Project Settings → API

// Export the initialized client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
