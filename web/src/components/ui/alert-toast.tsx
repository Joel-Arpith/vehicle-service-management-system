import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, XOctagon, X } from "lucide-react";
import { cn } from "@/lib/utils";

const alertToastVariants = cva(
  "relative flex w-full max-w-sm items-start gap-4 overflow-hidden rounded-2xl p-4 neo",
  {
    variants: {
      variant: {
        success: "",
        warning: "",
        info: "",
        error: "",
      },
      styleVariant: {
        default: "bg-card text-card-foreground",
        filled: "",
      },
    },
    compoundVariants: [
      { variant: "success", styleVariant: "filled", className: "bg-success text-success-foreground" },
      { variant: "warning", styleVariant: "filled", className: "bg-warning text-warning-foreground" },
      { variant: "info", styleVariant: "filled", className: "bg-info text-info-foreground" },
      { variant: "error", styleVariant: "filled", className: "bg-destructive text-destructive-foreground" },
    ],
    defaultVariants: { variant: "info", styleVariant: "default" },
  },
);

const iconMap = { success: CheckCircle2, warning: AlertTriangle, info: Info, error: XOctagon };

const iconColor: Record<string, Record<string, string>> = {
  default: {
    success: "text-success",
    warning: "text-warning",
    info: "text-info",
    error: "text-destructive",
  },
  filled: {
    success: "text-success-foreground",
    warning: "text-warning-foreground",
    info: "text-info-foreground",
    error: "text-destructive-foreground",
  },
};

export interface AlertToastProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, keyof VariantProps<typeof alertToastVariants>>,
    VariantProps<typeof alertToastVariants> {
  title: string;
  description: string;
  onClose: () => void;
}

const AlertToast = React.forwardRef<HTMLDivElement, AlertToastProps>(
  ({ className, variant = "info", styleVariant = "default", title, description, onClose, ...props }, ref) => {
    const Icon = iconMap[variant ?? "info"];
    return (
      <motion.div
        ref={ref}
        role="alert"
        layout
        initial={{ opacity: 0, y: 40, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={cn(alertToastVariants({ variant, styleVariant }), className)}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        <div className="shrink-0">
          <Icon className={cn("size-6", iconColor[styleVariant ?? "default"][variant ?? "info"])} aria-hidden />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold tracking-tight">{title}</p>
          <p className="mt-0.5 text-sm leading-relaxed opacity-85">{description}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className={cn(
            "shrink-0 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <X className="size-4" />
        </button>
      </motion.div>
    );
  },
);
AlertToast.displayName = "AlertToast";

export { AlertToast, alertToastVariants };
