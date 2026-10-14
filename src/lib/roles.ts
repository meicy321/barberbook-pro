export type SignupRole = "customer" | "shop";
export type AppRole = SignupRole | "admin";

/** Only customer or shop can be self-selected at sign-up. Admin is never self-served. */
export function normalizeSignupRole(value: unknown): SignupRole {
  return value === "shop" ? "shop" : "customer";
}

/** Read the role stored on the profiles row (the source of truth); defaults to customer. */
export function roleFromProfile(value: unknown): AppRole {
  return value === "shop" || value === "admin" ? value : "customer";
}

/** Where a signed-in user lands: shops manage their shop, customers browse barbers. */
export function homePathForRole(role: AppRole): string {
  return role === "shop" ? "/shop" : "/barbers";
}
