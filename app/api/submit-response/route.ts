import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { SubmitResponsePayload } from "@/lib/types";

export async function POST(request: NextRequest) {
  let body: SubmitResponsePayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

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

  try {
    // ── Check for duplicate submission ─────────────────────────
    const responsesRef = adminDb.collection("events").doc(event_id).collection("responses");
    const existingSnap = await responsesRef.where("respondent_token", "==", respondent_token).limit(1).get();
    
    if (!existingSnap.empty) {
      return NextResponse.json(
        { error: "You have already submitted feedback for this event." },
        { status: 409 }
      );
    }

    // ── Verify event exists ────────────────────────────────────
    const eventSnap = await adminDb.collection("events").doc(event_id).get();
    if (!eventSnap.exists) {
      return NextResponse.json({ error: "Event not found." }, { status: 400 });
    }

    // ── Insert response & answers in batch ──────────────────────
    const batch = adminDb.batch();
    const newResponseRef = responsesRef.doc();

    batch.set(newResponseRef, {
      event_id,
      respondent_token,
      submitted_at: new Date().toISOString(),
    });

    const answersRef = newResponseRef.collection("answers");
    answers.forEach(({ question_id, answer_value }) => {
      const ansDoc = answersRef.doc(question_id);
      batch.set(ansDoc, {
        question_id,
        answer_value,
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json({ error: "Failed to save response." }, { status: 500 });
  }
}
