const { createClient } = require("@supabase/supabase-js");
const { SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE } = require("./config");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);                 // safe client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);   // admin ops (server-only)

module.exports = { supabase, supabaseAdmin };