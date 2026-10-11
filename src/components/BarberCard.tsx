import { Star, MapPin } from "lucide-react";
import type { DemoBarber } from "@/lib/barbers";

export function BarberCard({ barber }: { barber: DemoBarber }) {
  return (
    <article className="sketch group overflow-hidden bg-card transition-shadow hover:shadow-soft">
      <div className="aspect-[4/5] overflow-hidden border-b-2 border-border bg-card">
        <img
          src={barber.photo}
          alt={`${barber.name}, ${barber.shop}`}
          loading="lazy"
          width={768}
          height={960}
          className="ink-photo size-full object-cover transition duration-500 group-hover:scale-105 group-hover:filter-none"
        />
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xl font-medium">{barber.name}</h3>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {barber.shop} · {barber.area}
            </p>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold">
            <Star className="size-4 fill-accent text-accent" /> {barber.rating.toFixed(1)}
          </span>
        </div>
        <ul className="flex flex-wrap gap-2">
          {barber.services.map((s) => (
            <li key={s.kind} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-secondary-foreground">
              {s.kind} <span className="text-muted-foreground">from NT${s.from}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
