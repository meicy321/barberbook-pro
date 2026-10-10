import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BarberCard } from "@/components/BarberCard";
import { DEMO_BARBERS, SERVICE_KINDS, type ServiceKind } from "@/lib/barbers";

type Search = { q?: string; service?: ServiceKind };

export const Route = createFileRoute("/barbers")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
    service: SERVICE_KINDS.includes(s.service as ServiceKind) ? (s.service as ServiceKind) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Find a barber — Barberly" },
      { name: "description", content: "Browse barbers and stylists by service — cut, color, perm or beard — and compare starting prices." },
      { property: "og:title", content: "Find a barber — Barberly" },
      { property: "og:description", content: "Browse barbers by service and compare starting prices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BarbersPage,
});

function BarbersPage() {
  const { q, service } = Route.useSearch();
  const term = q?.toLowerCase();
  const list = DEMO_BARBERS.filter(
    (b) =>
      (!service || b.services.some((s) => s.kind === service)) &&
      (!term || [b.name, b.shop, b.area].some((v) => v.toLowerCase().includes(term))),
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-14">
        <p className="eyebrow">Browse</p>
        <h1 className="mt-2 text-5xl font-medium">Find your barber</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/barbers" search={{ q }} className={`rounded-full border px-4 py-1.5 text-sm ${!service ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>All</Link>
          {SERVICE_KINDS.map((k) => (
            <Link key={k} to="/barbers" search={{ q, service: k }} className={`rounded-full border px-4 py-1.5 text-sm ${service === k ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{k}</Link>
          ))}
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((b) => <BarberCard key={b.id} barber={b} />)}
        </div>
        {list.length === 0 && <p className="mt-10 text-muted-foreground">No barbers match that search yet.</p>}
      </main>
      <SiteFooter />
    </div>
  );
}
