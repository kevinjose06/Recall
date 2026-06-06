import { NextResponse } from "next/server";
import {
  STATIC_AUTH_COOKIE,
  STATIC_AUTH_COOKIE_OPTIONS,
  STATIC_AUTH_SESSION_VALUE,
  isStaticAuthCredential,
} from "@/lib/auth/static";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!isStaticAuthCredential(email ?? "", password ?? "")) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    STATIC_AUTH_COOKIE,
    STATIC_AUTH_SESSION_VALUE,
    STATIC_AUTH_COOKIE_OPTIONS
  );

  return response;
}
