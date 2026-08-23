import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { hapticTap } from "../../lib/haptics";

type Variant = "primary" | "driver" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ConflictingHandlers = "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | ConflictingHandlers> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-sm shadow-primary/30",
  driver: "bg-driver text-white shadow-sm shadow-driver/30",
  outline: "bg-white text-primary border-2 border-primary",
  ghost: "bg-transparent text-text",
  danger: "bg-danger text-white",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-4 py-2 gap-1.5",
  md: "text-[15px] px-5 py-3 gap-2",
  lg: "text-base px-6 py-4 gap-2.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  icon,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
      onTapStart={() => {
        if (!disabled && !loading) hapticTap();
      }}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-semibold transition-opacity",
        "disabled:opacity-50 disabled:cursor-default",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <motion.span
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
        />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
}
