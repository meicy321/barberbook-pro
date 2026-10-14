import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, MapPin, Scissors } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BookDialog } from "@/components/BookDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  DISPLAY_TZ_LABEL,
  dayKey,
  formatDayLabel,
  formatTime,
  useBarberDetail,
  useFreeSlots,
} from "@/lib/booking";
import {
  CATEGORY_LABELS,
  formatMoney,
  photoUrl,
  usePlatformSettings,
  type BarberPhoto,
  type ServiceCategory,
} from "@/lib/shop";

export default function BarberDetail() {
  const { id = "" } = useParams();
  const detail = useBarberDetail(id);
  const freeSlots = useFreeSlots(id);
  const settings = usePlatformSettings();
  const { user, ready } = useAuthSession();
  const navigate = useNavigate();
  const [bookOpen, setBookOpen] = useState(false);
  useDocumentTitle(`${detail.data?.barber?.name ?? "Barber"} — Barberly`);

  function onBook() {
    if (!user) {
      // Sign in first, then come straight back to this barber.
      navigate(`/login?mode=signin&next=${encodeURIComponent(`/barbers/${id}`)}`);
      return;
    }
    setBookOpen(true);
  }

  if (detail.isPending) {
    return (
      <Shell>
        <p className="text-muted-foreground">Loading…</p>
      </Shell>
    );
  }
  if (detail.isError || !detail.data.barber) {
    return (
      <Shell>
        <h1 className="text-3xl font-medium">Barber not found</h1>
        <Link to="/barbers" className="mt-4 inline-block underline">Back to all barbers</Link>
      </Shell>
    );
  }

  const { barber, services, photos } = detail.data;
  const slotsByDay = new Map<string, NonNullable<typeof freeSlots.data>>();
  for (const s of freeSlots.data ?? []) {
    const k = dayKey(s.starts_at);
    slotsByDay.set(k, [...(slotsByDay.get(k) ?? []), s]);
  }

  return (
    <Shell>
      <Link to="/barbers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All barbers
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <PhotoCarousel photos={photos} name={barber.name} />

        <div>
          <p className="eyebrow">Barber</p>
          <h1 className="mt-2 text-4xl font-medium">{barber.name}</h1>
          {barber.address && (
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" /> {barber.address}
            </p>
          )}
          {barber.intro && <p className="mt-4 whitespace-pre-line">{barber.intro}</p>}
          <Button size="lg" className="mt-6 w-full rounded-full" onClick={onBook} disabled={!ready || services.length === 0}>
            Book
          </Button>
          {services.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">This barber hasn't listed any services yet.</p>
          )}
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-medium">Services</h2>
        <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          {services.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_LABELS[s.category as ServiceCategory] ?? s.category} ·{" "}
                  {s.required_slots * (settings.data?.slot_minutes ?? 30)} min ({s.required_slots}{" "}
                  {s.required_slots === 1 ? "slot" : "slots"})
                </p>
              </div>
              <span className="font-medium">{formatMoney(s.price, settings.data)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-medium">Available slots</h2>
        <p className="mt-1 text-sm text-muted-foreground">Times in {DISPLAY_TZ_LABEL}. Press Book to pick a service and start time.</p>
        {freeSlots.isPending ? (
          <p className="mt-4 text-muted-foreground">Loading slots…</p>
        ) : slotsByDay.size === 0 ? (
          <p className="mt-4 text-muted-foreground">No open slots right now — check back soon.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {[...slotsByDay.entries()].map(([day, slots]) => (
              <div key={day}>
                <h3 className="text-sm font-medium">{formatDayLabel(slots[0]!.starts_at)}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <span key={s.id} className="rounded-full border border-border bg-card px-3 py-1 text-sm">
                      {formatTime(s.starts_at)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <BookDialog
        open={bookOpen}
        onOpenChange={setBookOpen}
        barberId={barber.id}
        services={services}
        freeSlots={freeSlots.data ?? []}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** Marketplace-style gallery: main image, prev/next, thumbnails, click to zoom. */
function PhotoCarousel({ photos, name }: { photos: BarberPhoto[]; name: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (photos.length === 0) {
    return (
      <div className="sketch grid aspect-[4/3] place-items-center bg-secondary text-muted-foreground">
        <Scissors className="size-12" />
      </div>
    );
  }

  return (
    <div>
      <Carousel setApi={setApi} opts={{ loop: photos.length > 1 }} className="sketch overflow-hidden bg-card">
        <CarouselContent>
          {photos.map((p) => (
            <CarouselItem key={p.id}>
              <button type="button" className="block w-full cursor-zoom-in" onClick={() => setZoom(photoUrl(p.storage_path))}>
                <img
                  src={photoUrl(p.storage_path)}
                  alt={p.caption ?? `Work by ${name}`}
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        {photos.length > 1 && (
          <>
            <CarouselPrevious className="left-3" />
            <CarouselNext className="right-3" />
          </>
        )}
      </Carousel>
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => api?.scrollTo(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`size-16 shrink-0 overflow-hidden rounded-md border-2 ${i === current ? "border-primary" : "border-transparent opacity-70"}`}
            >
              <img src={photoUrl(p.storage_path)} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <Dialog open={zoom !== null} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">Photo by {name}</DialogTitle>
          {zoom && <img src={zoom} alt={`Work by ${name}`} className="max-h-[80vh] w-full object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
