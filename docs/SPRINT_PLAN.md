# RideMate — 7-Week Sprint Plan

One sprint per week, 7 sprints total. Sprints 1–2 are due for demo tomorrow and are already implemented in this repo.

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
**Status: 🟡 Partially done (scoped for time)**

Goal: begin the deferred AI matching feature set.

- [x] "Recommended rides for you" section on the Rides page — scored against the rider's actual past booking history (origin/destination frequency), not a placeholder or random pick
- [ ] Full route-matching algorithm (geographic proximity, not just exact origin/destination string match)
- [ ] Fair fare calculation (distance/time-based split, not just flat per-seat fare)

**Deliverable:** ride recommendations are no longer just a static list — they're matched to the student's route. (Shipped a real, working v1 based on booking history; full geographic matching and fare-splitting deferred to keep scope realistic for the demo timeline.)

---

## Sprint 6 (Week 6) — AI Ride Matching, Phase 2 + Trust & Safety
Goal: complete the AI feature set and add the safety layer that supports it.

- [ ] Reliability prediction (driver/rider score from ride history)
- [ ] Smart pickup-point suggestions — driver marks their actual intended route (not just origin/destination labels); riders see that path on the map and pick a pickup point that's genuinely on the way, instead of guessing between two endpoints
- [ ] Recurring-ride prediction (detect regular commute patterns, suggest auto-matching)
- [ ] Traffic-aware cost estimation (integrate a maps/traffic API)
- [ ] Trust score + rating UI shown on ride cards and profiles

**Deliverable:** all six originally-listed AI features live; trust score visible throughout the app.

---

## Sprint 7 (Week 7) — QA, Polish & Deployment
Goal: stabilize and ship a public beta.

- [ ] End-to-end tests (Playwright/Cypress) for the core ride + chatbot flows
- [ ] Backend integration tests
- [ ] Accessibility and performance pass
- [ ] Deploy backend (Render/Railway) and frontend (Vercel/Netlify); wire env vars + domain
- [ ] Add a deploy job to CI/CD (auto-deploy on merge to `main`)
- [ ] Sprint review, retrospective, and demo-day prep

**Deliverable:** a deployed, tested, publicly reachable beta.

---

## How this maps to the scrum board
Each checklist item above is one GitHub Projects card. Columns: **Backlog → In Progress → In Review → Done**. Sprint 1 and 2 cards should be moved to **Done** for tomorrow's demo; Sprint 3–7 cards sit in **Backlog**, pulled into **In Progress** one sprint at a time.
