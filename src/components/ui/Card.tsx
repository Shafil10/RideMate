import { type HTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

type ConflictingHandlers = "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, ConflictingHandlers> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

const paddingClasses = { none: "", sm: "p-3", md: "p-4", lg: "p-6" };

export default function Card({ children, padding = "md", interactive, className, ...rest }: CardProps) {
  const Comp = interactive ? motion.div : "div";
  return (
    <Comp
      {...(interactive ? { whileTap: { scale: 0.985 } } : {})}
      className={clsx(
        "bg-card rounded-3xl border border-border/60 shadow-[0_2px_10px_rgba(15,23,42,0.05)]",
        paddingClasses[padding],
        interactive && "cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}
