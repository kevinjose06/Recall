import { adminDb, adminAuth } from "./firebase-admin";
import { cookies } from "next/headers";
import type { Event, Question, Response, Answer } from "./types";

const DEMO_EMAIL = "user@gmail.com";

export async function getAdminEventsCollectionName() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__session")?.value;
    if (token) {
      const decoded = await adminAuth.verifyIdToken(token);
      if (decoded.email === DEMO_EMAIL) {
        return "demo_events";
      }
    }
  } catch (error) {
    // Silently ignore verification errors and fall back to default collection
  }
  return "events";
}

export async function getAllEventsAdmin(): Promise<(Event & { response_count?: number })[]> {
  const collectionName = await getAdminEventsCollectionName();
  const snapshot = await adminDb.collection(collectionName).orderBy("created_at", "desc").get();
  const events = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Event));
  
  return Promise.all(
    events.map(async (event) => {
      const count = await getResponseCountAdmin(event.id);
      return { ...event, response_count: count };
    })
  );
}

export async function getEventAdmin(eventId: string): Promise<Event | null> {
  let collectionName = await getAdminEventsCollectionName();
  let doc = await adminDb.collection(collectionName).doc(eventId).get();
  
  if (!doc.exists) {
    const fallbackCollection = collectionName === "events" ? "demo_events" : "events";
    doc = await adminDb.collection(fallbackCollection).doc(eventId).get();
  }
  
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data(), _collection: doc.ref.parent.id } as Event & { _collection?: string };
}

export async function getQuestionsAdmin(eventId: string, knownCollection?: string): Promise<Question[]> {
  const collectionName = knownCollection || await getAdminEventsCollectionName();
  let snapshot = await adminDb
    .collection(collectionName)
    .doc(eventId)
    .collection("questions")
    .orderBy("order_index", "asc")
    .get();

  if (snapshot.empty && !knownCollection) {
    const fallbackCollection = collectionName === "events" ? "demo_events" : "events";
    snapshot = await adminDb
      .collection(fallbackCollection)
      .doc(eventId)
      .collection("questions")
      .orderBy("order_index", "asc")
      .get();
  }

  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Question));
}

export async function getResponseCountAdmin(eventId: string, knownCollection?: string): Promise<number> {
  const collectionName = knownCollection || await getAdminEventsCollectionName();
  let snapshot = await adminDb
    .collection(collectionName)
    .doc(eventId)
    .collection("responses")
    .count()
    .get();
    
  if (snapshot.data().count === 0 && !knownCollection) {
    const fallbackCollection = collectionName === "events" ? "demo_events" : "events";
    snapshot = await adminDb
      .collection(fallbackCollection)
      .doc(eventId)
      .collection("responses")
      .count()
      .get();
  }
  
  return snapshot.data().count;
}

export async function getResponsesAndAnswersAdmin(eventId: string, knownCollection?: string) {
  let collectionName = knownCollection || await getAdminEventsCollectionName();
  let responsesSnapshot = await adminDb
    .collection(collectionName)
    .doc(eventId)
    .collection("responses")
    .orderBy("submitted_at", "asc")
    .get();

  if (responsesSnapshot.empty && !knownCollection) {
    collectionName = collectionName === "events" ? "demo_events" : "events";
    responsesSnapshot = await adminDb
      .collection(collectionName)
      .doc(eventId)
      .collection("responses")
      .orderBy("submitted_at", "asc")
      .get();
  }

  const responses = responsesSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Response));
  
  const answersPromises = responses.map(async (response) => {
    const answersSnapshot = await adminDb
      .collection(collectionName)
      .doc(eventId)
      .collection("responses")
      .doc(response.id)
      .collection("answers")
      .get();

    return answersSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      question_id: doc.id,
      response_id: response.id,
      answer_value: doc.data().answer_value,
      submitted_at: response.submitted_at,
    }));
  });

  const answersResults = await Promise.all(answersPromises);
  const answers = answersResults.flat();

  return { responses, answers };
}
