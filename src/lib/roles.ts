export type SignupRole = "customer" | "shop";

/** Only customer or shop can be self-selected at sign-up. Admin is never self-served. */
export function normalizeSignupRole(value: unknown): SignupRole {
  return value === "shop" ? "shop" : "customer";
}

/** Read the role captured in auth user metadata; defaults to customer. */
export function roleFromMetadata(meta: Record<string, unknown> | null | undefined): SignupRole {
  return normalizeSignupRole(meta?.["role"]);
}
