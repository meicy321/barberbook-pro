import { Link, useSearchParams } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BarberCard } from "@/components/BarberCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DEMO_BARBERS, SERVICE_KINDS, type ServiceKind } from "@/lib/barbers";

function barbersHref(q: string | undefined, service?: ServiceKind) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (service) params.set("service", service);
  const qs = params.toString();
  return qs ? `/barbers?${qs}` : "/barbers";
}


export default function Barbers() {
  useDocumentTitle("Find a barber — Barberly");
  const [params] = useSearchParams();
  const q = params.get("q") || undefined;
  const rawService = params.get("service") as ServiceKind | null;
  const service = rawService && SERVICE_KINDS.includes(rawService) ? rawService : undefined;
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
          <Link to={barbersHref(q)} className={`rounded-full border px-4 py-1.5 text-sm ${!service ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>All</Link>
          {SERVICE_KINDS.map((k) => (
            <Link key={k} to={barbersHref(q, k)} className={`rounded-full border px-4 py-1.5 text-sm ${service === k ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{k}</Link>
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
