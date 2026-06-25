import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * POST /api/session
 * Establishes an HTTP-Only secure cookie for the session token.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set("__session", token, {
      path: "/",
      maxAge: 3600, // 1 hour
      sameSite: "lax",
      secure: true,
      httpOnly: true, // Secure against XSS token exfiltration
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/session
 * Clears the session cookie during logout.
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("__session", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
