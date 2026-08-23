import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  illustration?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function EmptyState({ illustration, title, subtitle, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center gap-4 py-10 px-6"
    >
      {illustration && <div className="w-40 h-40">{illustration}</div>}
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-lg font-bold text-text">{title}</h3>
        {subtitle && <p className="text-sm text-text-muted max-w-xs">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}
