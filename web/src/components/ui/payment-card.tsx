import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CreditCard, Lock, Landmark, Smartphone } from "lucide-react";
import { cn, inr } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentCardProps {
  amount: number;
  invoiceNo: string;
  parts: number;
  labour: number;
  tax: number;
  taxRate: number;
  busy?: boolean;
  onPaid?: (method: string) => void;
  className?: string;
}

const methods = [
  { id: "card", label: "Card", icon: CreditCard },
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "netbanking", label: "Bank", icon: Landmark },
] as const;

export function PaymentCard({ amount, invoiceNo, parts, labour, tax, taxRate, busy, onPaid, className }: PaymentCardProps) {
  const [method, setMethod] = useState<string>("card");

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("w-full max-w-[420px]", className)}
    >
      <div className="rounded-3xl bg-card p-6 neo">
        <header className="mb-5">
          <h3 className="text-lg font-bold tracking-tight">Settle invoice</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {invoiceNo} · totals computed from the job card, not entered by hand.
          </p>
        </header>

        <div className="mb-6 grid grid-cols-3 gap-2.5">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition-all neo-press",
                method === m.id ? "bg-accent text-accent-foreground neo" : "bg-card neo-flat hover:neo",
              )}
            >
              <m.icon className="size-4" />
              {m.label}
            </button>
          ))}
        </div>

        {method === "card" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card number</Label>
              <div className="relative">
                <Input id="cardNumber" placeholder="0000 0000 0000 0000" inputMode="numeric" className="pl-11" />
                <CreditCard className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry</Label>
                <div className="relative">
                  <Input id="expiry" placeholder="MM/YY" inputMode="numeric" className="pl-11" />
                  <Calendar className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <div className="relative">
                  <Input id="cvc" placeholder="123" inputMode="numeric" maxLength={4} className="pl-11" />
                  <Lock className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Cardholder name</Label>
              <Input id="name" placeholder="Vikram Shetty" />
            </div>
          </div>
        ) : method === "upi" ? (
          <div className="space-y-2">
            <Label htmlFor="vpa">UPI ID</Label>
            <Input id="vpa" placeholder="yourname@bank" />
            <p className="pt-1 text-xs text-muted-foreground">You'll get a collect request on your UPI app.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="bank">Select bank</Label>
            <select id="bank" className="h-11 w-full rounded-xl bg-background px-4 text-sm neo-inset outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>State Bank of India</option>
              <option>Axis Bank</option>
              <option>Kotak Mahindra Bank</option>
            </select>
          </div>
        )}

        <div className="mt-6 space-y-2 rounded-2xl bg-background p-4 neo-inset">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Parts</span><span className="tabular-nums">{inr(parts)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Labour</span><span className="tabular-nums">{inr(labour)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>GST ({Math.round(taxRate * 100)}%)</span><span className="tabular-nums">{inr(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-bold">
            <span>Total</span><span className="tabular-nums">{inr(amount)}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => onPaid?.(method)}
          className="mt-5 h-13 w-full disabled:opacity-60 rounded-2xl bg-primary font-semibold text-primary-foreground neo neo-press transition-all hover:brightness-110"
        >
          {busy ? "Processing…" : `Pay ${inr(amount)}`}
        </button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock className="size-3" /> Payments are secure and encrypted
        </p>
      </div>
    </motion.div>
  );
}

export default PaymentCard;
