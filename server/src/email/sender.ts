import nodemailer from "nodemailer";

// Gmail SMTP, not a transactional email API: no free provider we tried survived
// contact with reality without a domain we don't own — Resend restricts free
// delivery to the account owner's own email, SendGrid's free tier is now a
// 60-day trial, and Brevo's signup requires phone verification that wouldn't
// go through for this number. Gmail SMTP + an App Password needs none of that.
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD is not configured");
  }

  await t.sendMail({
    from: `"RideMate" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export function sendOtpEmail(to: string, name: string, code: string): Promise<void> {
  return sendEmail(
    to,
    "Your RideMate verification code",
    `<p>Hi ${name},</p><p>Your RideMate verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  );
}

export function sendPasswordResetEmail(to: string, name: string, code: string): Promise<void> {
  return sendEmail(
    to,
    "Reset your RideMate password",
    `<p>Hi ${name},</p><p>Your RideMate password reset code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email — your password won't change.</p>`,
  );
}
