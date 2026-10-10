import { Link, NavLink } from "react-router";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/useAuthSession";

export function SiteHeader() {
  const { user } = useAuthSession();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Scissors className="size-4" />
          </span>
          <span className="font-display text-xl font-semibold">Barberly</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <NavLink
            to="/barbers"
            className={({ isActive }) => (isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            Find a barber
          </NavLink>
          <Link to="/login?mode=signup&role=shop" className="text-muted-foreground hover:text-foreground">
            For barbers
          </Link>
        </nav>
        {user ? (
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to="/dashboard">My account</Link>
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login?mode=signin">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-5">
              <Link to="/login?mode=signup">Get started</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
