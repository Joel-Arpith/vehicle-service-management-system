import React from "react";
import { motion, type MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimatedButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  MotionProps & { children?: React.ReactNode };

/**
 * Shine-sweep CTA. Replaces the LiquidMetal shader button from the brief —
 * same "premium" read, zero extra dependencies (no WebGL, no @paper-design).
 */
const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children = "Book a service",
  className = "",
  ...rest
}) => (
  <motion.button
    {...rest}
    whileHover={{ scale: 1.015 }}
    whileTap={{ scale: 0.975 }}
    transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
    className={cn(
      "group relative inline-flex h-13 items-center justify-center overflow-hidden rounded-2xl px-8",
      "bg-primary text-primary-foreground font-semibold tracking-tight neo",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      "disabled:pointer-events-none disabled:opacity-50",
      "[--shine:rgba(255,255,255,.55)] dark:[--shine:rgba(0,0,0,.45)]",
      className,
    )}
  >
    <span className="relative z-10 flex items-center gap-2">{children}</span>
    <motion.span
      aria-hidden
      className="absolute inset-0 block"
      style={{
        background: "linear-gradient(-75deg, transparent 35%, var(--shine) 50%, transparent 65%)",
        backgroundSize: "220% 100%",
      }}
      initial={{ backgroundPosition: "120% 0", opacity: 0 }}
      animate={{ backgroundPosition: ["120% 0", "-20% 0"], opacity: [0, 1, 0] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "linear", repeatDelay: 1.8 }}
    />
  </motion.button>
);

export default AnimatedButton;
