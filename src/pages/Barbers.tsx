import { Link, useSearchParams } from "react-router";
import { MapPin, Scissors, Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { repPhotoUrl, useMarketplaceBarbers, type MarketplaceBarber } from "@/lib/booking";
import {
  CATEGORY_LABELS,
  SERVICE_CATEGORIES,
  formatMoney,
  usePlatformSettings,
  type ServiceCategory,
} from "@/lib/shop";

function barbersHref(q: string | undefined, category?: ServiceCategory) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("service", CATEGORY_LABELS[category]);
  const qs = params.toString();
  return qs ? `/barbers?${qs}` : "/barbers";
}

export default function Barbers() {
  useDocumentTitle("Find a barber — Barberly");
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || undefined;
  // Accept ?service=Cut (landing links) as well as ?service=cut.
  const rawCategory = params.get("service")?.toLowerCase() as ServiceCategory | undefined;
  const category = rawCategory && SERVICE_CATEGORIES.includes(rawCategory) ? rawCategory : undefined;
  const barbers = useMarketplaceBarbers();
  const settings = usePlatformSettings();

  const term = q?.toLowerCase();
  const list = (barbers.data ?? []).filter(
    (b) =>
      (!category || b.services.some((s) => s.category === category)) &&
      (!term || [b.name, b.address ?? ""].some((v) => v.toLowerCase().includes(term))),
  );

  function setQuery(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set("q", value);
    else next.delete("q");
    setParams(next, { replace: true });
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-14">
        <p className="eyebrow">Browse</p>
        <h1 className="mt-2 text-5xl font-medium">Find your barber</h1>
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q ?? ""}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or address"
            className="pl-9"
            aria-label="Search barbers"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={barbersHref(q)} className={`rounded-full border px-4 py-1.5 text-sm ${!category ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>All</Link>
          {SERVICE_CATEGORIES.map((c) => (
            <Link key={c} to={barbersHref(q, c)} className={`rounded-full border px-4 py-1.5 text-sm ${category === c ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{CATEGORY_LABELS[c]}</Link>
          ))}
        </div>
        {barbers.isPending ? (
          <p className="mt-10 text-muted-foreground">Loading barbers…</p>
        ) : barbers.isError ? (
          <p className="mt-10 text-destructive">Couldn't load barbers. Please refresh.</p>
        ) : (
          <>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((b) => (
                <ListingCard key={b.id} barber={b} priceFrom={(n) => formatMoney(n, settings.data)} />
              ))}
            </div>
            {list.length === 0 && <p className="mt-10 text-muted-foreground">No barbers match that search yet.</p>}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function ListingCard({ barber, priceFrom }: { barber: MarketplaceBarber; priceFrom: (n: number) => string }) {
  const photo = repPhotoUrl(barber.barber_photos);
  const categories = SERVICE_CATEGORIES.filter((c) => barber.services.some((s) => s.category === c));
  const minPrice = barber.services.length ? Math.min(...barber.services.map((s) => s.price)) : null;

  return (
    <Link to={`/barbers/${barber.id}`} className="sketch group block overflow-hidden bg-card transition-shadow hover:shadow-soft">
      <div className="aspect-[4/5] overflow-hidden border-b-2 border-border bg-secondary">
        {photo ? (
          <img
            src={photo}
            alt={`Work by ${barber.name}`}
            loading="lazy"
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Scissors className="size-10" />
          </div>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-xl font-medium">{barber.name}</h3>
          {barber.address && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" /> <span className="truncate">{barber.address}</span>
            </p>
          )}
        </div>
        {barber.intro && <p className="line-clamp-2 text-sm text-muted-foreground">{barber.intro}</p>}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <span key={c} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-secondary-foreground">
              {CATEGORY_LABELS[c]}
            </span>
          ))}
          {minPrice !== null && <span className="text-xs text-muted-foreground">from {priceFrom(minPrice)}</span>}
        </div>
      </div>
    </Link>
  );
}
