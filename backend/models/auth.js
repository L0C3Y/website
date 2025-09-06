// backend/models/auth.js
const { createClient } = require("@supabase/supabase-js");

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // secure server-side
const supabase = createClient(supabaseUrl, supabaseKey);

// Register new user
async function register(email, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw error;
  return data.user;
}

// Login user
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.session; // contains access + refresh token
}

// Logout
async function logout(refreshToken) {
  const { error } = await supabase.auth.admin.signOut(refreshToken);
  if (error) throw error;
  return { message: "Logged out" };
}

module.exports = { register, login, logout };