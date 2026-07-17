# RideMate — Scrum Board (GitHub Projects)

Board: **RideMate Dev** (GitHub Projects, board view). Columns: `Backlog` → `In Progress` → `In Review` → `Done`.
Each line below is one card/issue. Sprint number is a label on the card (`sprint-1` … `sprint-7`).

## Done (Sprint 1)
- [x] Initialize git repo + `.gitignore`
- [x] Scaffold Express + TypeScript backend with health-check endpoint
- [x] Wire React Router into frontend (`/`, `/rides`)
- [x] Define API contract: rides (list/create/join), chatbot (message)
- [x] Set up GitHub Actions CI (lint, typecheck, build — frontend + backend)
- [x] Draft use case diagram + sequence diagram
- [x] Set up GitHub Projects scrum board

## Done (Sprint 2)
- [x] Backend: in-memory ride store + `GET/POST /api/rides`, `POST /api/rides/:id/join`
- [x] Frontend: Rides page (create form, ride list, join button)
- [x] AI Chatbox Helpline widget (floating, on every page)
- [x] Chatbot backend: rule-based FAQ engine (create/join ride, fares, safety, universities, escalation)
- [x] Navbar wired to real routes

## Backlog (Sprint 3 — Auth & Persistent Data)
- [ ] Add database (Prisma + SQLite/Postgres) replacing in-memory store
- [ ] University-email signup/login, JWT sessions
- [ ] Protect ride creation/join behind auth
- [ ] Persist chatbot conversation logs
- [ ] Extend CI to run DB migrations

## Backlog (Sprint 4 — AI Chatbox Helpline v2)
- [ ] Integrate LLM API server-side (key never reaches browser)
- [ ] Per-session conversation context/history
- [ ] Topic guardrails + human-escalation path
- [ ] Store chat transcripts for review
- [ ] Rule-based vs AI accuracy comparison on FAQ test set

## Backlog (Sprint 5 — AI Ride Matching, Phase 1)
- [ ] Route-matching algorithm (origin/destination proximity)
- [ ] Fair fare calculation (distance/time-based)
- [ ] "Recommended rides for you" on Rides page

## Backlog (Sprint 6 — AI Ride Matching, Phase 2 + Trust/Safety)
- [ ] Reliability prediction score
- [ ] Smart pickup-point suggestions
- [ ] Recurring-ride prediction
- [ ] Traffic-aware cost estimation
- [ ] Trust score + rating UI

## Backlog (Sprint 7 — QA, Polish & Deployment)
- [ ] E2E tests (Playwright/Cypress) for ride + chatbot flows
- [ ] Backend integration tests
- [ ] Accessibility & performance pass
- [ ] Deploy backend + frontend, wire env vars/domain
- [ ] Auto-deploy job in CI/CD
- [ ] Sprint review + retrospective

---

### If created via GitHub CLI
Once authenticated, each unchecked item above becomes `gh issue create --title "..." --label sprint-N` and is added to the project with `gh project item-add`. See repo root for the automation status.
