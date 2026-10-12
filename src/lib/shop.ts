import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Barber = Tables<"barbers">;
export type Service = Tables<"services">;
export type Slot = Tables<"bookable_slots">;
export type BarberPhoto = Tables<"barber_photos">;
export type PlatformSettings = Tables<"platform_settings">;

export const PHOTO_BUCKET = "barber-photos";

export const SERVICE_CATEGORIES = ["cut", "color", "perm", "beard"] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  cut: "Cut",
  color: "Color",
  perm: "Perm",
  beard: "Beard",
};

const DEFAULT_SETTINGS: PlatformSettings = {
  id: true,
  currency: "twd",
  currency_minor_units: 0,
  slot_minutes: 30,
  updated_at: "",
};

/** The single platform_settings row (currency + slot length); world-readable. */
export function usePlatformSettings() {
  return useQuery({
    queryKey: ["platform_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_settings").select("*").maybeSingle();
      if (error) throw error;
      return data ?? DEFAULT_SETTINGS;
    },
    staleTime: Infinity,
  });
}

/** Prices are stored as whole units of platform_settings.currency (e.g. 300 = NT$300). */
export function formatMoney(amount: number, settings: PlatformSettings | undefined) {
  const s = settings ?? DEFAULT_SETTINGS;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: s.currency.toUpperCase(),
    minimumFractionDigits: s.currency_minor_units,
    maximumFractionDigits: s.currency_minor_units,
  }).format(amount);
}

export const myBarbersKey = (shopId: string) => ["barbers", shopId] as const;

/** All barbers this shop runs (one shop → many barbers). */
export function useMyBarbers(shopId: string) {
  return useQuery({
    queryKey: myBarbersKey(shopId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbers")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function photoUrl(storagePath: string) {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

/** Storage path rule: the first folder must be the barber id (the Storage policy checks it). */
export function photoPath(barberId: string, fileName: string) {
  const ext = (fileName.split(".").pop() ?? "jpg").toLowerCase();
  return `${barberId}/${crypto.randomUUID()}.${ext}`;
}

/** Split [start, end) into consecutive slotMinutes-long windows. */
export function splitIntoSlots(start: Date, end: Date, slotMinutes: number) {
  const out: { starts_at: Date; ends_at: Date }[] = [];
  const step = slotMinutes * 60_000;
  for (let t = start.getTime(); t + step <= end.getTime(); t += step) {
    out.push({ starts_at: new Date(t), ends_at: new Date(t + step) });
  }
  return out;
}

export function overlaps(
  a: { starts_at: Date; ends_at: Date },
  b: { starts_at: string; ends_at: string },
) {
  return a.starts_at < new Date(b.ends_at) && new Date(b.starts_at) < a.ends_at;
}

export function errorMessage(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String(e.message);
  return "Something went wrong";
}
