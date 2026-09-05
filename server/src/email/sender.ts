// Gmail API over plain HTTPS — not SMTP. Render's free tier blocks outbound SMTP
// (ports 25/465/587) to stop spam abuse; a prior attempt at Gmail SMTP (nodemailer)
// worked locally but hung indefinitely in production for exactly that reason (see
// git history on this file). The Gmail API's users.messages.send endpoint is a
// normal HTTPS POST, so it isn't affected — while still being genuinely sent by
// Google, so it passes DMARC for recipients (Gmail, Google Workspace, etc.) that
// a third-party relay claiming an unauthenticated From address cannot.
//
// Auth is a one-time OAuth2 consent (run `tsx scripts/gmail-oauth-setup.ts
// <client-id> <client-secret>` and follow the prompts) that produces a long-lived
// refresh token; each send exchanges it for a short-lived access token.
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_USER &&
      process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN,
  );
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.token;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google OAuth token refresh failed ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedAccessToken.token;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Gmail API wants a full raw RFC 2822 message, base64url-encoded, not a {to,subject,html} shape.
function buildRawMessage(to: string, from: string, subject: string, html: string): string {
  const message = [
    `From: "RideMate" <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ].join("\r\n");
  return base64UrlEncode(message);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error("Gmail API OAuth credentials are not configured");
  }

  const [accessToken, from] = [await getAccessToken(), process.env.GMAIL_USER!];

  const res = await fetch(SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ raw: buildRawMessage(to, from, subject, html) }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gmail API send failed ${res.status}: ${body}`);
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
