import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DISPLAY_TZ_LABEL,
  dayKey,
  formatDayLabel,
  formatTime,
  freeSlotsKey,
  myBookingsKey,
  startSpans,
} from "@/lib/booking";
import { errMessage } from "@/lib/errors";
import { formatMoney, usePlatformSettings, type Service, type Slot } from "@/lib/shop";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barberId: string;
  services: Service[];
  freeSlots: Slot[];
};

/**
 * The Book pop-up: service → date → start slot → Confirm. The customer stays on
 * /barbers/:id. Confirm only calls create_booking (M1.2 stops at pending_payment);
 * keep onConfirm self-contained so a later step can append to it.
 */
export function BookDialog({ open, onOpenChange, barberId, services, freeSlots }: Props) {
  const settings = usePlatformSettings();
  const queryClient = useQueryClient();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [startId, setStartId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setServiceId(null);
      setDay(null);
      setStartId(null);
    }
  }, [open]);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const n = service?.required_slots ?? 1;
  const spans = useMemo(() => startSpans(freeSlots, n), [freeSlots, n]);

  // Only days that have at least one legal start for the chosen service.
  const days = useMemo(() => {
    const out = new Map<string, string>();
    for (const s of freeSlots) if (spans.has(s.id)) out.set(dayKey(s.starts_at), s.starts_at);
    return [...out.entries()];
  }, [freeSlots, spans]);

  const daySlots = day ? freeSlots.filter((s) => dayKey(s.starts_at) === day) : [];
  const span = startId ? spans.get(startId) ?? null : null;
  const spanIds = new Set(span?.map((s) => s.id));

  function pickService(id: string) {
    setServiceId(id);
    setDay(null);
    setStartId(null);
  }

  async function onConfirm() {
    if (!service || !startId) return;
    setBusy(true);
    const { error } = await supabase.rpc("create_booking", {
      p_service_id: service.id,
      p_start_slot_id: startId,
    });
    setBusy(false);
    if (error) {
      toast.error(errMessage(error, "Could not complete the booking."));
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: freeSlotsKey(barberId) }),
      queryClient.invalidateQueries({ queryKey: myBookingsKey }),
    ]);
    onOpenChange(false);
    toast.success("Booking created — you'll find it under My bookings.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Book an appointment</DialogTitle>
          <DialogDescription>Pick a service, then a day and a start time ({DISPLAY_TZ_LABEL}).</DialogDescription>
        </DialogHeader>

        <section>
          <h3 className="text-sm font-medium">1. Service</h3>
          <div className="mt-2 grid gap-2">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pickService(s.id)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${serviceId === s.id ? "border-primary bg-primary/10" : "border-border"}`}
              >
                <span>
                  {s.name}
                  <span className="ml-2 text-muted-foreground">
                    {s.required_slots * (settings.data?.slot_minutes ?? 30)} min
                  </span>
                </span>
                <span className="font-medium">{formatMoney(s.price, settings.data)}</span>
              </button>
            ))}
          </div>
        </section>

        {service && (
          <section>
            <h3 className="text-sm font-medium">2. Day</h3>
            {days.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No open times long enough for this service right now.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {days.map(([key, iso]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setDay(key);
                      setStartId(null);
                    }}
                    className={`rounded-full border px-3 py-1 text-sm ${day === key ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                  >
                    {formatDayLabel(iso)}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {service && day && (
          <section>
            <h3 className="text-sm font-medium">3. Start time</h3>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {daySlots.map((s) => {
                const legal = spans.has(s.id);
                const inSpan = spanIds.has(s.id);
                const isStart = s.id === startId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!legal}
                    onClick={() => setStartId(s.id)}
                    title={legal ? undefined : "Can't start here — not enough back-to-back time after it"}
                    className={`rounded-md border px-2 py-1.5 text-sm ${
                      inSpan ? "border-primary bg-primary/15" : "border-border"
                    } ${isStart ? "ring-2 ring-primary" : ""} ${legal ? "" : "cursor-not-allowed opacity-40"}`}
                  >
                    {formatTime(s.starts_at)}
                  </button>
                );
              })}
            </div>
            {n > 1 && (
              <p className="mt-2 text-xs text-muted-foreground">
                This service uses {n} slots in a row. Faded times can't be a start time — there isn't enough
                back-to-back time after them (they can still be part of a booking that starts earlier).
              </p>
            )}
          </section>
        )}

        {service && span?.[0] && (
          <div className="rounded-lg bg-secondary p-3 text-sm">
            <p className="font-medium">
              Your booking: {formatDayLabel(span[0].starts_at)}, {formatTime(span[0].starts_at)}–
              {formatTime(span.at(-1)!.ends_at)}
              {n > 1 && ` (${n} slots in a row)`}
            </p>
            <p className="mt-1">
              {service.name} · {formatMoney(service.price, settings.data)}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!service || !startId || busy}>
            {busy ? "Booking…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
