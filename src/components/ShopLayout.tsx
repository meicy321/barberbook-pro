import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useOutletContext } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, LogOut, Scissors, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/components/RequireAuth";
import { profileQueryKey, useProfile } from "@/hooks/useProfile";
import { errorMessage } from "@/lib/shop";

type Profile = NonNullable<ReturnType<typeof useProfile>["data"]>;
type ShopContext = { userId: string; profile: Profile };

const NAV = [
  { to: "/shop", label: "Shop setup", icon: Store, end: true },
  { to: "/shop/bookings", label: "Services & schedule", icon: CalendarClock, end: false },
];

/** Shop area shell. Gates on profiles.role; a customer sees the "Become a shop" offer instead. */
export function ShopLayout() {
  const user = useAuthUser();
  const profile = useProfile(user.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate("/login?mode=signin", { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-5 md:flex">
        <Link to="/" className="flex items-center gap-2 px-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Scissors className="size-4" />
          </span>
          <span className="font-display text-xl font-semibold">Barberly</span>
        </Link>
        <span className="mt-6 flex items-center gap-2 px-2 eyebrow">
          <Store className="size-3.5" /> Shop
        </span>
        <nav className="mt-3 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? "bg-sidebar-accent font-medium" : "text-muted-foreground hover:text-foreground"}`
              }
            >
              <Icon className="size-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" className="mt-auto justify-start" onClick={signOut}>
          <LogOut /> Sign out
        </Button>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 md:px-12 md:py-10">
        <div className="flex items-center justify-between md:hidden">
          <span className="font-display text-xl font-semibold">Barberly</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut /> Sign out
          </Button>
        </div>
        <nav className="mt-4 flex gap-2 md:hidden">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-full border px-3 py-1 text-sm ${isActive ? "bg-secondary font-medium" : "text-muted-foreground"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {profile.isPending ? null : profile.isError ? (
          <p className="mt-10 text-destructive">
            Could not load your profile: {errorMessage(profile.error)}
          </p>
        ) : profile.data.role === "shop" ? (
          <Outlet context={{ userId: user.id, profile: profile.data } satisfies ShopContext} />
        ) : (
          <BecomeShop userId={user.id} />
        )}
      </main>
    </div>
  );
}

export function useShop() {
  return useOutletContext<ShopContext>();
}

/** Customer → shop upgrade. The database only allows customer → shop (never admin). */
function BecomeShop({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function upgrade() {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ role: "shop" }).eq("id", userId);
    setBusy(false);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success("Your shop is open — let's set it up.");
    await queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) });
    navigate("/shop", { replace: true });
  }

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-border bg-card p-8">
      <p className="eyebrow">Become a shop</p>
      <h1 className="mt-2 text-3xl font-medium">Open your shop on Barberly</h1>
      <p className="mt-3 text-muted-foreground">
        List your barbers, services and prices, show off your work, and publish times customers can
        book.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={upgrade} disabled={busy} className="rounded-full">
          {busy ? "Please wait…" : "Become a shop"}
        </Button>
        <Button asChild variant="ghost" className="rounded-full">
          <Link to="/dashboard">Not now</Link>
        </Button>
      </div>
    </div>
  );
}
