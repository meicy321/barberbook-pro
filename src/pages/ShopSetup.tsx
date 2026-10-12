import { useState } from "react";
import { Link } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ImagePlus,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useShop } from "@/components/ShopLayout";
import { profileQueryKey } from "@/hooks/useProfile";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  PHOTO_BUCKET,
  errorMessage,
  myBarbersKey,
  photoPath,
  photoUrl,
  useMyBarbers,
  type Barber,
  type BarberPhoto,
} from "@/lib/shop";

export default function ShopSetup() {
  useDocumentTitle("Shop setup — Barberly");
  const { profile } = useShop();
  const payoutDone = Boolean(
    profile.display_name?.trim() &&
    profile.bank_account_name?.trim() &&
    profile.bank_account_number?.trim(),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow mt-6 md:mt-0">Shop setup</p>
      <h1 className="mt-2 text-4xl font-medium">{profile.display_name || "Set up your shop"}</h1>
      <p className="mt-2 text-muted-foreground">
        {payoutDone
          ? "Your shop details are saved. Add barbers and their work below."
          : "Fill in your shop name and payout details to finish opening your shop."}
      </p>
      <PayoutSettings done={payoutDone} />
      <BarbersSection />
      {payoutDone && (
        <div className="mt-10 flex justify-end">
          <Button asChild className="rounded-full">
            <Link to="/shop/bookings">Next: services & schedule →</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── A. Payout settings (shop level, shared by all barbers) → profiles ── */

function PayoutSettings({ done }: { done: boolean }) {
  const { userId, profile } = useShop();
  const queryClient = useQueryClient();
  const [shopName, setShopName] = useState(profile.display_name ?? "");
  const [accountName, setAccountName] = useState(profile.bank_account_name ?? "");
  const [accountNumber, setAccountNumber] = useState(profile.bank_account_number ?? "");
  const [busy, setBusy] = useState(false);
  const complete = Boolean(shopName.trim() && accountName.trim() && accountNumber.trim());

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!complete) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: shopName.trim(),
        bank_account_name: accountName.trim(),
        bank_account_number: accountNumber.trim(),
      })
      .eq("id", userId);
    setBusy(false);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success("Payout settings saved");
    await queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) });
  }

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-medium">Payout settings</h2>
        {done && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4" /> Saved
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        The bank account where your shop gets paid. Use test data first. Only you can see these
        details.
      </p>
      <form onSubmit={save} className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="shop-name">Shop name *</Label>
          <Input
            id="shop-name"
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Downtown Cuts"
          />
          <p className="text-xs text-muted-foreground">
            Your shop's name, shown on payout records.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bank-name">Account name *</Label>
          <Input
            id="bank-name"
            required
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bank-number">Account number *</Label>
          <Input
            id="bank-number"
            required
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <Button type="submit" disabled={!complete || busy} className="rounded-full">
            {busy ? "Saving…" : done ? "Update payout settings" : "Save and finish shop signup"}
          </Button>
        </div>
      </form>
    </section>
  );
}

/* ── B. My barbers (one shop → many barbers) ── */

function BarbersSection() {
  const { userId } = useShop();
  const barbers = useMyBarbers(userId);
  const [adding, setAdding] = useState(false);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-medium">My barbers</h2>
        {!adding && (
          <Button variant="outline" className="rounded-full" onClick={() => setAdding(true)}>
            <Plus /> {barbers.data?.length ? "Add another barber" : "Add a barber"}
          </Button>
        )}
      </div>
      {adding && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-6">
          <BarberForm onDone={() => setAdding(false)} />
        </div>
      )}
      {barbers.isError && <p className="mt-4 text-destructive">{errorMessage(barbers.error)}</p>}
      {barbers.data?.length === 0 && !adding && (
        <p className="mt-4 text-muted-foreground">No barbers yet. Add your first one.</p>
      )}
      <div className="mt-4 space-y-6">
        {barbers.data?.map((b) => (
          <BarberCard key={b.id} barber={b} />
        ))}
      </div>
    </section>
  );
}

function BarberForm({ barber, onDone }: { barber?: Barber; onDone: () => void }) {
  const { userId } = useShop();
  const queryClient = useQueryClient();
  const [name, setName] = useState(barber?.name ?? "");
  const [intro, setIntro] = useState(barber?.intro ?? "");
  const [address, setAddress] = useState(barber?.address ?? "");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const fields = {
      name: name.trim(),
      intro: intro.trim() || null,
      address: address.trim() || null,
    };
    const { error } = barber
      ? await supabase.from("barbers").update(fields).eq("id", barber.id)
      : await supabase.from("barbers").insert({ ...fields, shop_id: userId });
    setBusy(false);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success(barber ? "Barber updated" : "Barber added");
    await queryClient.invalidateQueries({ queryKey: myBarbersKey(userId) });
    onDone();
  }

  return (
    <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`name-${barber?.id ?? "new"}`}>Name *</Label>
        <Input
          id={`name-${barber?.id ?? "new"}`}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`address-${barber?.id ?? "new"}`}>Address</Label>
        <Input
          id={`address-${barber?.id ?? "new"}`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor={`intro-${barber?.id ?? "new"}`}>Intro</Label>
        <Textarea
          id={`intro-${barber?.id ?? "new"}`}
          rows={3}
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder="A short bio"
        />
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" disabled={busy || !name.trim()} className="rounded-full">
          {busy ? "Saving…" : barber ? "Save changes" : "Add barber"}
        </Button>
        <Button type="button" variant="ghost" className="rounded-full" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function BarberCard({ barber }: { barber: Barber }) {
  const { userId } = useShop();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete ${barber.name}? Their services, schedule and photos go too.`))
      return;
    // Remove the photo files first; the rows cascade with the barber.
    const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(barber.id);
    if (files?.length) {
      await supabase.storage.from(PHOTO_BUCKET).remove(files.map((f) => `${barber.id}/${f.name}`));
    }
    const { error } = await supabase.from("barbers").delete().eq("id", barber.id);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success("Barber deleted");
    await queryClient.invalidateQueries({ queryKey: myBarbersKey(userId) });
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-6">
      {editing ? (
        <BarberForm barber={barber} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-medium">{barber.name}</h3>
            {barber.address && <p className="text-sm text-muted-foreground">{barber.address}</p>}
            {barber.intro && <p className="mt-2 whitespace-pre-line text-sm">{barber.intro}</p>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={remove}>
              <Trash2 /> Delete
            </Button>
          </div>
        </div>
      )}
      <PhotoManager barberId={barber.id} />
    </article>
  );
}

/* ── C. Sample hairstyle photos (per barber) → Storage + barber_photos ── */

function PhotoManager({ barberId }: { barberId: string }) {
  const queryClient = useQueryClient();
  const key = ["barber_photos", barberId];
  const photos = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barber_photos")
        .select("*")
        .eq("barber_id", barberId)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const [uploading, setUploading] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: key });

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    let order = Math.max(-1, ...(photos.data ?? []).map((p) => p.sort_order)) + 1;
    let failed = 0;
    for (const file of Array.from(files)) {
      const path = photoPath(barberId, file.name);
      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (upErr) {
        failed++;
        continue;
      }
      const { error } = await supabase
        .from("barber_photos")
        .insert({ barber_id: barberId, storage_path: path, sort_order: order++ });
      if (error) {
        failed++;
        await supabase.storage.from(PHOTO_BUCKET).remove([path]);
      }
    }
    setUploading(false);
    if (failed) toast.error(`${failed} photo(s) could not be uploaded`);
    else toast.success("Photos uploaded");
    await refresh();
  }

  async function update(
    photo: BarberPhoto,
    fields: Partial<Pick<BarberPhoto, "caption" | "is_featured" | "sort_order">>,
  ) {
    const { error } = await supabase.from("barber_photos").update(fields).eq("id", photo.id);
    if (error) toast.error(errorMessage(error));
  }

  async function move(index: number, dir: -1 | 1) {
    const list = photos.data ?? [];
    const a = list[index];
    const b = list[index + dir];
    if (!a || !b) return;
    // Renumber the whole list so equal sort_order values can't get stuck.
    const reordered = [...list];
    reordered[index] = b;
    reordered[index + dir] = a;
    await Promise.all(
      reordered.map((p, i) => (p.sort_order === i ? null : update(p, { sort_order: i }))),
    );
    await refresh();
  }

  async function remove(photo: BarberPhoto) {
    const { error: fileErr } = await supabase.storage
      .from(PHOTO_BUCKET)
      .remove([photo.storage_path]);
    if (fileErr) {
      toast.error(errorMessage(fileErr));
      return;
    }
    const { error } = await supabase.from("barber_photos").delete().eq("id", photo.id);
    if (error) toast.error(errorMessage(error));
    await refresh();
  }

  return (
    <div className="mt-6 border-t border-border pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-medium">Sample hairstyle photos</h4>
          <p className="text-xs text-muted-foreground">
            Visible to everyone. Star your best work to feature it.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full" disabled={uploading}>
          <label className="cursor-pointer">
            <ImagePlus /> {uploading ? "Uploading…" : "Upload photos"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                void upload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </Button>
      </div>
      {photos.data?.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">No photos yet.</p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.data?.map((p, i, list) => (
          <figure key={p.id} className="overflow-hidden rounded-xl border border-border">
            <div className="relative aspect-square bg-muted">
              <img
                src={photoUrl(p.storage_path)}
                alt={p.caption ?? ""}
                className="size-full object-cover"
              />
              {p.is_featured && (
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-foreground">
                  Featured
                </span>
              )}
            </div>
            <figcaption className="space-y-2 p-2">
              <Input
                defaultValue={p.caption ?? ""}
                placeholder="Caption"
                className="h-8 text-xs"
                onBlur={(e) => {
                  const caption = e.target.value.trim() || null;
                  if (caption !== p.caption) void update(p, { caption }).then(refresh);
                }}
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={p.is_featured ? "Unfeature" : "Feature"}
                  onClick={() => void update(p, { is_featured: !p.is_featured }).then(refresh)}
                >
                  <Star className={p.is_featured ? "fill-current" : ""} />
                </Button>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Move earlier"
                    disabled={i === 0}
                    onClick={() => void move(i, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Move later"
                    disabled={i === list.length - 1}
                    onClick={() => void move(i, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Delete photo"
                    onClick={() => void remove(p)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
