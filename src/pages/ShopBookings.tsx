import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useShop } from "@/components/ShopLayout";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  CATEGORY_LABELS,
  SERVICE_CATEGORIES,
  errorMessage,
  formatMoney,
  overlaps,
  splitIntoSlots,
  useMyBarbers,
  usePlatformSettings,
  type Service,
  type ServiceCategory,
  type Slot,
} from "@/lib/shop";

export default function ShopBookings() {
  useDocumentTitle("Services & schedule — Barberly");
  const { userId, profile } = useShop();
  const barbers = useMyBarbers(userId);
  const [barberId, setBarberId] = useState<string>();
  const payoutDone = Boolean(
    profile.display_name?.trim() &&
    profile.bank_account_name?.trim() &&
    profile.bank_account_number?.trim(),
  );

  useEffect(() => {
    const list = barbers.data ?? [];
    if (!list.some((b) => b.id === barberId)) setBarberId(list[0]?.id);
  }, [barbers.data, barberId]);

  if (barbers.isPending) return null;
  if (!payoutDone || !barbers.data?.length) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-border bg-card p-8">
        <h1 className="text-3xl font-medium">Finish your shop setup first</h1>
        <p className="mt-3 text-muted-foreground">
          {payoutDone
            ? "Add at least one barber, then come back to set services and open times."
            : "Save your shop name and payout details, and add a barber, before publishing services and times."}
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/shop">Go to shop setup</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow mt-6 md:mt-0">Services & schedule</p>
      <h1 className="mt-2 text-4xl font-medium">Your booking menu</h1>
      <div className="mt-6 max-w-xs space-y-1.5">
        <Label>Barber</Label>
        <Select value={barberId ?? ""} onValueChange={setBarberId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a barber" />
          </SelectTrigger>
          <SelectContent>
            {barbers.data.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {barberId && (
        <>
          <ServicesEditor barberId={barberId} />
          <SlotPublisher barberId={barberId} />
        </>
      )}
    </div>
  );
}

/* ── A. Services & price editor ── */

type ServiceDraft = {
  name: string;
  category: ServiceCategory;
  price: string;
  requiredSlots: string;
};
const EMPTY_DRAFT: ServiceDraft = { name: "", category: "cut", price: "", requiredSlots: "1" };

function ServicesEditor({ barberId }: { barberId: string }) {
  const queryClient = useQueryClient();
  const settings = usePlatformSettings();
  const key = ["services", barberId];
  const services = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("barber_id", barberId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(EMPTY_DRAFT);
  const slotMinutes = settings.data?.slot_minutes ?? 30;

  useEffect(() => setEditingId(null), [barberId]);

  function startEdit(s?: Service) {
    setEditingId(s?.id ?? "new");
    setDraft(
      s
        ? {
            name: s.name,
            category: s.category as ServiceCategory,
            price: String(s.price),
            requiredSlots: String(s.required_slots),
          }
        : EMPTY_DRAFT,
    );
  }

  const price = Number(draft.price);
  const requiredSlots = Number(draft.requiredSlots);
  const valid =
    draft.name.trim() !== "" &&
    draft.price !== "" &&
    Number.isInteger(price) &&
    price >= 0 &&
    Number.isInteger(requiredSlots) &&
    requiredSlots >= 1;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !editingId) return;
    // Whole currency units (300 = NT$300) — never multiplied by 100 here.
    const fields = {
      name: draft.name.trim(),
      category: draft.category,
      price,
      required_slots: requiredSlots,
    };
    const { error } =
      editingId === "new"
        ? await supabase.from("services").insert({ ...fields, barber_id: barberId })
        : await supabase.from("services").update(fields).eq("id", editingId);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success("Service saved");
    setEditingId(null);
    await queryClient.invalidateQueries({ queryKey: key });
  }

  async function remove(s: Service) {
    if (!window.confirm(`Delete "${s.name}"?`)) return;
    const { error } = await supabase.from("services").delete().eq("id", s.id);
    if (error) toast.error(errorMessage(error));
    await queryClient.invalidateQueries({ queryKey: key });
  }

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-medium">Services & prices</h2>
        {editingId === null && (
          <Button variant="outline" className="rounded-full" onClick={() => startEdit()}>
            <Plus /> Add service
          </Button>
        )}
      </div>

      {editingId !== null && (
        <form
          onSubmit={save}
          className="mt-6 grid gap-4 rounded-xl bg-secondary/50 p-4 md:grid-cols-4"
        >
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="svc-name">Name *</Label>
            <Input
              id="svc-name"
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Classic cut"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Category *</Label>
            <Select
              value={draft.category}
              onValueChange={(v) => setDraft({ ...draft, category: v as ServiceCategory })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="svc-price">
              Price ({(settings.data?.currency ?? "twd").toUpperCase()}) *
            </Label>
            <Input
              id="svc-price"
              type="number"
              min={0}
              step={1}
              required
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              placeholder="300"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="svc-slots">Time slots needed *</Label>
            <Input
              id="svc-slots"
              type="number"
              min={1}
              step={1}
              required
              value={draft.requiredSlots}
              onChange={(e) => setDraft({ ...draft, requiredSlots: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              One slot is {slotMinutes} min
              {Number.isInteger(requiredSlots) && requiredSlots >= 1
                ? ` — this service takes ${requiredSlots * slotMinutes} min`
                : ""}
              .
            </p>
          </div>
          <div className="flex gap-2 md:col-span-4">
            <Button type="submit" disabled={!valid} className="rounded-full">
              Save service
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {services.data?.length === 0 && editingId === null && (
        <p className="mt-4 text-muted-foreground">No services yet.</p>
      )}
      <ul className="mt-4 divide-y divide-border">
        {services.data?.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-muted-foreground">
                {CATEGORY_LABELS[s.category as ServiceCategory] ?? s.category} ·{" "}
                {s.required_slots * slotMinutes} min ({s.required_slots} slot
                {s.required_slots > 1 ? "s" : ""})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatMoney(s.price, settings.data)}</span>
              <Button variant="ghost" size="sm" onClick={() => startEdit(s)}>
                <Pencil /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => remove(s)}>
                <Trash2 /> Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── B. Publish bookable slots (each slot = platform_settings.slot_minutes long) ── */

function SlotPublisher({ barberId }: { barberId: string }) {
  const queryClient = useQueryClient();
  const settings = usePlatformSettings();
  const slotMinutes = settings.data?.slot_minutes ?? 30;
  const key = ["bookable_slots", barberId];
  const slots = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookable_slots")
        .select("*")
        .eq("barber_id", barberId)
        .gte("ends_at", new Date().toISOString())
        .order("starts_at");
      if (error) throw error;
      return data;
    },
  });
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [from, setFrom] = useState("10:00");
  const [to, setTo] = useState("18:00");
  const [busy, setBusy] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: key });

  const preview = useMemo(() => {
    if (!date || !from || !to) return [];
    return splitIntoSlots(new Date(`${date}T${from}`), new Date(`${date}T${to}`), slotMinutes);
  }, [date, from, to, slotMinutes]);
  const fresh = preview.filter(
    (p) => p.starts_at > new Date() && !(slots.data ?? []).some((s) => overlaps(p, s)),
  );

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!fresh.length) return;
    setBusy(true);
    const { error } = await supabase.from("bookable_slots").insert(
      fresh.map((p) => ({
        barber_id: barberId,
        starts_at: p.starts_at.toISOString(),
        ends_at: p.ends_at.toISOString(),
      })),
    );
    setBusy(false);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success(`Published ${fresh.length} slot${fresh.length > 1 ? "s" : ""}`);
    await refresh();
  }

  async function removeIds(ids: string[]) {
    const { error } = await supabase.from("bookable_slots").delete().in("id", ids);
    if (error) toast.error(errorMessage(error));
    await refresh();
  }

  const byDay = useMemo(() => {
    const groups = new Map<string, Slot[]>();
    for (const s of slots.data ?? []) {
      const day = format(new Date(s.starts_at), "yyyy-MM-dd");
      groups.set(day, [...(groups.get(day) ?? []), s]);
    }
    return [...groups.entries()];
  }, [slots.data]);

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-2xl font-medium">Open times</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a day and a time range — it's split into {slotMinutes}-minute slots customers can book.
      </p>
      <form onSubmit={publish} className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="slot-date">Date</Label>
          <Input
            id="slot-date"
            type="date"
            required
            min={format(new Date(), "yyyy-MM-dd")}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slot-from">From</Label>
          <Input
            id="slot-from"
            type="time"
            required
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slot-to">To</Label>
          <Input
            id="slot-to"
            type="time"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={busy || !fresh.length} className="w-full rounded-full">
            {busy ? "Publishing…" : `Publish ${fresh.length} slot${fresh.length === 1 ? "" : "s"}`}
          </Button>
        </div>
        {preview.length > fresh.length && (
          <p className="text-xs text-muted-foreground md:col-span-4">
            {preview.length - fresh.length} slot(s) skipped because they are in the past or already
            published.
          </p>
        )}
      </form>

      {byDay.length === 0 && <p className="mt-6 text-muted-foreground">No upcoming open times.</p>}
      <div className="mt-6 space-y-5">
        {byDay.map(([day, list]) => (
          <div key={day}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{format(new Date(`${day}T00:00`), "EEE, d MMM yyyy")}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm("Remove all open times on this day?"))
                    void removeIds(list.map((s) => s.id));
                }}
              >
                <Trash2 /> Clear day
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {list.map((s) => (
                <SlotChip
                  key={s.id}
                  slot={s}
                  slotMinutes={slotMinutes}
                  others={list.filter((o) => o.id !== s.id)}
                  onChanged={refresh}
                  onRemove={() => void removeIds([s.id])}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SlotChip({
  slot,
  slotMinutes,
  others,
  onChanged,
  onRemove,
}: {
  slot: Slot;
  slotMinutes: number;
  others: Slot[];
  onChanged: () => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [time, setTime] = useState(format(new Date(slot.starts_at), "HH:mm"));

  async function save() {
    const day = format(new Date(slot.starts_at), "yyyy-MM-dd");
    const starts = new Date(`${day}T${time}`);
    const next = { starts_at: starts, ends_at: new Date(starts.getTime() + slotMinutes * 60_000) };
    if (others.some((o) => overlaps(next, o))) {
      toast.error("That time overlaps another open slot");
      return;
    }
    const { error } = await supabase
      .from("bookable_slots")
      .update({ starts_at: next.starts_at.toISOString(), ends_at: next.ends_at.toISOString() })
      .eq("id", slot.id);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    setEditing(false);
    onChanged();
  }

  if (editing) {
    return (
      <span className="flex items-center gap-1 rounded-full border border-border px-2 py-1">
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="h-7 w-28 text-xs"
        />
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label="Save"
          onClick={() => void save()}
        >
          <Check />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label="Cancel"
          onClick={() => setEditing(false)}
        >
          <X />
        </Button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 rounded-full border border-border py-1 pl-3 pr-1 text-sm">
      {format(new Date(slot.starts_at), "HH:mm")}–{format(new Date(slot.ends_at), "HH:mm")}
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        aria-label="Edit time"
        onClick={() => setEditing(true)}
      >
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        aria-label="Remove slot"
        onClick={onRemove}
      >
        <X />
      </Button>
    </span>
  );
}
