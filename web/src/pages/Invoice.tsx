import { useState } from "react";
import PaymentCard from "@/components/ui/payment-card";
import OrderConfirmationCard from "@/components/ui/order-confirmation-card";
import { api } from "@/lib/auth";
import { inr } from "@/lib/utils";
import { invoiceParts, useFetch, type ApiInvoice } from "@/lib/data";
import { cn } from "@/lib/utils";

const methodLabel: Record<string, string> = { card: "Card", upi: "UPI", netbanking: "Net banking" };

export default function Invoice() {
  const { data, error, loading, reload } = useFetch<ApiInvoice[]>("/invoices");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ inv: ApiInvoice; method: string; at: string } | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (data ?? []).filter((i) => i.outstanding > 0);
  const inv = open.find((i) => i.id === pickedId) ?? open[0];

  const pay = async (method: string) => {
    if (!inv) return;
    setBusy(true);
    setPayError(null);
    try {
      // Amount is the server's own outstanding figure; the server re-checks it.
      await api("/payments", { method: "POST", body: JSON.stringify({ invoice_id: inv.id, amount: inv.outstanding, method }) });
      setReceipt({ inv, method, at: new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) });
      reload();
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Invoice &amp; payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Totals are computed by the server from the job card; the amount paid is the outstanding balance.
        </p>
      </header>

      {loading && <p className="text-sm text-muted-foreground">Loading invoices…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {payError && <p role="alert" className="text-sm text-destructive">{payError}</p>}

      {open.length > 1 && !receipt && (
        <div className="flex flex-wrap gap-2">
          {open.map((i) => (
            <button
              key={i.id}
              onClick={() => setPickedId(i.id)}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all neo-press",
                inv?.id === i.id ? "bg-accent text-accent-foreground neo" : "bg-card neo-flat hover:neo",
              )}
            >
              <span className="font-mono text-xs">INV-{i.id.slice(-4).toUpperCase()}</span>
              <span className="ml-2 opacity-75">{i.registration_number} · {inr(i.outstanding)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-center py-4">
        {receipt ? (
          <OrderConfirmationCard
            invoiceNo={`INV-${receipt.inv.id.slice(-4).toUpperCase()}`}
            regNo={receipt.inv.registration_number ?? undefined}
            paymentMethod={methodLabel[receipt.method] ?? receipt.method}
            dateTime={receipt.at}
            totalAmount={inr(receipt.inv.outstanding)}
            onDone={() => setReceipt(null)}
          />
        ) : inv ? (
          <PaymentCard
            amount={inv.outstanding}
            invoiceNo={`INV-${inv.id.slice(-4).toUpperCase()}`}
            parts={invoiceParts(inv)}
            labour={inv.subtotal - invoiceParts(inv)}
            tax={inv.tax}
            taxRate={inv.tax_rate}
            busy={busy}
            onPaid={pay}
          />
        ) : (
          !loading && !error && <p className="text-sm text-muted-foreground">No unpaid invoices.</p>
        )}
      </div>
    </div>
  );
}
