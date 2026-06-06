// ============================================================
// Supabase Types — matches the DB schema from PRD Section 7
// ============================================================

export type EventType =
  | "Workshop"
  | "Bootcamp"
  | "Hackathon"
  | "Technical Talk"
  | "Other";

export type QuestionType = "single_choice" | "mcq" | "short_text";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string; // ISO date string YYYY-MM-DD
  end_date: string;   // ISO date string YYYY-MM-DD
  event_type: EventType;
  created_at: string;
  /** Joined aggregation — not a real column, computed via count query */
  response_count?: number;
}

export interface Question {
  id: string;
  event_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null; // null for short_text
  order_index: number;
  created_at: string;
}

export interface Response {
  id: string;
  event_id: string;
  respondent_token: string;
  submitted_at: string;
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  // single_choice: "Option A"
  // mcq:           ["Option A", "Option C"]
  // short_text:    "The venue was too small"
  answer_value: string | string[];
}

// ─── API payloads ───

export interface SubmitResponsePayload {
  event_id: string;
  respondent_token: string;
  answers: {
    question_id: string;
    answer_value: string | string[];
  }[];
}

// ─── Analytics shapes ───

export interface SingleChoiceAnalytics {
  name: string;
  value: number;
}

export interface MCQAnalytics {
  option: string;
  count: number;
}

export interface ShortTextAnalytics {
  text: string;
  submitted_at: string;
}

export interface QuestionAnalytics {
  question: Question;
  data:
    | SingleChoiceAnalytics[]
    | MCQAnalytics[]
    | ShortTextAnalytics[];
}
