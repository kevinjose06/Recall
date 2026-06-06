-- ============================================================
-- CSA Recall — Initial Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── Events ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  start_date  date NOT NULL,
  end_date    date NOT NULL,
  event_type  text NOT NULL CHECK (event_type IN ('Workshop','Bootcamp','Hackathon','Technical Talk','Other')),
  created_at  timestamptz DEFAULT now()
);

-- ── Questions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question_text  text NOT NULL,
  question_type  text NOT NULL CHECK (question_type IN ('single_choice','mcq','short_text')),
  options        jsonb,           -- array of option strings; NULL for short_text
  order_index    integer NOT NULL,
  created_at     timestamptz DEFAULT now()
);

-- ── Responses ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS responses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  respondent_token  uuid NOT NULL,    -- client-generated; for dedup only, not identity
  submitted_at      timestamptz DEFAULT now()
);

-- ── Answers ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS answers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id  uuid NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id  uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_value jsonb NOT NULL
  -- single_choice: "Option A"
  -- mcq:           ["Option A", "Option C"]
  -- short_text:    "The venue was too small"
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS questions_event_id_idx ON questions(event_id);
CREATE INDEX IF NOT EXISTS responses_event_id_idx ON responses(event_id);
CREATE INDEX IF NOT EXISTS responses_token_idx ON responses(respondent_token);
CREATE INDEX IF NOT EXISTS answers_response_id_idx ON answers(response_id);
CREATE INDEX IF NOT EXISTS answers_question_id_idx ON answers(question_id);

-- Composite index for duplicate token check (most frequent query)
CREATE INDEX IF NOT EXISTS responses_event_token_idx ON responses(event_id, respondent_token);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers   ENABLE ROW LEVEL SECURITY;

-- ── events ────────────────────────────────────────────────────
-- Authenticated (CSA members) can read, create, and update events.
-- No deletion from the app — use Supabase dashboard.

CREATE POLICY "events: authenticated can select"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "events: authenticated can insert"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "events: authenticated can update"
  ON events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── questions ─────────────────────────────────────────────────

CREATE POLICY "questions: authenticated can select"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "questions: authenticated can insert"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "questions: authenticated can update"
  ON questions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "questions: authenticated can delete"
  ON questions FOR DELETE
  TO authenticated
  USING (true);

-- ── responses ─────────────────────────────────────────────────
-- Public can insert (participants submit without auth).
-- Only authenticated (members) can read.
-- Inserts from participants use the service role key via API route — bypasses RLS entirely.

CREATE POLICY "responses: authenticated can select"
  ON responses FOR SELECT
  TO authenticated
  USING (true);

-- Allow anon inserts for the API route (service role bypasses this anyway,
-- but this keeps the policy set explicit).
CREATE POLICY "responses: anon can insert"
  ON responses FOR INSERT
  TO anon
  WITH CHECK (true);

-- ── answers ───────────────────────────────────────────────────

CREATE POLICY "answers: authenticated can select"
  ON answers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "answers: anon can insert"
  ON answers FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================================
-- Notes
-- ============================================================
--
-- Password changes: performed directly in the Supabase dashboard.
-- Dashboard access: held only by the current technical lead.
-- Supabase free-tier keepalive: set up a cron at cron-job.org
--   hitting GET /api/ping every 5 days.
--
-- ============================================================
