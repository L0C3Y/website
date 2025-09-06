// backend/models/users.js
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Create profile for new user
async function createProfile(userId, { username, email }) {
  const { data, error } = await supabase.from("profiles").insert([
    {
      id: userId,
      username,
      email,
      role: "user"
    }
  ]);
  if (error) throw error;
  return data[0];
}

async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

async function updateProfile(userId, fields) {
  const { data, error } = await supabase.from("profiles").update(fields).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}

async function deleteProfile(userId) {
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw error;

  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw authError;

  return true;
}

module.exports = { createProfile, getProfile, updateProfile, deleteProfile };