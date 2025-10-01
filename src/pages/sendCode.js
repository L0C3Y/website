import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { email, code } = req.body;

  const msg = {
    to: email,
    from: "noreply@yourdomain.com",
    subject: "Your 30% Discount Code for Ebook",
    text: `Here’s your 30% discount code: ${code}`,
    html: `<strong>Here’s your 30% discount code:</strong> ${code}`,
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send email" });
  }
}
