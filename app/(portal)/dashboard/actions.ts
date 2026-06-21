"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function deleteEventAction(eventId: string) {
  try {
    const eventRef = adminDb.collection("events").doc(eventId);
    await adminDb.recursiveDelete(eventRef);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete event:", error);
    throw new Error("Failed to delete event");
  }
}
