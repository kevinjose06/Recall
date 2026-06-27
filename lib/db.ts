import { collection, doc, setDoc, getDocs, orderBy, query, writeBatch, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Event, Question } from "./types";

export async function createEvent(eventData: Omit<Event, "id" | "created_at">) {
  const batch = writeBatch(db);
  const newEventRef = doc(collection(db, "events"));
  const created_at = new Date().toISOString();
  
  batch.set(newEventRef, {
    ...eventData,
    created_at,
  });

  const defaultQuestions = [
    { question_text: "Name", question_type: "short_text", is_required: true },
    { question_text: "Email", question_type: "short_text", is_required: true },
    { question_text: "College Name", question_type: "short_text", is_required: true }
  ];

  const questionsRef = collection(db, "events", newEventRef.id, "questions");
  
  defaultQuestions.forEach((q, i) => {
    const qRef = doc(questionsRef);
    batch.set(qRef, {
      event_id: newEventRef.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: null,
      order_index: i,
      is_required: q.is_required
    });
  });

  await batch.commit();

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
      options:
        q.question_type === "short_text" || q.question_type === "star_rating"
          ? null
          : q.options,
      order_index: i,
      is_required: q.is_required ?? false,
    });
    savedIds.push(docRef.id);
  });

  await batch.commit();
  return savedIds;
}

export async function updateEventPublishStatus(eventId: string, isPublished: boolean) {
  const eventRef = doc(db, "events", eventId);
  await updateDoc(eventRef, { is_published: isPublished });
}

