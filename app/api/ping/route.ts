import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/ping
 *
 * Keepalive endpoint to prevent Supabase free-tier project from pausing.
 * Set up a cron job at cron-job.org to hit this every 5 days.
 *
 * Example cron schedule: "0 12" on every 5th day of the month
 */
export async function GET() {
  try {
    const supabase = await createClient();
    // Lightweight query — just checks DB connectivity
    const { error } = await supabase.from("events").select("id").limit(1);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
