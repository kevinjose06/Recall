// ============================================================
// Firebase Types — matches the Firestore schema from PRD
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
  created_at?: string; // Stored as ISO string in Firestore
  response_count?: number;
}

export interface Question {
  id: string;
  event_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null; // null for short_text
  order_index: number;
}

export interface Response {
  id: string; // auto-generated
  event_id: string;
  respondent_token: string;
  submitted_at: string;
}

export interface Answer {
  id: string; // usually question_id
  response_id: string;
  question_id: string;
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
