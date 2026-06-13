import { redirect } from "next/navigation";
import { cookies } from "next/headers";

/**
 * Root page — redirect to dashboard if authenticated, otherwise to login.
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
