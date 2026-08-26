# RideMate — 8-Week Sprint Plan

One sprint per week, 8 sprints total. Sprints 1–2 are due for demo tomorrow and are already implemented in this repo.

Current focus: ship a working **AI Chatbox Helpline** end-to-end first (rule-based now, real-LLM upgrade in Sprint 4). The previously-listed AI ride-matching features (route matching, fair fare calculation, reliability prediction, smart pickup suggestions, recurring ride prediction, traffic-aware cost estimation) are deliberately deferred to Sprints 5–6.

---

## Sprint 1 (Week 1) — Foundation & Project Setup
**Status: ✅ Done (demo-ready)**

Goal: stand up the technical foundation, dev process, and repo/CI scaffolding.

- [x] Initialize git repo, `.gitignore`, initial commit of existing landing page
- [x] Scaffold Express + TypeScript backend (`server/`) with a health-check endpoint
- [x] Wire React Router into the frontend (`/`, `/rides`)
- [x] Define API contract for rides (`GET/POST /api/rides`, `POST /api/rides/:id/join`) and chatbot (`POST /api/chatbot/message`)
- [x] Set up GitHub Actions CI pipeline (lint, typecheck, build — frontend + backend)
- [x] Draft use case diagram and sequence diagram for the whole app
- [x] Set up scrum board (GitHub Projects)

**Deliverable:** repo with green CI, backend reachable from frontend via dev proxy, diagrams + board in place.

---

## Sprint 2 (Week 2) — Core Ride Flow + AI Chatbox Helpline MVP
**Status: ✅ Done (demo-ready)**

Goal: a demoable slice of the real product — students can browse/create/join rides, and get help from the AI chatbox helpline.

- [x] Backend: in-memory ride store, `GET/POST /api/rides`, `POST /api/rides/:id/join`
- [x] Frontend: Rides page — create-ride form, ride list, join button, seat counts
- [x] AI Chatbox Helpline: floating widget on every page (`ChatboxWidget.tsx`)
- [x] Chatbot backend: rule-based keyword-matching engine covering create ride, join ride, fares, safety/trust, supported universities, AI-roadmap questions, and human-agent escalation
- [x] Navbar wired to real routes (Home / Find a Ride / Create Ride)

**Deliverable:** working app — create a ride, join a ride, and chat with the helpline bot, all backed by a real (if simple) backend.

---

## Sprint 3 (Week 3) — Auth & Persistent Data
**Status: ✅ Done**

Goal: move off in-memory storage and add real accounts.

- [x] Add a database (SQLite via Prisma) replacing the in-memory `rides` array
- [x] University-email-based signup/login, JWT session auth
- [x] Protect ride creation/join behind auth; attach rides to a real user
- [x] Persist chatbot conversation logs (for later support review + AI upgrade)
- [x] Extend CI to run DB migrations in the pipeline

**Deliverable:** accounts persist across restarts; rides are owned by real users.

---

## Sprint 4 (Week 4) — AI Chatbox Helpline v2 (Real LLM Integration)
**Status: ✅ Done (demo-ready)**

Goal: upgrade the helpline from rule-based to a real AI-backed assistant.

- [x] Integrate an LLM API (Groq/Llama 3.3 70B — chosen over Claude for free-tier access without regional/billing friction) behind the backend so the key never reaches the browser
- [x] Maintain per-session conversation context/history
- [x] Scope/guardrail the assistant to RideMate topics; keep the human-escalation path
- [x] Store chat transcripts for support review and quality tuning
- [ ] Compare rule-based vs. AI reply accuracy on a fixed FAQ test set before fully cutting over (rule-based engine still kept as an automatic fallback if the AI call fails)

**Deliverable:** chatbox gives real AI-generated, context-aware answers instead of fixed replies.

---

## Sprint 5 (Week 5) — AI Ride Matching, Phase 1
**Status: ✅ Done**

Goal: begin the deferred AI matching feature set.

- [x] "Recommended rides for you" section on the Rides page — scored against the rider's actual past booking history (origin/destination frequency)
- [x] Route-matching algorithm — rides now store real origin/destination coordinates (pinned on a map at creation); recommendations use Haversine distance so a ride within ~3km of a route the rider has taken before is surfaced even if the text label is completely different (verified: "North South" vs. "NSU Bashundhara Campus")
- [x] Fair fare calculation — suggested fare is computed from actual trip distance (base fare + rate/km) instead of the driver guessing a flat number; driver can still override it

**Deliverable:** ride recommendations are no longer just a static list — they're matched to the student's real route, and fares are grounded in real distance instead of guesswork. Time-of-day/traffic-aware fare refinement is deferred to Sprint 6 ("Traffic-aware cost estimation"), which already covers that.

---

## Sprint 6 (Week 6) — AI Ride Matching, Phase 2 + Trust & Safety
**Status: ✅ Done**

Goal: complete the AI feature set and add the safety layer that supports it.

- [x] Reliability prediction (driver/rider score from ride history)
- [x] Smart pickup-point suggestions — driver marks their actual intended route (not just origin/destination labels); riders see that path on the map and pick a pickup point that's genuinely on the way, instead of guessing between two endpoints
- [x] Recurring-ride prediction (detect regular commute patterns, suggest auto-matching)
- [x] Traffic-aware cost estimation (integrate a maps/traffic API)
- [x] Trust score + rating UI shown on ride cards and profiles

**Deliverable:** all six originally-listed AI features live; trust score visible throughout the app.

---

## Sprint 7 (Week 7) — Native Mobile App & Polish
**Status: ✅ Done**

Goal: turn RideMate into a real installable Android app and bring it up to a professional, native feel.

- [x] Convert the app to a Capacitor-based Android app; integrate maps, ride time filtering, and favorites
- [x] Real device support — fix the APK's network layer (cleartext/security config) and simplify the fare UX for on-device testing
- [x] Free address autocomplete (no paid API dependency)
- [x] Branded app icon and cold-boot splash screen, replacing Capacitor's defaults, across every screen density and orientation
- [x] Skeleton loading states on all data-fetching screens (Passenger Home, Driver Home, My Requests, My Offered Rides, Activity)
- [x] Haptic feedback on button presses and toast notifications, app-wide
- [x] Native status bar theming (dark on splash, matches app background elsewhere)

**Deliverable:** a real, installable Android app with a native-feeling, branded experience — not just a wrapped webview.

---

## Sprint 8 (Week 8) — QA, Polish & Deployment
**Status: ✅ Done**

Goal: stabilize and ship a public beta.

- [x] End-to-end tests (Playwright) for the core flows — login, wrong-password handling, driver signup's vehicle-details step, chatbot, logout, plus two automated accessibility (axe-core) scans. Run locally via `npm run test:e2e`; not wired into CI (would need browser install + seeded DB + AI-provider secrets in the pipeline — judged not worth the CI time for this project's scale)
- [x] Backend integration tests (Vitest + Supertest) — auth (login, signup/OTP, password reset) and rides (create/list/auth-gating) routes; run in CI on every push
- [x] Accessibility and performance pass — axe-core scans caught a real WCAG AA color-contrast failure on the role-select cards (fixed); route-level code-splitting (`React.lazy`) cut the main JS bundle from 613KB to 405KB and eliminated Vite's chunk-size warning
- [x] Deployed: backend on Render (`ridemate-api`, Singapore, Postgres via Neon), frontend on Vercel — both auto-deploy from `main`
- [x] CI/CD auto-deploy — handled natively by Render's and Vercel's GitHub integrations (no custom deploy job needed); existing GitHub Actions CI (lint/typecheck/test/build) gates every push
- [ ] Sprint review, retrospective, and demo-day prep — not yet done

**Deliverable:** a deployed, tested, publicly reachable beta. ✅ Live at the Vercel/Render URLs.

---

## How this maps to the scrum board
Each checklist item above is one GitHub Projects card. Columns: **Backlog → In Progress → In Review → Done**. Sprint 1 and 2 cards should be moved to **Done** for tomorrow's demo; Sprint 3–8 cards sit in **Backlog**, pulled into **In Progress** one sprint at a time.
