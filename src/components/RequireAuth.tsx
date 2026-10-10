import { useEffect, useState } from "react";
import { Navigate, Outlet, useOutletContext } from "react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContext = { user: User };

/** Client-only gate for signed-in pages; redirects to /login when there is no session. */
export function RequireAuth() {
  const [state, setState] = useState<"loading" | "signed-out" | User>("loading");

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setState(error || !data.user ? "signed-out" : data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setState("signed-out");
      else if (session?.user) setState(session.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state === "loading") return null;
  if (state === "signed-out") return <Navigate to="/login?mode=signin" replace />;
  return <Outlet context={{ user: state } satisfies AuthContext} />;
}

export function useAuthUser() {
  return useOutletContext<AuthContext>().user;
}
