import { Link, Navigate, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Home, LogOut, Scissors, Search, Settings, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { homePathForRole } from "@/lib/roles";
import { useAuthUser } from "@/components/RequireAuth";
import { useProfile } from "@/hooks/useProfile";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Dashboard() {
  useDocumentTitle("Your dashboard — Barberly");
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

  // The role comes from profiles.role; shops have their own area.
  if (profile.isPending) return null;
  if (profile.data?.role === "shop") return <Navigate to={homePathForRole("shop")} replace />;

  const nav = [
    { icon: Home, label: "Overview" },
    { icon: Search, label: "Find a barber" },
    { icon: CalendarDays, label: "My bookings" },
    { icon: Settings, label: "Account" },
  ];

  const cards = [
    {
      title: "Find a barber",
      text: "Browse barbers by service and area.",
      to: "/barbers",
      cta: "Browse barbers",
    },
    { title: "Upcoming bookings", text: "You have no bookings yet." },
    {
      title: "Run a barbershop?",
      text: "Open your shop on Barberly and take bookings.",
      to: "/shop",
      cta: "Become a shop",
    },
  ];

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
          <Users className="size-3.5" /> Customer
        </span>
        <nav className="mt-3 flex flex-col gap-1">
          {nav.map(({ icon: Icon, label }, i) => (
            <span
              key={label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${i === 0 ? "bg-sidebar-accent font-medium" : "text-muted-foreground"}`}
            >
              <Icon className="size-4" /> {label}
              {i > 0 && (
                <span className="ml-auto text-[10px] uppercase tracking-wider opacity-60">
                  Soon
                </span>
              )}
            </span>
          ))}
        </nav>
        <Button variant="ghost" className="mt-auto justify-start" onClick={signOut}>
          <LogOut /> Sign out
        </Button>
      </aside>

      <main className="flex-1 px-6 py-10 md:px-12">
        <div className="flex items-center justify-between md:hidden">
          <span className="font-display text-xl font-semibold">Barberly</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut /> Sign out
          </Button>
        </div>
        <p className="eyebrow mt-6 md:mt-0">Your account</p>
        <h1 className="mt-2 text-4xl font-medium">Hello, {user.email}</h1>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-medium">{c.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
              {c.to && (
                <Button asChild size="sm" className="mt-5 rounded-full">
                  <Link to={c.to}>{c.cta}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
