// Brevo's transactional HTTP API, not SMTP: Render's free tier blocks all
// outbound SMTP traffic (ports 25/465/587) to stop spam abuse, which silently
// hung every send attempt from the live deployment even though it worked fine
// from a dev machine. An HTTPS API call isn't SMTP, so it isn't blocked.
// Sender is a single verified email (app.brevo.com/senders), not a domain —
// no domain ownership required, unlike Resend's non-sandbox mode.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  if (!apiKey || !fromEmail) {
    throw new Error("BREVO_API_KEY / EMAIL_FROM is not configured");
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: "RideMate", email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API error ${res.status}: ${body}`);
  }
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
