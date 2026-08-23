import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderConfirmationCardProps {
  invoiceNo: string;
  paymentMethod: string;
  dateTime: string;
  totalAmount: string;
  regNo?: string;
  onDone: () => void;
  title?: string;
  buttonText?: string;
  className?: string;
}

export const OrderConfirmationCard: React.FC<OrderConfirmationCardProps> = ({
  invoiceNo, paymentMethod, dateTime, totalAmount, regNo,
  onDone,
  title = "Payment received — your vehicle is ready for collection",
  buttonText = "View service history",
  className,
}) => {
  const details = [
    { label: "Invoice", value: invoiceNo },
    ...(regNo ? [{ label: "Vehicle", value: regNo }] : []),
    { label: "Paid via", value: paymentMethod },
    { label: "Date & time", value: dateTime },
    { label: "Total", value: totalAmount, isBold: true },
  ];

  const container = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 110 } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      aria-live="polite"
      className={cn("w-full max-w-[420px] rounded-3xl bg-card p-8 neo", className)}
    >
      <div className="flex flex-col items-center space-y-6 text-center">
        <motion.div variants={item}>
          <span className="grid size-16 place-items-center rounded-full bg-background neo-inset">
            <CheckCircle2 className="size-8 text-success" />
          </span>
        </motion.div>

        <motion.h2 variants={item} className="text-xl font-bold leading-snug tracking-tight">
          {title}
        </motion.h2>

        <motion.div variants={item} className="w-full space-y-3 pt-2">
          {details.map((d, i) => (
            <div
              key={d.label}
              className={cn(
                "flex items-center justify-between gap-4 pb-3 text-sm text-muted-foreground",
                i === details.length - 1 ? "border-none pb-0" : "border-b border-border",
                d.isBold && "font-bold text-card-foreground",
              )}
            >
              <span>{d.label}</span>
              <span className={cn("text-right tabular-nums", d.isBold && "text-lg")}>{d.value}</span>
            </div>
          ))}
        </motion.div>

        <motion.div variants={item} className="w-full pt-2">
          <button
            onClick={onDone}
            className="h-13 w-full rounded-2xl bg-primary font-semibold text-primary-foreground neo neo-press transition-all hover:brightness-110"
          >
            {buttonText}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OrderConfirmationCard;
