import { collection, doc, setDoc, getDocs, orderBy, query, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { Event, Question } from "./types";

export async function createEvent(eventData: Omit<Event, "id" | "created_at">) {
  const newEventRef = doc(collection(db, "events"));
  const created_at = new Date().toISOString();
  
  await setDoc(newEventRef, {
    ...eventData,
    created_at,
  });

  return newEventRef.id;
}

export async function saveQuestions(eventId: string, questions: Array<Omit<Question, "id"> & { id?: string }>) {
  const batch = writeBatch(db);
  const questionsRef = collection(db, "events", eventId, "questions");

  // Fetch existing questions
  const existingSnapshot = await getDocs(questionsRef);
  
  // Create a set of incoming IDs to identify which ones to keep
  const incomingIds = new Set(questions.map(q => q.id).filter(id => id && !id.startsWith("local-")));

  // Delete existing questions that are NOT in the incoming list
  existingSnapshot.forEach((doc) => {
    if (!incomingIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  // Insert or update questions
  const savedIds: string[] = [];
  questions.forEach((q, i) => {
    let docRef;
    if (q.id && !q.id.startsWith("local-")) {
      // Existing question, update it
      docRef = doc(questionsRef, q.id);
    } else {
      // New question, create a new document
      docRef = doc(questionsRef);
    }
    
    batch.set(docRef, {
      event_id: eventId,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.question_type === "short_text" ? null : q.options,
      order_index: i,
      is_required: q.is_required ?? false,
    });
    savedIds.push(docRef.id);
  });

  await batch.commit();
  return savedIds;
}
