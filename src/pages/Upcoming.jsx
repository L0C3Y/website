const handleRegister = async (email, ebookId, checkOnly = false) => {
  try {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("ebook_id", ebookId)
      .eq("email", email || ""); // if checkOnly, email can be null, you may need logic to pass session/email

    if (error) {
      console.error("Supabase error:", error.message);
      if (!checkOnly) alert("Registration failed. Try again.");
      return checkOnly ? { data: [] } : false;
    }

    if (checkOnly) return { data };

    if (data?.length > 0) {
      alert("You have already registered! Check your email for the discount code.");
      return false;
    }

    // Generate code & insert
    const code = "30OFF-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error: insertError } = await supabase
      .from("registrations")
      .insert([{ email, ebook_id: ebookId, code }]);

    if (insertError) {
      console.error("Supabase insert error:", insertError.message);
      alert("Failed to register. Try again.");
      return false;
    }

    // Send email
    await fetch("/api/sendCode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    alert("Registered! 🎉 Check your email for the 30% discount code.");
    return true;
  } catch (err) {
    console.error("Unexpected error:", err);
    if (!checkOnly) alert("Something went wrong. Try again.");
    return checkOnly ? { data: [] } : false;
  }
};
