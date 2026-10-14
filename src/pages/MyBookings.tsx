import { useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DISPLAY_TZ_LABEL, formatDateTime, formatTime, myBookingsKey, useMyBookings } from "@/lib/booking";
import { errMessage } from "@/lib/errors";
import { formatMoney, usePlatformSettings } from "@/lib/shop";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Reserved",
  paid: "Paid",
  cancelled: "Cancelled",
};

export default function MyBookings() {
  useDocumentTitle("My bookings — Barberly");
  const bookings = useMyBookings();
  const settings = usePlatformSettings();
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function cancel(id: string) {
    setCancelling(id);
    // Only the status changes here; trg_free_slots_on_cancel releases the held slots.
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    setCancelling(null);
    if (error) {
      toast.error(errMessage(error, "Could not cancel the booking."));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: myBookingsKey });
    await queryClient.invalidateQueries({ queryKey: ["free-slots"] });
    toast.success("Booking cancelled.");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-14">
        <p className="eyebrow">Your account</p>
        <h1 className="mt-2 text-4xl font-medium">My bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Times in {DISPLAY_TZ_LABEL}.</p>

        {bookings.isPending ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : bookings.isError ? (
          <p className="mt-8 text-destructive">{errMessage(bookings.error, "Couldn't load your bookings.")}</p>
        ) : bookings.data.length === 0 ? (
          <div className="mt-8">
            <p className="text-muted-foreground">You have no bookings yet.</p>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/barbers">Find a barber</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {bookings.data.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
                <div>
                  <p className="font-medium">
                    {b.service?.barber ? (
                      <Link to={`/barbers/${b.service.barber.id}`} className="hover:underline">
                        {b.service.barber.name}
                      </Link>
                    ) : (
                      "Barber"
                    )}{" "}
                    · {b.service?.name ?? "Service"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {b.starts_at
                      ? `${formatDateTime(b.starts_at)}${b.ends_at ? `–${formatTime(b.ends_at)}` : ""}`
                      : "Time unavailable"}{" "}
                    · {formatMoney(b.price, settings.data)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={b.status === "cancelled" ? "outline" : "secondary"} className="uppercase tracking-wide">
                    {STATUS_LABELS[b.status] ?? b.status}
                  </Badge>
                  {b.status !== "cancelled" && (
                    <Button variant="outline" size="sm" disabled={cancelling === b.id} onClick={() => cancel(b.id)}>
                      {cancelling === b.id ? "Cancelling…" : "Cancel"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
