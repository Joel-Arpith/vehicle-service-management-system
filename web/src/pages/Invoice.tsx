import { useState } from "react";
import PaymentCard from "@/components/ui/payment-card";
import OrderConfirmationCard from "@/components/ui/order-confirmation-card";
import { inr } from "@/lib/utils";
import { INVOICE_5521 } from "@/lib/mock-data";

const AMOUNT = INVOICE_5521.total;

export default function Invoice() {
  const [paid, setPaid] = useState(false);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Invoice &amp; payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {INVOICE_5521.jobId} · {INVOICE_5521.regNo} — totals derived from the job card.
        </p>
      </header>

      {/* ponytail: plain conditional, not AnimatePresence mode="wait".
          Each card animates itself on mount; gating the receipt behind the
          payment card's exit animation would strand the user on the form
          if that animation never completes. */}
      <div className="flex justify-center py-4">
        {paid ? (
          <OrderConfirmationCard
            invoiceNo={INVOICE_5521.no}
            regNo={INVOICE_5521.regNo}
            paymentMethod="Card · **** 4471"
            dateTime="23/08/26 16:20"
            totalAmount={inr(AMOUNT)}
            onDone={() => setPaid(false)}
          />
        ) : (
          <PaymentCard amount={AMOUNT} invoiceNo={INVOICE_5521.no} onPaid={() => setPaid(true)} />
        )}
      </div>
    </div>
  );
}
