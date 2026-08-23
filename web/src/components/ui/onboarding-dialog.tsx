import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Car, Wrench, Bell, PartyPopper, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SERVICE_TYPES } from "@/lib/mock-data";

/**
 * Onboarding — each step collects something rather than just advancing a slide,
 * so "Next" stays disabled until the step is actually satisfied.
 */

const REMINDERS = [
  { id: "service", label: "Service due reminders" },
  { id: "insurance", label: "Insurance renewal" },
  { id: "puc", label: "PUC / emission certificate" },
  { id: "offers", label: "Seasonal offers" },
];

export function OnboardingDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [step, setStep] = useState(1);
  const [reg, setReg] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [reminders, setReminders] = useState<string[]>(["service"]);

  const total = 4;
  const reset = () => { setStep(1); setReg(""); setMakeModel(""); setServices([]); setReminders(["service"]); };

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  // A step advances only once it has what it asked for.
  const canAdvance =
    step === 1 ? reg.trim().length >= 4 && makeModel.trim().length >= 2
    : step === 2 ? services.length > 0
    : true;

  const steps = [
    { icon: Car, title: "Add your vehicle", desc: "We'll keep its full service history against this registration number." },
    { icon: Wrench, title: "What does it usually need?", desc: "Pick the services you expect. This only pre-fills your booking form — nothing is committed." },
    { icon: Bell, title: "Stay ahead of renewals", desc: "Choose what we should nudge you about. Change any of this later in settings." },
    { icon: PartyPopper, title: "You're all set", desc: "Your garage is ready. Book a slot whenever it suits you." },
  ];

  const active = steps[step - 1];

  return (
    <Dialog onOpenChange={(open) => { if (open) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Get started</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-[460px] gap-0 p-0">
        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-t-3xl bg-background">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${(step / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
          />
        </div>

        <div className="p-6">
          <DialogHeader className="mb-5 text-left">
            <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-background neo-inset">
              <active.icon className="size-5 text-accent" />
            </span>
            <DialogTitle>{active.title}</DialogTitle>
            <DialogDescription>{active.desc}</DialogDescription>
          </DialogHeader>

          <div className="min-h-[190px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.22 }}
              >
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ob-reg">Registration number</Label>
                      <Input
                        id="ob-reg"
                        value={reg}
                        onChange={(e) => setReg(e.target.value.toUpperCase())}
                        placeholder="KA 01 MJ 4471"
                        className="font-mono tracking-wider"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ob-model">Make &amp; model</Label>
                      <Input
                        id="ob-model"
                        value={makeModel}
                        onChange={(e) => setMakeModel(e.target.value)}
                        placeholder="Maruti Suzuki Baleno Zeta"
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {SERVICE_TYPES.map((s) => {
                      const on = services.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggle(services, setServices, s.id)}
                          className={cn(
                            "rounded-xl p-3 text-left text-xs font-semibold transition-all neo-press",
                            on ? "bg-accent text-accent-foreground neo" : "bg-card neo-flat hover:neo",
                          )}
                        >
                          {s.name}
                          <span className={cn("mt-1 block text-[10px] font-medium", on ? "opacity-80" : "text-muted-foreground")}>
                            {s.duration}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-2.5">
                    {REMINDERS.map((r) => {
                      const on = reminders.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => toggle(reminders, setReminders, r.id)}
                          className="flex w-full items-center gap-3 rounded-xl bg-background p-3 text-left text-sm neo-inset"
                        >
                          <span className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-md transition-colors",
                            on ? "bg-accent text-accent-foreground" : "bg-card neo-flat",
                          )}>
                            {on && <Check className="size-3" strokeWidth={3.5} />}
                          </span>
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-3 rounded-2xl bg-background p-4 neo-inset text-sm">
                    <Row label="Vehicle" value={reg || "—"} mono />
                    <Row label="Model" value={makeModel || "—"} />
                    <Row label="Services" value={`${services.length} selected`} />
                    <Row label="Reminders" value={`${reminders.length} on`} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex gap-1.5">
              {Array.from({ length: total }).map((_, i) => (
                <motion.span
                  key={i}
                  className="h-1.5 rounded-full bg-accent"
                  animate={{ width: i + 1 === step ? 20 : 6, opacity: i + 1 === step ? 1 : 0.25 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="size-3.5" /> Back
                </Button>
              )}
              {step < total ? (
                <Button size="sm" disabled={!canAdvance} onClick={() => setStep(step + 1)} className="group">
                  Next
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              ) : (
                <Button size="sm" variant="accent" asChild>
                  <a href="/app/bookings">Book a slot</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("truncate font-semibold", mono && "font-mono tracking-wider")}>{value}</span>
    </div>
  );
}

export default OnboardingDialog;
