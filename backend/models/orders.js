const { supabase } = require("../supabase");
const Order = require('./orders');

// Create new order
async function createOrder(userId, ebookId, affiliateCode, amount, currency = "INR") {
  const { data, error } = await supabase
    .from("orders")
    .insert([{ user_id: userId, ebook_id: ebookId, affiliate_code: affiliateCode, amount, currency }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update order status
async function updateOrderStatus(orderId, status, paymentData = {}) {
  const { data, error } = await supabase
    .from("orders")
    .update({
      status,
      razorpay_order_id: paymentData.razorpay_order_id || null,
      razorpay_payment_id: paymentData.razorpay_payment_id || null,
      razorpay_signature: paymentData.razorpay_signature || null,
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get orders by user
async function getOrdersByUser(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, ebooks(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

module.exports = { createOrder, updateOrderStatus, getOrdersByUser };
