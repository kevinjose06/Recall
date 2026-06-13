import { NextResponse } from "next/server";

/**
 * GET /api/ping
 *
 * Generic healthcheck endpoint.
 * Kept alive for compatibility with any external monitoring tools.
 */
export async function GET() {
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
