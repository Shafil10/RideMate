import { type ReactNode } from "react";
import clsx from "clsx";

type Tone = "primary" | "driver" | "accent" | "danger" | "neutral";

interface ChipProps {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  size?: "sm" | "md";
}

const toneClasses: Record<Tone, string> = {
  primary: "bg-primary-light text-primary-dark",
  driver: "bg-driver-light text-driver-dark",
  accent: "bg-accent-light text-amber-800",
  danger: "bg-danger-light text-danger",
  neutral: "bg-slate-100 text-text-muted",
};

export default function Chip({ children, tone = "neutral", icon, size = "sm" }: ChipProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap",
        toneClasses[tone],
        size === "sm" ? "text-[11px] px-2.5 py-1" : "text-xs px-3 py-1.5",
      )}
    >
      {icon}
      {children}
    </span>
  );
}
