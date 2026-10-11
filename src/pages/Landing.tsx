import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { BadgeCheck, CalendarClock, ShieldCheck, Star, Search, MapPin, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BarberCard } from "@/components/BarberCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DEMO_BARBERS, SERVICE_KINDS, type ServiceKind } from "@/lib/barbers";
import heroLeft from "@/assets/hero-left.jpg";
import heroRight from "@/assets/hero-right.jpg";


const FEATURES = [
  { icon: BadgeCheck, title: "Verified Barbers", text: "Every profile is reviewed before it goes live." },
  { icon: CalendarClock, title: "Instant Booking", text: "See real open slots and lock one in seconds." },
  { icon: ShieldCheck, title: "Secure Payment", text: "Pay online safely — no cash, no awkwardness." },
  { icon: Star, title: "Top-Rated Styles", text: "Honest reviews from people who sat in the chair." },
];

const SHOPS = ["Ironline", "Studio Lumen", "Old Guard", "Curl House", "Fade Society", "North & Comb"];

export default function Landing() {
  useDocumentTitle("Barberly — Find a great barber, book in a few taps");
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [service, setService] = useState<ServiceKind>("Cut");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero: split photos flanking a centered search */}
      <section className="mx-auto grid max-w-7xl items-center gap-8 px-6 pt-10 pb-16 lg:grid-cols-[1fr_1.3fr_1fr]">
        <img src={heroLeft} alt="Barber giving a skin fade" width={768} height={1024} className="sketch ink-photo hidden aspect-[3/4] w-full object-cover shadow-soft lg:block" />
        <div className="text-center">
          <p className="eyebrow">Barbers & stylists near you</p>
          <h1 className="mt-4 text-5xl leading-[1.05] font-medium md:text-6xl">
            Your next great cut, <em className="text-accent underline decoration-wavy decoration-2 underline-offset-8">booked</em> in a few taps.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-muted-foreground">
            Browse real barbers, compare starting prices, and grab an open slot — no calls, no waiting.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const params = new URLSearchParams({ service });
              if (q) params.set("q", q);
              navigate(`/barbers?${params}`);
            }}
            className="sketch mx-auto mt-8 flex max-w-lg items-center gap-2 bg-card p-2 shadow-soft"
          >
            <MapPin className="ml-3 size-4 shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Area or barber name"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <select
              value={service}
              onChange={(e) => setService(e.target.value as ServiceKind)}
              className="rounded-full border border-border bg-sand px-3 py-2 text-sm outline-none"
              aria-label="Service"
            >
              {SERVICE_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            <Button type="submit" size="icon" className="rounded-full" aria-label="Search">
              <Search />
            </Button>
          </form>
          <div className="mt-4 flex justify-center gap-2 text-xs text-muted-foreground">
            {SERVICE_KINDS.map((k) => (
              <Link key={k} to={`/barbers?service=${k}`} className="rounded-full border border-border bg-card px-3 py-1 text-foreground hover:bg-accent">
                {k}
              </Link>
            ))}
          </div>
        </div>
        <img src={heroRight} alt="Stylist shaping long wavy hair" width={768} height={1024} className="sketch ink-photo hidden aspect-[3/4] w-full object-cover shadow-soft lg:block" />
      </section>

      {/* Trust strip */}
      <section className="hatch border-y-2 border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 py-6">
          <span className="eyebrow">Trusted by shops like</span>
          {SHOPS.map((s) => (
            <span key={s} className="font-display text-xl text-foreground">{s}</span>
          ))}
        </div>
      </section>

      {/* 4-icon features */}
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full border-2 border-border bg-sand text-primary shadow-soft">
              <Icon className="size-6" />
            </span>
            <h3 className="mt-4 text-xl font-medium">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      {/* Popular barbers */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Popular this week</p>
            <h2 className="mt-2 text-4xl font-medium">Top barbers near you</h2>
          </div>
          <Link to="/barbers" className="text-sm underline decoration-accent decoration-wavy underline-offset-4">See all barbers</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_BARBERS.map((b) => (
            <BarberCard key={b.id} barber={b} />
          ))}
        </div>
      </section>

      {/* Barber CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="sketch hatch flex flex-col items-start justify-between gap-6 bg-card p-10 text-foreground shadow-soft md:flex-row md:items-center md:p-14">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <Scissors className="size-6 text-accent" />
              <span aria-hidden className="stripes block h-3 w-14 rounded-sm border border-border" />
            </div>
            <h2 className="mt-4 text-4xl font-medium">Run a shop? List your barbers.</h2>
            <p className="mt-3 text-muted-foreground">Create profiles, set starting prices for cut, color, perm and beard, and publish your schedule. Customers book the open slots.</p>
          </div>
          <Button asChild size="lg" className="rounded-full">
            <Link to="/login?mode=signup&role=shop">List your shop</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
