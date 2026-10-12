import { describe, expect, it } from "vitest";
import { homePathForRole, normalizeSignupRole, roleFromProfile } from "@/lib/roles";

describe("sign-up roles", () => {
  it("defaults to customer when no role is chosen", () => {
    expect(normalizeSignupRole(undefined)).toBe("customer");
  });
  it("keeps shop when the Shop tab is chosen", () => {
    expect(normalizeSignupRole("shop")).toBe("shop");
  });
  it("never allows self-serve admin", () => {
    expect(normalizeSignupRole("admin")).toBe("customer");
  });
});

describe("profile roles", () => {
  it("reads the role from the profiles row", () => {
    expect(roleFromProfile("shop")).toBe("shop");
    expect(roleFromProfile(null)).toBe("customer");
  });
  it("sends shops to the shop area and customers to their account", () => {
    expect(homePathForRole("shop")).toBe("/shop");
    expect(homePathForRole("customer")).toBe("/dashboard");
  });
});
