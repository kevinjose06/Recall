export const STATIC_AUTH_COOKIE = "recall_static_auth";

export const STATIC_AUTH_SESSION_VALUE =
  process.env.STATIC_AUTH_SESSION_SECRET ?? "recall-static-session";

export const STATIC_AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export function isStaticAuthSession(value: string | undefined) {
  return value === STATIC_AUTH_SESSION_VALUE;
}

export function isStaticAuthCredential(email: string, password: string) {
  return email.trim().length > 0 && password.trim().length > 0;
}
