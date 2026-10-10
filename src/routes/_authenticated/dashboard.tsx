import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Home, LogOut, Scissors, Search, Settings, Store, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { roleFromMetadata } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — Barberly" },
      { name: "description", content: "Manage your Barberly bookings or shop." },
      { property: "og:title", content: "Your dashboard — Barberly" },
      { property: "og:description", content: "Manage your Barberly bookings or shop." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const role = roleFromMetadata(user.user_metadata);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", search: { mode: "signin" }, replace: true });
  }

  const nav =
    role === "shop"
      ? [
          { icon: Home, label: "Overview" },
          { icon: Users, label: "My barbers" },
          { icon: Scissors, label: "Services & prices" },
          { icon: Clock, label: "Schedule" },
          { icon: CalendarDays, label: "Bookings" },
          { icon: Settings, label: "Payout settings" },
        ]
      : [
          { icon: Home, label: "Overview" },
          { icon: Search, label: "Find a barber" },
          { icon: CalendarDays, label: "My bookings" },
          { icon: Settings, label: "Account" },
        ];

  const cards =
    role === "shop"
      ? [
          { title: "Add your first barber", text: "Create a profile with a short intro and address." },
          { title: "Set services", text: "Cut, Color, Perm or Beard — each with a starting price." },
          { title: "Publish your schedule", text: "Open time slots so customers can book." },
        ]
      : [
          { title: "Find a barber", text: "Browse barbers by service and area.", to: "/barbers" as const },
          { title: "Upcoming bookings", text: "You have no bookings yet." },
          { title: "Favourites", text: "Save barbers you love for quick rebooking." },
        ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-5 md:flex">
        <Link to="/" className="flex items-center gap-2 px-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Scissors className="size-4" /></span>
          <span className="font-display text-xl font-semibold">Barberly</span>
        </Link>
        <span className="mt-6 flex items-center gap-2 px-2 eyebrow">
          {role === "shop" ? <Store className="size-3.5" /> : <Users className="size-3.5" />}
          {role === "shop" ? "Shop" : "Customer"}
        </span>
        <nav className="mt-3 flex flex-col gap-1">
          {nav.map(({ icon: Icon, label }, i) => (
            <span key={label} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${i === 0 ? "bg-sidebar-accent font-medium" : "text-muted-foreground"}`}>
              <Icon className="size-4" /> {label}
              {i > 0 && <span className="ml-auto text-[10px] uppercase tracking-wider opacity-60">Soon</span>}
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
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut /> Sign out</Button>
        </div>
        <p className="eyebrow mt-6 md:mt-0">{role === "shop" ? "Shop dashboard" : "Your account"}</p>
        <h1 className="mt-2 text-4xl font-medium">Hello, {user.email}</h1>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-medium">{c.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
              {"to" in c && c.to && (
                <Button asChild size="sm" className="mt-5 rounded-full"><Link to={c.to}>Browse barbers</Link></Button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
