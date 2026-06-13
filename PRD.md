# Product Requirements Document
## CSA Feedback Platform
**Organization:** Computer Science Association (CSA), RIT Kottayam  
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** June 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Non-Goals](#3-goals-and-non-goals)
4. [Users and Roles](#4-users-and-roles)
5. [Authentication Architecture](#5-authentication-architecture)
6. [Core Features](#6-core-features)
7. [Database Architecture](#7-database-architecture)
8. [Application Architecture](#8-application-architecture)
9. [Tech Stack](#9-tech-stack)
10. [Page and Route Structure](#10-page-and-route-structure)
11. [Analytics Specification](#11-analytics-specification)
12. [Security Model](#12-security-model)
13. [Deployment and Infrastructure](#13-deployment-and-infrastructure)
14. [Build Phases](#14-build-phases)
15. [Out of Scope](#15-out-of-scope)
16. [Open Decisions](#16-open-decisions)

---

## 1. Project Overview

The CSA Feedback Platform is an internal web application built for the Computer Science Association at RIT Kottayam. It replaces ad-hoc Google Forms with a centralized, persistent, and member-accessible system for collecting and analyzing participant feedback across all CSA-organized events — workshops, bootcamps, hackathons, and technical talks.

The platform has two distinct user surfaces:
- **Member portal** — authenticated, used by CSA members to create events, build questionnaires, and view analytics
- **Participant form** — public, unauthenticated, accessed via a shareable link by event attendees to submit feedback

---

## 2. Problem Statement

The current process has three critical failures:

**Access fragmentation.** Google Forms responses are visible only to the form creator and manually invited members. When a different member needs to review feedback, they must request access individually — creating friction and often meaning responses are never reviewed collectively.

**Institutional memory loss.** When a new ExaCom takes over, there is no accessible record of how previous events performed, what feedback was received, or what issues were reported. Each committee starts blind.

**No analytics.** Raw Google Forms responses require manual effort to summarize. There is no automatic visualization of trends, ratings distributions, or recurring issues.

---

## 3. Goals and Non-Goals

### Goals
- Any authenticated CSA member can view all feedback from all events, past and present
- Any authenticated CSA member can create events and build questionnaires
- Participants can submit feedback via a public link without creating an account
- Single-choice question responses are visualized as pie charts
- MCQ question responses are visualized as bar charts
- Short text responses are displayed as a readable list
- The system is maintainable by future committees with zero technical handover beyond Supabase dashboard access

### Non-Goals
- Individual member accounts or role-based permissions within the member group
- Email notifications on new responses
- PDF export of analytics
- OAuth or social login
- Mobile app (PWA is acceptable but not required in v1)
- Public-facing event pages or registration forms

---

## 4. Users and Roles

There are only two types of users in this system. There is deliberately no role hierarchy among members.

### CSA Members
- Authenticated using a shared association email and password
- Can create, view, and manage all events and questionnaires
- Can view all responses and analytics for all events
- Cannot change the platform password from within the app (by design)

### Participants
- Not authenticated — no account required
- Access feedback forms only via a unique shareable link per event
- Can view and submit answers to questions for that specific event only
- Cannot see responses from other participants
- Cannot access the member portal under any circumstance

---

## 5. Authentication Architecture

### Credential Model
Authentication uses a **single shared Supabase account** tied to the association email (e.g., `csa@ritkerala.ac.in`). The password is set by the technical lead and distributed to all current members through a secure internal channel (college email, not WhatsApp).

### Password Rotation
- Performed **once per year** when a new ExaCom takes charge
- Executed directly through the **Supabase dashboard** — not through any in-app UI
- The new password is distributed by the incoming tech lead to all new committee members

### Deliberate Omissions
The following are **intentionally not built**:
- In-app "Change Password" page — any logged-in user could trigger it, creating a denial-of-service risk
- Forgot password / email reset flow — a reset email to the shared inbox could lock out all members simultaneously
- Invite code or individual registration — unnecessary complexity for a small, trusted internal team

### Session Handling
- Supabase Auth handles session tokens automatically via `@supabase/ssr`
- Sessions persist across browser refreshes using cookies
- Members are redirected to `/login` if their session expires

---

## 6. Core Features

### 6.1 Event Management
Members can create a new event by providing:
- Event title (required)
- Event description (optional)
- Event date (required)
- Event type — selectable from: Workshop, Bootcamp, Hackathon, Technical Talk, Other

Events are listed in the dashboard sorted by date descending. Each event card shows the title, date, type, and response count.

### 6.2 Questionnaire Builder
Each event has exactly one questionnaire. The questionnaire builder allows members to:
- Add questions of three types: **Single Choice**, **Multiple Choice (MCQ)**, **Short Text**
- For Single Choice and MCQ: define the list of options (minimum 2, no maximum)
- Reorder questions via drag-and-drop (or up/down buttons as a fallback)
- Delete questions
- Save the questionnaire (only saveable once all questions have a question text and at least 2 options where applicable)

Once at least one response has been submitted, the questionnaire is **locked** — no further edits to questions or options are permitted. This prevents data inconsistency between old answers and changed questions.

### 6.3 Shareable Participant Link
Each event gets a unique public URL:
```
https://[your-domain]/respond/[event-id]
```
This link is displayed on the event detail page with a one-click copy button. Clicking it opens the participant form without any login.

### 6.4 Participant Form
- Renders all questions for the given event
- Validates that all questions are answered before allowing submission
- On submit, stores the response and shows a thank-you message
- Uses a `respondent_token` (UUID generated client-side, stored in `localStorage`) to prevent the same browser from submitting twice
- Displays no information about other participants or response counts

### 6.5 Response Dashboard
Available to authenticated members only. Per event, shows:
- Total response count
- Per question analytics based on question type (see Section 11)
- Timestamp of first and most recent response

---

## 7. Database Architecture

**Database:** PostgreSQL via Supabase  
**Key principle:** All answer values stored as `jsonb` to support varying answer structures across question types in a single `answers` table.

### Schema

```sql
-- Association member account (single Supabase Auth user)
-- No custom members table needed; Supabase Auth handles this

-- Events
CREATE TABLE events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  event_date  date NOT NULL,
  event_type  text NOT NULL CHECK (event_type IN ('Workshop','Bootcamp','Hackathon','Technical Talk','Other')),
  created_at  timestamptz DEFAULT now()
);

-- Questions belonging to an event
CREATE TABLE questions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question_text  text NOT NULL,
  question_type  text NOT NULL CHECK (question_type IN ('single_choice','mcq','short_text')),
  options        jsonb,         -- Array of option strings. NULL for short_text.
  order_index    integer NOT NULL,
  created_at     timestamptz DEFAULT now()
);

-- One row per form submission by a participant
CREATE TABLE responses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  respondent_token  uuid NOT NULL,   -- Client-generated, for dedup only. Not tied to identity.
  submitted_at      timestamptz DEFAULT now()
);

-- One row per question answer within a response
CREATE TABLE answers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id  uuid NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id  uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_value jsonb NOT NULL
  -- single_choice: "3"
  -- mcq:           ["Option A", "Option C"]
  -- short_text:    "The venue was too small"
);
```

### Row-Level Security (RLS) Policies

RLS must be enabled on all tables.

| Table | Operation | Who |
|---|---|---|
| `events` | SELECT, INSERT, UPDATE | Authenticated users only |
| `questions` | SELECT, INSERT, UPDATE, DELETE | Authenticated users only |
| `responses` | INSERT | Anyone (public — participants) |
| `responses` | SELECT | Authenticated users only |
| `answers` | INSERT | Anyone (public — participants) |
| `answers` | SELECT | Authenticated users only |

Participants interact with the DB only through the Next.js API routes, never directly. API routes that handle participant submissions use the **Supabase service role key** server-side (never exposed to the client) to bypass RLS for insert operations.

---

## 8. Application Architecture

### Client-Server Split

```
Member Portal (authenticated)
  └── Next.js pages with server-side session check via middleware
  └── Fetches data via Supabase JS client (anon key, RLS enforced)

Participant Form (public)
  └── Next.js public route — no auth
  └── Submits via Next.js API route (/api/submit-response)
  └── API route uses service role key server-side to write to DB
```

### Why API Route for Participant Submission
The participant form must write to `responses` and `answers` without being authenticated. Exposing the service role key on the client is not acceptable. The API route acts as a controlled server-side proxy that validates the payload before writing.

### Middleware
`middleware.ts` at the project root intercepts all requests to protected routes and redirects unauthenticated users to `/login`. The `/respond/[event-id]` route is explicitly excluded from protection.

```
Protected:   /dashboard/*, /events/*, /login (redirect away if already authed)
Public:      /respond/[event-id], /api/submit-response
```

---

## 9. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, file-based routing, API routes, Vercel-native |
| Language | TypeScript | Type safety for DB schema and API payloads |
| Database | Supabase (PostgreSQL) | Managed DB + Auth + RLS in one service |
| Auth | Supabase Auth | Handles sessions, cookies via `@supabase/ssr` |
| Styling | Tailwind CSS | Rapid UI, no separate CSS files |
| Charts | Recharts | React-native, no canvas setup needed |
| Hosting | Vercel | Zero-config Next.js deployment |
| Package Manager | npm | Default, no preference |

### Key Dependencies
```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "typescript": "^5",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.1",
    "recharts": "^2",
    "tailwindcss": "^3",
    "@hello-pangea/dnd": "^16"
  }
}
```
> `@hello-pangea/dnd` is the maintained fork of `react-beautiful-dnd` — use this for question reordering drag-and-drop.

---

## 10. Page and Route Structure

```
app/
├── layout.tsx                          # Root layout, font, global styles
├── middleware.ts                       # Auth guard
│
├── login/
│   └── page.tsx                        # Login form (email + password)
│
├── dashboard/
│   └── page.tsx                        # Event list, sorted by date desc
│
├── events/
│   ├── new/
│   │   └── page.tsx                    # Create new event form
│   └── [event-id]/
│       ├── page.tsx                    # Event detail: overview + shareable link
│       ├── builder/
│       │   └── page.tsx                # Questionnaire builder
│       └── responses/
│           └── page.tsx                # Analytics dashboard for this event
│
├── respond/
│   └── [event-id]/
│       └── page.tsx                    # Public participant form (no auth)
│
└── api/
    └── submit-response/
        └── route.ts                    # POST handler for participant submissions
```

---

## 11. Analytics Specification

### Single Choice Questions → Pie Chart

Aggregate answer counts per option. Render using Recharts `PieChart`.

```
Data shape: [{ name: "1", value: 12 }, { name: "2", value: 7 }, ...]
Component:  <PieChart> with <Pie>, <Cell>, <Tooltip>, <Legend>
Colors:     Indigo/purple palette — #6366f1, #8b5cf6, #a78bfa, #c4b5fd, #ddd6fe
```

### MCQ Questions → Bar Chart

Count how many times each option was selected across all responses. Since one respondent can select multiple options, totals will exceed response count — this is expected and should be noted in the UI with a label like *"Option selections (one respondent may select multiple)"*.

```
Data shape: [{ option: "Option A", count: 18 }, { option: "Option B", count: 9 }, ...]
Component:  <BarChart> with <Bar>, <XAxis>, <YAxis>, <Tooltip>, <CartesianGrid>
```

### Short Text Questions → Response List

Render all text responses in a scrollable card list. No aggregation. Most recent first. Each entry shows the answer text and submission timestamp.

### Response Count
Every event's analytics page shows total response count prominently at the top before any per-question breakdown.

---

## 12. Security Model

### What Is Protected
- All event data, questions, and responses are readable only by authenticated users
- The Supabase project is owned by the association email — no personal account dependency
- RLS ensures even if the anon key leaks, unauthenticated users cannot read response data

### What Is Deliberately Unprotected
- The participant form at `/respond/[event-id]` is fully public — this is intentional
- Response submission is public — required for participants to submit without accounts

### Known Acceptable Risks
- Shared credentials mean a compromised password exposes all data to anyone with the link. Mitigated by: annual rotation, distribution via college email only, and the fact that this is internal association data — not personal or financial data.
- A malicious actor with the form link could submit fake responses. Mitigated by: `respondent_token` dedup per browser. Not fully solvable without requiring participant login, which is out of scope.

### Supabase Dashboard Access
The Supabase project dashboard credentials are **separate from and more sensitive than** the app login credentials. Dashboard access must be held only by the current technical lead. This is the true security boundary of the system.

**Never store Supabase dashboard credentials in:**
- WhatsApp messages
- Public GitHub repositories
- Vercel environment variables visible to all team members

---

## 13. Deployment and Infrastructure

### Hosting
- **Frontend + API routes:** Vercel (free tier sufficient)
- **Database:** Supabase (free tier with keepalive strategy)

### Environment Variables
Store in Vercel project settings. Never commit to repository.

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]   # Server-side only. Never prefix with NEXT_PUBLIC_.
```

### Supabase Free Tier Inactivity Warning
Supabase pauses free tier projects after **7 days of inactivity**. To prevent this, set up a keepalive ping:

- Register a free account at [cron-job.org](https://cron-job.org)
- Create a cron job that hits a lightweight Next.js API route (e.g., `/api/ping`) every 5 days
- The route does a simple `SELECT 1` query against Supabase to keep the project active

### Repository
- Host on GitHub under the association's GitHub organization account (if one exists) or under the technical lead's account
- Repository should be **private**
- `.env.local` must be in `.gitignore` — verify this before first push

---

## 14. Build Phases

### Phase 1 — Foundation (Week 1)
- [ ] Initialize Next.js project with TypeScript and Tailwind
- [ ] Create Supabase project under association email
- [ ] Define and run all DB migrations (schema from Section 7)
- [ ] Enable RLS on all tables and write all policies
- [ ] Set up `@supabase/ssr` with cookie-based session handling
- [ ] Build `/login` page with email + password form
- [ ] Write `middleware.ts` to protect all routes except `/respond/*` and `/api/submit-response`
- [ ] Verify redirect behavior for unauthenticated and authenticated users

### Phase 2 — Event and Questionnaire Builder (Week 2)
- [ ] Build `/dashboard` — list all events, sorted by date, with response count badge
- [ ] Build `/events/new` — create event form (title, description, date, type)
- [ ] Build `/events/[event-id]` — event detail page with shareable link + copy button
- [ ] Build `/events/[event-id]/builder` — questionnaire builder
  - Add/remove questions
  - Select question type
  - Add/remove options for single_choice and mcq
  - Reorder questions
  - Save questionnaire to Supabase
  - Lock builder if responses already exist

### Phase 3 — Participant Form (Week 3)
- [ ] Build `/respond/[event-id]` — public form page
  - Fetch and render questions server-side
  - Render correct input per question type (radio for single_choice, checkboxes for mcq, textarea for short_text)
  - Client-side validation (all questions answered before submit)
  - Generate `respondent_token` on page load, store in localStorage
  - Check localStorage before showing form — show "already submitted" message if token exists
- [ ] Build `/api/submit-response` POST route
  - Validate payload structure
  - Check `respondent_token` is not already in `responses` for this `event_id`
  - Insert into `responses` then `answers` in a single transaction
  - Return 200 on success, 409 on duplicate, 400 on invalid payload

### Phase 4 — Analytics Dashboard (Week 4)
- [ ] Build `/events/[event-id]/responses`
  - Total response count at top
  - Per-question analytics section
  - Pie chart for single_choice questions
  - Bar chart for MCQ questions
  - Text list for short_text questions
- [ ] Test with seeded data across all question types
- [ ] Set up Vercel deployment with all environment variables
- [ ] Set up Supabase keepalive cron job

---

## 15. Out of Scope

The following are explicitly not part of v1 and should not be built until the core loop is stable:

- Email notifications to members when new responses arrive
- PDF or CSV export of responses or analytics
- Google OAuth or any third-party login
- Role-based access control (admin vs member distinction)
- Event-level archiving or soft-delete
- Bulk question import
- Response editing or deletion by members
- Multi-language support
- Dark mode toggle (can use a dark default if preferred)
- PWA manifest or offline support

---

## 16. Open Decisions

These items were not finalized during product discussion and must be decided before or during Phase 2:

| # | Decision | Options | Recommended |
|---|---|---|---|
| 1 | MCQ analytics label wording | "Total selections" vs "Option selections (multi-select)" | Second — more precise |
| 2 | Questionnaire lock behavior | Lock entire builder vs lock only existing questions | Lock entire builder — simpler to implement and communicate |
| 3 | Event deletion | Allow or disallow from UI | Disallow in v1 — deletion through Supabase dashboard only |
| 4 | Short text response display order | Newest first vs oldest first | Newest first |
| 5 | Domain | Vercel subdomain vs custom domain | Vercel subdomain for v1 (`csa-feedback.vercel.app`) |

---

*This document should be kept in the project repository at `/PRD.md` and updated whenever scope changes are agreed upon by the ExaCom.*
