import { describe, expect, it } from "vitest";
import { normalizeSignupRole, roleFromMetadata } from "@/lib/roles";

describe("sign-up roles", () => {
  it("defaults to customer when no role is chosen", () => {
    expect(roleFromMetadata({})).toBe("customer");
  });
  it("keeps shop when the Shop tab is chosen", () => {
    expect(normalizeSignupRole("shop")).toBe("shop");
  });
  it("never allows self-serve admin", () => {
    expect(normalizeSignupRole("admin")).toBe("customer");
  });
});
