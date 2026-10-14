/**
 * Read the real message off a thrown value. Supabase returns a PostgrestError —
 * a plain {message, details, hint, code} object, not an Error instance — so an
 * `instanceof Error` check would swallow the message create_booking raises.
 */
export function errMessage(err: unknown, fallback = "Something went wrong") {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}
