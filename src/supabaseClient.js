import { createClient } from "@supabase/supabase-js";

const supabaseUrl =https//wqwmzwsvgbqouoponuku.supabase.co
const supabaseAnonKey =eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxd216d3N2Z2Jxb3VvcG9udWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTQ5NzAsImV4cCI6MjA3MjEzMDk3MH09XByssM-ejdmz_nAYOZn4KmVc4vb-ILnKVMOLp3Oe9s

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
