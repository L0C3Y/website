const { supabase, supabaseAdmin } = require("../supabase");

// Fetch published ebooks
async function getAllEbooks() {
  const { data, error } = await supabase
    .from("ebooks")
    .select("*")
    .eq("status", "published")
    .order("id", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Fetch upcoming ebooks
async function getUpcomingEbooks() {
  const { data, error } = await supabase
    .from("ebooks")
    .select("*")
    .eq("status", "upcoming")
    .order("release_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Register user for upcoming ebook discount
async function registerForUpcoming(ebookId, email) {
  const { data, error } = await supabaseAdmin
    .from("upcoming_registrations")
    .upsert({ ebook_id: ebookId, email }, { onConflict: "ebook_id,email" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  getAllEbooks,
  getUpcomingEbooks,
  registerForUpcoming,
};