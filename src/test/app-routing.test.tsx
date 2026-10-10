import { createMemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { routes } from "@/App";

// Match routes without rendering: pages need Supabase and the network.
describe("App routing", () => {
  it.each(["/", "/login", "/barbers", "/dashboard"])("matches a page for %s instead of not found", (path) => {
    const router = createMemoryRouter(routes, { initialEntries: [path] });
    const leaf = router.state.matches.at(-1);
    expect(leaf?.route.path).toBe(path);
  });
});
