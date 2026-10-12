import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, Search, ChevronDown, MapPin, Phone, Clock,
  ShieldCheck, Camera, PackageCheck, ReceiptText, Star,
} from "lucide-react";
import { cn, inr } from "@/lib/utils";
import AnimatedButton from "@/components/ui/animated-button";
import OnboardingDialog from "@/components/ui/onboarding-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/auth";
import { SERVICE_TYPES, FAQS, TESTIMONIALS, STATS } from "@/lib/mock-data";

/** Lenis smooth scroll — landing page only, per the brief. */
function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let id = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);
}

const HOW_IT_WORKS = [
  { icon: Search, title: "Book a slot", body: "Pick a service and a time. We check bay and mechanic availability before confirming — no provisional bookings." },
  { icon: Camera, title: "Drop off & inspect", body: "A 40-point inspection is photographed and logged to your job card before any work is quoted." },
  { icon: PackageCheck, title: "Approve & track", body: "Extra work needs your nod. Each task updates as your mechanic completes it — watch it happen." },
  { icon: ReceiptText, title: "Pay & collect", body: "The invoice is computed from the job card itself, so the bill always matches the work recorded." },
];

export default function Landing() {
  useLenis();

  return (
    <div className="relative z-10">
      <Nav />
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <Services />
        <TrackStrip />
        <Testimonials />
        <CustomerForm />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Wrench className="size-4" />
          </span>
          AutoCare
        </Link>
        <nav className="hidden gap-7 text-sm font-medium text-muted-foreground md:flex">
          {["Services", "How it works", "Reviews", "Contact", "FAQ"].map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="transition-colors hover:text-foreground">
              {l}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild><Link to="/auth">Sign in</Link></Button>
          <Button variant="accent" size="sm" asChild><Link to="/app">Open app</Link></Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold neo-flat"
          >
            <span className="size-1.5 rounded-full bg-success" />
            6 bays · 18 certified mechanics · Bengaluru
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Know exactly what's<br />happening to your car.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground"
          >
            Book a slot, follow your job card task by task, and approve any extra work before
            it starts. No phone tag, no surprise line items on collection day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <OnboardingDialog trigger={<AnimatedButton>Book a service</AnimatedButton>} />
            <Button variant="outline" size="lg" asChild>
              <a href="#how-it-works">See how it works</a>
            </Button>
          </motion.div>

          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            6 months / 10,000 km warranty on all labour
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.5 }}
          className="relative"
        >
          <div className="overflow-hidden rounded-3xl neo">
            <img
              src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1200&q=80"
              alt="Mechanic working on a vehicle in a service bay"
              className="h-[420px] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 w-56 rounded-2xl bg-card p-4 neo">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Live · JC-2418
            </p>
            <p className="mt-1.5 text-sm font-semibold">Wheel alignment</p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-background neo-inset">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }} animate={{ width: "60%" }} transition={{ delay: 0.6, duration: 1.2 }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">3 of 5 tasks complete</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid grid-cols-2 gap-4 rounded-3xl bg-card p-8 neo lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-extrabold tracking-tight sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHead
        eyebrow="How it works"
        title="Four steps, and you can see all of them"
        body="Most garages go quiet the moment you hand over the keys. This one doesn't."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.08, duration: 0.45 }}
            className="rounded-3xl bg-card p-6 neo"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-background neo-inset">
                <s.icon className="size-5 text-accent" />
              </span>
              <span className="font-mono text-2xl font-bold text-muted-foreground/25">0{i + 1}</span>
            </div>
            <h3 className="mt-5 font-bold tracking-tight">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHead
        eyebrow="Services"
        title="What we work on"
        body="Indicative starting prices. You get a firm quote after the inspection, before any work begins."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_TYPES.map((s, i) => (
          <motion.article
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: (i % 3) * 0.07, duration: 0.4 }}
            className="group flex flex-col rounded-3xl bg-card p-6 neo transition-transform hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold tracking-tight">{s.name}</h3>
              <span className="shrink-0 rounded-lg bg-background px-2 py-1 font-mono text-[10px] font-semibold text-muted-foreground neo-inset">
                {s.duration}
              </span>
            </div>
            <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">{s.blurb}</p>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm">
                <span className="text-muted-foreground">from </span>
                <span className="font-bold">{inr(s.from)}</span>
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app/bookings">Book →</Link>
              </Button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function TrackStrip() {
  const [reg, setReg] = useState("");
  const navigate = useNavigate();
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl bg-card p-8 neo sm:p-10">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Already dropped your car off?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the registration number and sign in to see live job card progress.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Job-card data is behind auth, so hand the reg to sign-in
              // rather than leaving this button inert.
              navigate("/auth", { state: { from: "/app", reg } });
            }}
            className="flex w-full gap-3 lg:w-auto"
          >
            <input
              value={reg}
              onChange={(e) => setReg(e.target.value.toUpperCase())}
              placeholder="KA 01 MJ 4471"
              aria-label="Registration number"
              className="h-12 w-full rounded-2xl bg-background px-4 font-mono text-sm tracking-wider neo-inset outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/60 lg:w-64"
            />
            <Button variant="accent" size="lg" type="submit" className="shrink-0">
              <Search className="size-4" /> Track
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="reviews" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHead eyebrow="Reviews" title="What customers say" body="Averaged 4.8 across 1,240 verified service visits." />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.09, duration: 0.42 }}
            className="flex flex-col rounded-3xl bg-card p-6 neo"
          >
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} className="size-3.5 fill-current" />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed">"{t.quote}"</blockquote>
            <figcaption className="mt-5 border-t border-border pt-4">
              <p className="text-sm font-bold tracking-tight">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.vehicle}</p>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

function CustomerForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      await api("/enquiries", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) });
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Please try again.");
      setState("idle");
    }
  }

  return (
    <section id="contact" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <SectionHead eyebrow="Your details" title="Tell us about you and your car" body="Leave your details and the front desk will call you back to confirm a slot." />
      <div className="mt-10 rounded-3xl bg-card p-6 neo sm:p-8">
        {state === "sent" ? (
          <div role="status" className="py-8 text-center">
            <p className="text-lg font-semibold tracking-tight">Thanks, we have your details.</p>
            <p className="mt-1 text-sm text-muted-foreground">The front desk will call you within one working day.</p>
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => setState("idle")}>Send another</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="cf-name">Full name</Label>
              <Input id="cf-name" name="name" required maxLength={200} autoComplete="name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cf-phone">Phone</Label>
              <Input id="cf-phone" name="phone" type="tel" required pattern="\+?[0-9 \-]{7,20}" placeholder="+91 98765 43210" autoComplete="tel" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cf-email">Email</Label>
              <Input id="cf-email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cf-reg">Vehicle registration</Label>
              <Input id="cf-reg" name="registration_number" maxLength={20} placeholder="TS 09 AB 1234" />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="cf-service">Service needed</Label>
              <select id="cf-service" name="service" defaultValue="" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="">Not sure yet</option>
                {SERVICE_TYPES.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="cf-msg">Anything we should know?</Label>
              <textarea id="cf-msg" name="message" rows={3} maxLength={1000} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
            </div>
            {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" variant="accent" disabled={state === "sending"} className="w-full sm:w-auto">
                {state === "sending" ? "Sending…" : "Send my details"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <SectionHead eyebrow="FAQ" title="Questions people actually ask" body="" />
      <div className="mt-10 space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="overflow-hidden rounded-2xl bg-card neo">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
              >
                <span className="text-sm font-semibold tracking-tight">{f.q}</span>
                <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="max-w-2xl">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</span>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {body && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{body}</p>}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Wrench className="size-4" />
            </span>
            AutoCare
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            An independent multi-brand service centre. Genuine parts, certified mechanics,
            and a job card you can actually follow.
          </p>
        </div>

        <div>
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Visit us</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0" />
              <span>#42, 3rd Cross, Indiranagar<br />Bengaluru 560038</span></li>
            <li className="flex gap-2.5"><Phone className="mt-0.5 size-4 shrink-0" /><span>+91 80 4567 8900</span></li>
            <li className="flex gap-2.5"><Clock className="mt-0.5 size-4 shrink-0" />
              <span>Mon – Sat, 08:00 – 19:00<br />Sunday closed</span></li>
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Links</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {[
              { l: "Book a service", to: "/app/bookings" },
              { l: "Track your car", to: "/app/jobs" },
              { l: "Sign in", to: "/auth" },
              { l: "Staff console", to: "/app" },
            ].map((x) => (
              <li key={x.l}><Link to={x.to} className="transition-colors hover:text-foreground">{x.l}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <p>© 2026 AutoCare Service Centre. Academic project — all data is fictional.</p>

        </div>
      </div>
    </footer>
  );
}
