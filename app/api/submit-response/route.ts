import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getQuestionnaireSignature } from "@/lib/questionnaire-signature";
import type { SignatureQuestion } from "@/lib/questionnaire-signature";
import type { SubmitResponsePayload } from "@/lib/types";

export async function POST(request: NextRequest) {
  let body: SubmitResponsePayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { event_id, respondent_token, questionnaire_signature, answers } = body;

  if (!event_id || typeof event_id !== "string") {
    return NextResponse.json({ error: "Missing or invalid event_id." }, { status: 400 });
  }
  if (!respondent_token || typeof respondent_token !== "string") {
    return NextResponse.json({ error: "Missing or invalid respondent_token." }, { status: 400 });
  }
  if (!questionnaire_signature || typeof questionnaire_signature !== "string") {
    return NextResponse.json({ error: "Missing or invalid questionnaire_signature." }, { status: 400 });
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
    const eventRef = adminDb.collection("events").doc(event_id);

    // ── Verify event exists ────────────────────────────────────
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      return NextResponse.json({ error: "Event not found." }, { status: 400 });
    }

    const questionsSnapshot = await eventRef
      .collection("questions")
      .orderBy("order_index", "asc")
      .get();
    const currentQuestions: SignatureQuestion[] = questionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        question_text: typeof data.question_text === "string" ? data.question_text : "",
        question_type: data.question_type,
        options: Array.isArray(data.options) ? data.options : null,
        is_required: Boolean(data.is_required),
      };
    });
    const currentSignature = getQuestionnaireSignature(currentQuestions);

    if (questionnaire_signature !== currentSignature) {
      return NextResponse.json(
        {
          code: "QUESTIONNAIRE_CHANGED",
          error: "This questionnaire has changed. Please refresh the page and try again.",
        },
        { status: 409 }
      );
    }

    const responsesRef = eventRef.collection("responses");
    const existingSnap = await responsesRef.where("respondent_token", "==", respondent_token).get();
    const alreadySubmittedCurrentQuestionnaire = existingSnap.docs.some(
      (doc) => doc.data().questionnaire_signature === questionnaire_signature
    );

    if (alreadySubmittedCurrentQuestionnaire) {
      return NextResponse.json(
        {
          code: "ALREADY_SUBMITTED",
          error: "You have already submitted feedback for this questionnaire.",
        },
        { status: 409 }
      );
    }

    const batch = adminDb.batch();
    const newResponseRef = responsesRef.doc();

    batch.set(newResponseRef, {
      event_id,
      respondent_token,
      questionnaire_signature,
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
