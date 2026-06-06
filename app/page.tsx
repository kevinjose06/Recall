import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { STATIC_AUTH_COOKIE, isStaticAuthSession } from "@/lib/auth/static";
import { createClient } from "@/lib/supabase/server";

/**
 * Root page — redirect to dashboard if authenticated, otherwise to login.
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const hasStaticSession = isStaticAuthSession(
    cookieStore.get(STATIC_AUTH_COOKIE)?.value
  );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user || hasStaticSession) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
