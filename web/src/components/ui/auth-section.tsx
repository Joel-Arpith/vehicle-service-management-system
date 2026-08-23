import { useState, type ReactNode } from "react";
import { ArrowRight, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

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

const formFields = [
  { label: "First Name", placeholder: "Ananya", type: "text" },
  { label: "Last Name", placeholder: "Rao", type: "text" },
];

export default function AuthSection() {
  // null = nothing hovered, so the panel sits completely still on load
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const current = activeIndex ?? 0;

  return (
    <section className="min-h-screen bg-background p-3 text-foreground">
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
    </section>
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
  const [mode, setMode] = useState<"signup" | "signin">("signup");

  return (
    <div className="mx-auto w-full max-w-[500px]">
      <div className="mb-7 flex gap-1 rounded-2xl bg-background p-1.5 neo-inset">
        {(["signup", "signin"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
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
          : "Pick up where you left off — your vehicles and history are waiting."}
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <SocialButton icon={<GoogleIcon />} label="Continue with Google" />
        <SocialButton icon={<AppleIcon />} label="Continue with Apple" />
      </div>

      <div className="my-7 flex items-center gap-4 text-xs uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        {mode === "signup" && (
          <div className="grid gap-5 sm:grid-cols-2">
            {formFields.map((f) => (
              <FieldBox key={f.label} label={f.label} placeholder={f.placeholder} type={f.type} />
            ))}
          </div>
        )}

        <FieldBox label="Email" placeholder="ananya.rao@example.com" type="email" />
        <FieldBox label="Password" placeholder="••••••••••••" type="password" />

        {mode === "signup" && (
          <div className="space-y-3 pt-1 text-xs leading-relaxed text-muted-foreground">
            <CheckboxLine>Send me service reminders and renewal alerts</CheckboxLine>
            <CheckboxLine>
              I agree to the{" "}
              <a href="#" className="font-semibold text-foreground underline underline-offset-2">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="font-semibold text-foreground underline underline-offset-2">Privacy Policy</a>
            </CheckboxLine>
          </div>
        )}

        <button
          type="submit"
          className="mt-8 flex h-13 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground neo neo-press transition-all hover:brightness-110"
        >
          {mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function SocialButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-card px-3 text-sm font-medium neo-flat neo-press transition-all hover:neo"
    >
      <span className="shrink-0">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function FieldBox({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl bg-background px-4 text-sm neo-inset outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/60"
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

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" fill="#EB4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 12.54c-.03-3.02 2.47-4.47 2.58-4.54-1.41-2.06-3.6-2.34-4.38-2.37-1.86-.19-3.64 1.1-4.58 1.1-.95 0-2.42-1.07-3.98-1.04-2.05.03-3.94 1.19-4.99 3.02-2.13 3.69-.54 9.16 1.53 12.15 1.01 1.46 2.22 3.1 3.81 3.04 1.53-.06 2.11-.99 3.96-.99s2.37.99 3.99.96c1.65-.03 2.69-1.49 3.69-2.96 1.16-1.69 1.64-3.33 1.66-3.41-.04-.02-3.2-1.23-3.24-4.87ZM14.03 3.66c.84-1.02 1.41-2.43 1.25-3.84-1.21.05-2.68.81-3.55 1.83-.78.9-1.46 2.34-1.28 3.72 1.35.1 2.73-.69 3.58-1.71Z" />
    </svg>
  );
}
