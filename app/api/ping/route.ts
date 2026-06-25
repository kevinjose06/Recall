import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * GET /api/ping
 *
 * Healthcheck endpoint that performs a database query to check connectivity
 * and keep the Firestore instance active.
 */
export async function GET() {
  try {
    const testDoc = await adminDb.collection("events").limit(1).get();
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      databaseConnected: true,
      count: testDoc.size
    });
  } catch (error: any) {
    console.error("Healthcheck Firestore query failed:", error);
    return NextResponse.json({
      ok: false,
      timestamp: new Date().toISOString(),
      error: error.message || "Database connection error"
    }, { status: 500 });
  }
}
