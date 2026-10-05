import { useState, type ReactNode } from "react";
import { ArrowRight, Wrench } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

/**
 * Customer registration / sign-in.
 *
 * Differs from the source component in one deliberate way: the image panel is
 * hover-driven, not on a timer. Nothing animates until the visitor points at a
 * tile, so the page is still on first load.
 */

const showcase = [
  {
    src: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=80",
    caption: "Every job starts with a 40-point inspection — photographed, logged, and visible in your account before a spanner is turned.",
  },
  {
    src: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=900&q=80",
    caption: "Certified mechanics assigned by specialisation, not by whoever is free. Brake work goes to the brake specialist.",
  },
  {
    src: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=900&q=80",
    caption: "Genuine parts only, checked against live stock the moment your booking is confirmed — no collection-day surprises.",
  },
  {
    src: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=900&q=80",
    caption: "Your complete service history in one place. Resale value likes paperwork; we keep it for you.",
  },
];

export default function AuthSection() {
  // null = nothing hovered, so the panel sits completely still on load
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const current = activeIndex ?? 0;

  return (
    <main className="min-h-screen bg-background p-3 text-foreground">
      <div className="relative z-10 grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        {/* ── Left: hover-activated showcase ── */}
        <div className="flex min-h-[720px] justify-center overflow-hidden rounded-3xl bg-[#1c1917] px-7 py-12 text-[#ebe6de] neo sm:px-10 lg:min-h-0 lg:py-16">
          <div className="flex w-full max-w-[500px] flex-col items-center">
            <Link to="/" className="flex items-center gap-3 text-lg font-bold tracking-tight">
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Wrench className="size-5" />
              </span>
              AutoCare
            </Link>

            <div className="relative mt-8 grid w-full grid-cols-[1.55fr_1fr] gap-2.5">
              <ImageTile src={showcase[0].src} index={0} active={activeIndex === 0} idle={activeIndex === null} onHover={setActiveIndex} className="row-span-2 h-[250px]" />
              <ImageTile src={showcase[1].src} index={1} active={activeIndex === 1} idle={activeIndex === null} onHover={setActiveIndex} className="h-[119px]" />
              <ImageTile src={showcase[3].src} index={3} active={activeIndex === 3} idle={activeIndex === null} onHover={setActiveIndex} className="h-[119px]" />
              <ImageTile src={showcase[2].src} index={2} active={activeIndex === 2} idle={activeIndex === null} onHover={setActiveIndex} className="col-span-2 h-[120px]" />
            </div>

            <div className="mt-6 w-full rounded-2xl border border-dashed border-white/15 px-5 py-4">
              <div className="flex items-end gap-4">
                <p className="line-clamp-4 min-h-16 flex-1 text-xs leading-4 text-white/50">
                  <span className="font-bold text-white">
                    {activeIndex === null ? "Hover a photo →" : "AutoCare"}
                  </span>{" "}
                  {activeIndex === null
                    ? "See what actually happens to your car while it's with us."
                    : showcase[current].caption}
                </p>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15 text-white">
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </div>

            <p className="mt-7 max-w-[300px] text-center text-xl leading-tight">
              Servicing you can actually watch happen
            </p>

            <div className="mt-auto flex gap-2 pb-4 pt-8">
              {showcase.map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    activeIndex === index ? "w-10 bg-white" : "w-4 bg-white/30",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="flex min-h-[720px] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-0 lg:px-14 xl:px-20">
          <AuthForm />
        </div>
      </div>
    </main>
  );
}

function ImageTile({
  src, index, active, idle, onHover, className,
}: {
  src: string; index: number; active: boolean; idle: boolean;
  onHover: (i: number | null) => void; className: string;
}) {
  return (
    <div
      className={cn("relative cursor-pointer rounded-2xl", className)}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <img
        src={src}
        alt=""
        className={cn(
          "h-full w-full rounded-2xl object-cover transition-all duration-500",
          idle ? "opacity-80" : active ? "opacity-100" : "opacity-35",
        )}
      />
      <FocusCorners active={active} />
    </div>
  );
}

function FocusCorners({ active }: { active: boolean }) {
  const base = `pointer-events-none absolute size-4 border-white/70 transition-all duration-400 ease-out ${active ? "opacity-100" : "opacity-0"}`;
  return (
    <>
      <span className={cn(base, "-left-1.5 -top-1.5 border-l border-t", !active && "-translate-x-2 -translate-y-2")} />
      <span className={cn(base, "-right-1.5 -top-1.5 border-r border-t", !active && "translate-x-2 -translate-y-2")} />
      <span className={cn(base, "-bottom-1.5 -left-1.5 border-b border-l", !active && "-translate-x-2 translate-y-2")} />
      <span className={cn(base, "-bottom-1.5 -right-1.5 border-b border-r", !active && "translate-x-2 translate-y-2")} />
    </>
  );
}

function AuthForm() {
  const [mode, setMode] = useState<"signup" | "signin">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") await register(name, email, password);
      else await login(email, password);
      navigate(location.state?.from ?? "/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[500px]">
      <div className="mb-7 flex gap-1 rounded-2xl bg-background p-1.5 neo-inset">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null); }}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
              mode === m ? "bg-card text-foreground neo-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {mode === "signup" ? "Create an account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "signup"
          ? "Book services, follow your job card, and keep every invoice in one place."
          : "Pick up where you left off \u2014 your vehicles and history are waiting."}
      </p>

      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <FieldBox label="Full name" placeholder="Ananya Rao" type="text"
            value={name} onChange={setName} autoComplete="name" required />
        )}

        <FieldBox label="Email" placeholder="you@example.com" type="email"
          value={email} onChange={setEmail} autoComplete="email" required />
        <FieldBox label="Password" placeholder="At least 8 characters" type="password"
          value={password} onChange={setPassword}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={8} required />

        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {mode === "signup" && (
          <div className="space-y-3 pt-1 text-xs leading-relaxed text-muted-foreground">
            <CheckboxLine>Send me service reminders and renewal alerts</CheckboxLine>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 flex h-13 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground neo neo-press transition-all hover:brightness-110 disabled:opacity-60"
        >
          {busy ? "Please wait\u2026" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="mt-8 rounded-2xl bg-background p-4 neo-inset">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Demo accounts \u00b7 password autocare123
        </p>
        <div className="mt-2.5 grid gap-1.5">
          {[
            ["manager", "manager@autocare.example"],
            ["receptionist", "desk@autocare.example"],
            ["mechanic", "mechanic@autocare.example"],
            ["customer", "ananya.rao@example.com"],
          ].map(([role, addr]) => (
            <button
              key={role}
              type="button"
              onClick={() => { setMode("signin"); setEmail(addr); setPassword("autocare123"); setError(null); }}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-card"
            >
              <span className="font-semibold capitalize">{role}</span>
              <span className="truncate font-mono text-[11px] text-muted-foreground">{addr}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldBox({
  label, placeholder, type = "text", value, onChange, ...rest
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  const id = `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl bg-background px-4 text-sm neo-inset outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/60"
        {...rest}
      />
    </div>
  );
}

function CheckboxLine({ children }: { children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 size-4 shrink-0">
        <input
          type="checkbox"
          className="peer size-full cursor-pointer appearance-none rounded-md bg-background neo-inset checked:bg-accent"
        />
        <svg viewBox="0 0 12 12" className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-accent-foreground peer-checked:block" fill="none" aria-hidden>
          <path d="M3 6.2 5 8.1 9 3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}
