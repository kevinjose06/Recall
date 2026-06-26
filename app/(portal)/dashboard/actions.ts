"use server";

import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function deleteEventAction(eventId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;

  if (!token) {
    throw new Error("Unauthorized: Missing session token.");
  }

  try {
    await adminAuth.verifyIdToken(token);
  } catch (err) {
    throw new Error("Unauthorized: Invalid session token.");
  }

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
