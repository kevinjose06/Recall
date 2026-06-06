const PLACEHOLDER_SUPABASE_HOST = "placeholder.supabase.co";
const PLACEHOLDER_KEY_MARKER = "placeholder-signature-do-not-use";

export function hasSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(
    url &&
      anonKey &&
      !url.includes(PLACEHOLDER_SUPABASE_HOST) &&
      !anonKey.includes(PLACEHOLDER_KEY_MARKER)
  );
}
