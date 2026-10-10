import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeSignupRole, type SignupRole } from "@/lib/roles";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import heroRight from "@/assets/hero-right.jpg";


export default function Login() {
  useDocumentTitle("Sign in or join — Barberly");
  const [params] = useSearchParams();
  const search = {
    mode: params.get("mode") === "signup" ? ("signup" as const) : ("signin" as const),
    role: params.get("role") ? normalizeSignupRole(params.get("role")) : undefined,
  };
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [role, setRole] = useState<SignupRole>(search.role ?? "customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate("/dashboard", { replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/dashboard", data: { role } },
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      navigate("/dashboard");
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 md:px-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Scissors className="size-4" /></span>
          <span className="font-display text-xl font-semibold">Barberly</span>
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {sent ? (
            <div>
              <h1 className="text-4xl font-medium">Check your email</h1>
              <p className="mt-3 text-muted-foreground">We sent a confirmation link to {email}. Click it to finish creating your account.</p>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-medium">{mode === "signup" ? "Join Barberly" : "Welcome back"}</h1>
              <p className="mt-2 text-muted-foreground">
                {mode === "signup" ? "Book great barbers — or list your shop." : "Sign in to manage your bookings."}
              </p>

              {mode === "signup" && (
                <div role="tablist" aria-label="Account type" className="mt-8 grid grid-cols-2 rounded-full bg-secondary p-1">
                  {(["customer", "shop"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="tab"
                      aria-selected={role === r}
                      onClick={() => setRole(r)}
                      className={`rounded-full py-2 text-sm font-medium transition-colors ${role === r ? "bg-card shadow-soft" : "text-muted-foreground"}`}
                    >
                      {r === "customer" ? "I'm a Customer" : "I'm a Shop"}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={busy} className="w-full rounded-full" size="lg">
                  {busy ? "Please wait…" : mode === "signup" ? (role === "shop" ? "Create shop account" : "Create account") : "Sign in"}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                {mode === "signup" ? "Already have an account? " : "New to Barberly? "}
                <button type="button" className="font-medium text-foreground underline underline-offset-4" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
                  {mode === "signup" ? "Sign in" : "Create one"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
      <img src={heroRight} alt="" width={768} height={1024} className="hidden size-full object-cover lg:block" />
    </div>
  );
}
