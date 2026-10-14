import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { photoUrl, type Barber, type BarberPhoto, type Service, type Slot } from "@/lib/shop";

/** Slots are timestamptz; buyers see them in the shop's time zone, labelled on screen. */
export const DISPLAY_TZ = "Asia/Taipei";
export const DISPLAY_TZ_LABEL = "Taipei time";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: DISPLAY_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY_TZ,
  hour: "2-digit",
  minute: "2-digit",
});
const dayLabelFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY_TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY_TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** YYYY-MM-DD of a timestamp in the display time zone (never a naive local slice). */
export const dayKey = (iso: string) => dayKeyFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatDayLabel = (iso: string) => dayLabelFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

export type MarketplaceBarber = Barber & {
  services: Pick<Service, "id" | "category" | "price">[];
  barber_photos: Pick<BarberPhoto, "storage_path" | "is_featured" | "created_at">[];
};

/** Rep photo for a card: first featured, else newest, else none (placeholder). */
export function repPhotoUrl(photos: MarketplaceBarber["barber_photos"]) {
  const featured = photos.find((p) => p.is_featured);
  const newest = [...photos].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const pick = featured ?? newest;
  return pick ? photoUrl(pick.storage_path) : null;
}

/** Every barber, with service categories/prices and photos for the browse grid. */
export function useMarketplaceBarbers() {
  return useQuery({
    queryKey: ["marketplace-barbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbers")
        .select("*, services(id, category, price), barber_photos(storage_path, is_featured, created_at)")
        .order("created_at");
      if (error) throw error;
      return data as MarketplaceBarber[];
    },
  });
}

/** One barber's profile, services and photos (photos: featured first, then sort_order). */
export function useBarberDetail(barberId: string) {
  return useQuery({
    queryKey: ["barber-detail", barberId],
    queryFn: async () => {
      const [barber, services, photos] = await Promise.all([
        supabase.from("barbers").select("*").eq("id", barberId).maybeSingle(),
        supabase.from("services").select("*").eq("barber_id", barberId).order("price"),
        supabase
          .from("barber_photos")
          .select("*")
          .eq("barber_id", barberId)
          .order("is_featured", { ascending: false })
          .order("sort_order"),
      ]);
      if (barber.error) throw barber.error;
      if (services.error) throw services.error;
      if (photos.error) throw photos.error;
      return { barber: barber.data, services: services.data, photos: photos.data };
    },
  });
}

export const freeSlotsKey = (barberId: string) => ["free-slots", barberId] as const;

/**
 * Upcoming slots no booking holds — the NOT EXISTS anti-join against booking_slots
 * (left-embed booking_slots, keep rows where it is null). Slots have no status column.
 */
export function useFreeSlots(barberId: string) {
  return useQuery({
    queryKey: freeSlotsKey(barberId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookable_slots")
        .select("id, barber_id, starts_at, ends_at, created_at, booking_slots!left(slot_id)")
        .eq("barber_id", barberId)
        .gt("starts_at", new Date().toISOString())
        .is("booking_slots", null)
        .order("starts_at");
      if (error) throw error;
      return data.map(({ booking_slots: _held, ...slot }) => slot) as Slot[];
    },
  });
}

/**
 * Legal start slots for a service needing n slots: the slot itself plus the next n-1
 * free slots must run back-to-back (each starts where the previous ends). A held slot
 * in between leaves a gap in the free list, so it also disqualifies the start.
 */
export function startSpans(freeSlots: Slot[], n: number) {
  const spans = new Map<string, Slot[]>();
  for (let i = 0; i + n <= freeSlots.length; i++) {
    const run = freeSlots.slice(i, i + n);
    const contiguous = run.every((s, k) => {
      const prev = run[k - 1];
      return !prev || new Date(s.starts_at).getTime() === new Date(prev.ends_at).getTime();
    });
    if (contiguous && run[0]) spans.set(run[0].id, run);
  }
  return spans;
}

export type MyBooking = {
  id: string;
  status: string;
  price: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  service: { name: string; barber: { id: string; name: string } | null } | null;
};

export const myBookingsKey = ["my-bookings"] as const;

/** The signed-in customer's bookings (RLS: own rows only), newest start first. */
export function useMyBookings() {
  return useQuery({
    queryKey: myBookingsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_with_start")
        .select("id, status, price, starts_at, ends_at, created_at, service:services(name, barber:barbers(id, name))")
        // Cancelled bookings have released their slots (no start time) — list them last.
        .order("starts_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as unknown as MyBooking[];
    },
  });
}
