// src/pages/api/sendCode.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).send("Missing parameters");

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apikey", // SendGrid username
        pass: process.env.SENDGRID_API_KEY,
      },
    });

    await transporter.sendMail({
      from: "your_verified_email@example.com",
      to: email,
      subject: "Your 30% Discount Code for Upcoming Ebook 🎉",
      html: `<p>Thank you for registering! Use this 30% discount code on launch: <b>${code}</b></p>`,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
}
