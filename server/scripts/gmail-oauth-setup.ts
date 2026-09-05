// One-time helper to get a Gmail API refresh token for OTP email sending.
//
// Prerequisite (Google Cloud Console, console.cloud.google.com):
//   1. Create a project (or use an existing one).
//   2. APIs & Services > Library > enable the "Gmail API".
//   3. APIs & Services > OAuth consent screen > User Type "External" > add the
//      Gmail/university address that should send RideMate's emails as a test user.
//   4. APIs & Services > Credentials > Create Credentials > OAuth client ID >
//      Application type "Desktop app". Copy the Client ID and Client Secret.
//
// Usage:
//   npx tsx scripts/gmail-oauth-setup.ts <client-id> <client-secret>
//
// This opens a URL for you to visit and sign in as the sending address. After you
// approve, it prints the three env vars (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET,
// GMAIL_REFRESH_TOKEN) to paste into server/.env and Render's Environment tab.
import http from "node:http";

const [CLIENT_ID, CLIENT_SECRET] = process.argv.slice(2);
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Usage: npx tsx scripts/gmail-oauth-setup.ts <client-id> <client-secret>");
  process.exit(1);
}

// "Desktop app" OAuth clients support any loopback port without pre-registering it
// (RFC 8252) — no need to add this exact port to the client's allowed redirect URIs.
const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}`;

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/gmail.send");
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

console.log("\nOpen this URL, sign in as the address that should send RideMate's emails, and approve:\n");
console.log(authUrl.toString());
console.log(`\nWaiting for the redirect back to ${REDIRECT_URI} ...\n`);

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "", REDIRECT_URI);
  const code = url.searchParams.get("code");

  if (!code) {
    res.end("No authorization code received — check the terminal and try again.");
    return;
  }

  res.end("Done — you can close this tab and go back to the terminal.");
  server.close();

  fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  })
    .then(async (tokenRes) => {
      const data = await tokenRes.json();
      if (!tokenRes.ok || !data.refresh_token) {
        console.error("Token exchange failed:", data);
        process.exit(1);
      }
      console.log("\nAdd these to server/.env (and Render's Environment tab):\n");
      console.log(`GMAIL_CLIENT_ID="${CLIENT_ID}"`);
      console.log(`GMAIL_CLIENT_SECRET="${CLIENT_SECRET}"`);
      console.log(`GMAIL_REFRESH_TOKEN="${data.refresh_token}"`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Token exchange request failed:", err);
      process.exit(1);
    });
});

server.listen(PORT);
