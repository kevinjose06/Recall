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

export async function saveQuestions(eventId: string, questions: Omit<Question, "saved_id">[]) {
  const batch = writeBatch(db);
  const questionsRef = collection(db, "events", eventId, "questions");

  // Since we want to replace all, we should theoretically delete existing, but writing a full batch is easier if we delete the subcollection first.
  // The Admin SDK can delete subcollections, but Client SDK cannot easily delete collections.
  // For safety, we fetch existing ones and delete them.
  const existingSnapshot = await getDocs(questionsRef);
  existingSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Now insert new
  const savedIds: string[] = [];
  questions.forEach((q, i) => {
    const newDocRef = doc(questionsRef);
    batch.set(newDocRef, {
      event_id: eventId,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.question_type === "short_text" ? null : q.options,
      order_index: i,
    });
    savedIds.push(newDocRef.id);
  });

  await batch.commit();
  return savedIds;
}
