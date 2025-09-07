const { supabase } = require("../supabase");
const Order = require('./orders');

// Create new order
async function createOrder(userId, ebookId) {
  const { data, error } = await supabase
    .from("orders")
    .insert([{ user_id: userId, ebook_id: ebookId, status: "pending" }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all orders for a user
async function getOrdersByUser(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Update order status
async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = { createOrder, getOrdersByUser, updateOrderStatus };