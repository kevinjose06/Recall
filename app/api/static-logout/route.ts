import { NextResponse } from "next/server";
import { STATIC_AUTH_COOKIE } from "@/lib/auth/static";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(STATIC_AUTH_COOKIE);

  return response;
}
