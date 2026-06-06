import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { SubmitResponsePayload } from "@/lib/types";

/**
 * POST /api/submit-response
 *
 * Validates a participant form submission and writes to the DB using
 * the Supabase service role key (bypasses RLS — participants aren't authenticated).
 *
 * Returns:
 *   200 — success
 *   400 — invalid payload
 *   409 — duplicate submission (respondent_token already used for this event)
 *   500 — server error
 */
export async function POST(request: NextRequest) {
  let body: SubmitResponsePayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // ── Validate payload structure ──────────────────────────────
  const { event_id, respondent_token, answers } = body;

  if (!event_id || typeof event_id !== "string") {
    return NextResponse.json({ error: "Missing or invalid event_id." }, { status: 400 });
  }
  if (!respondent_token || typeof respondent_token !== "string") {
    return NextResponse.json({ error: "Missing or invalid respondent_token." }, { status: 400 });
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "Answers array is required and must not be empty." }, { status: 400 });
  }

  for (const answer of answers) {
    if (!answer.question_id || typeof answer.question_id !== "string") {
      return NextResponse.json({ error: "Each answer must have a valid question_id." }, { status: 400 });
    }
    if (answer.answer_value === undefined || answer.answer_value === null) {
      return NextResponse.json({ error: "Each answer must have an answer_value." }, { status: 400 });
    }
  }

  const supabase = await createServiceClient();

  // ── Check for duplicate submission ─────────────────────────
  const { count: existingCount } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event_id)
    .eq("respondent_token", respondent_token);

  if ((existingCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "You have already submitted feedback for this event." },
      { status: 409 }
    );
  }

  // ── Verify event exists ────────────────────────────────────
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", event_id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 400 });
  }

  // ── Insert response ────────────────────────────────────────
  const { data: responseRow, error: responseError } = await supabase
    .from("responses")
    .insert({ event_id, respondent_token })
    .select("id")
    .single();

  if (responseError || !responseRow) {
    console.error("Response insert error:", responseError);
    return NextResponse.json({ error: "Failed to save response." }, { status: 500 });
  }

  // ── Insert answers ─────────────────────────────────────────
  const answerRows = answers.map(({ question_id, answer_value }) => ({
    response_id: responseRow.id,
    question_id,
    answer_value,
  }));

  const { error: answersError } = await supabase.from("answers").insert(answerRows);

  if (answersError) {
    console.error("Answers insert error:", answersError);
    // Attempt cleanup — delete the response row to avoid orphans
    await supabase.from("responses").delete().eq("id", responseRow.id);
    return NextResponse.json({ error: "Failed to save answers." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
