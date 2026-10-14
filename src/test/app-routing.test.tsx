import { createMemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { routes } from "@/App";

// Match routes without rendering: pages need Supabase and the network.
describe("App routing", () => {
  it.each(["/", "/login", "/barbers", "/bookings", "/dashboard", "/shop", "/shop/bookings"])(
    "matches a page for %s instead of not found",
    (path) => {
      const router = createMemoryRouter(routes, { initialEntries: [path] });
      const leaf = router.state.matches.at(-1);
      expect(leaf?.route.path).toBe(path);
    },
  );

  it("matches the barber detail page for /barbers/<id>", () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/barbers/3f1c2a9e-0000-4000-8000-000000000000"] });
    expect(router.state.matches.at(-1)?.route.path).toBe("/barbers/:id");
  });
});
