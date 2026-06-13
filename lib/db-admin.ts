import { adminDb } from "./firebase-admin";
import type { Event, Question, Response, Answer } from "./types";

export async function getAllEventsAdmin(): Promise<Event[]> {
  const snapshot = await adminDb.collection("events").orderBy("start_date", "desc").get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Event));
}

export async function getEventAdmin(eventId: string): Promise<Event | null> {
  const doc = await adminDb.collection("events").doc(eventId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Event;
}

export async function getQuestionsAdmin(eventId: string): Promise<Question[]> {
  const snapshot = await adminDb
    .collection("events")
    .doc(eventId)
    .collection("questions")
    .orderBy("order_index", "asc")
    .get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Question));
}

export async function getResponseCountAdmin(eventId: string): Promise<number> {
  const snapshot = await adminDb
    .collection("events")
    .doc(eventId)
    .collection("responses")
    .count()
    .get();
  return snapshot.data().count;
}

export async function getResponsesAndAnswersAdmin(eventId: string) {
  const responsesSnapshot = await adminDb
    .collection("events")
    .doc(eventId)
    .collection("responses")
    .orderBy("submitted_at", "asc")
    .get();

  const responses = responsesSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Response));
  
  const answers: (Answer & { submitted_at: string })[] = [];

  for (const response of responses) {
    const answersSnapshot = await adminDb
      .collection("events")
      .doc(eventId)
      .collection("responses")
      .doc(response.id)
      .collection("answers")
      .get();

    for (const doc of answersSnapshot.docs) {
      answers.push({
        id: doc.id,
        question_id: doc.id,
        response_id: response.id,
        answer_value: doc.data().answer_value,
        submitted_at: response.submitted_at,
      });
    }
  }

  return { responses, answers };
}
