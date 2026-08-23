import clsx from "clsx";

const PALETTE = [
  "bg-primary text-white",
  "bg-driver text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-violet-500 text-white",
  "bg-teal-500 text-white",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg" };

export default function Avatar({ name, size = "md" }: AvatarProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center rounded-full font-bold shrink-0 select-none",
        colorFor(name),
        sizeClasses[size],
      )}
      aria-hidden
    >
      {initials(name) || "?"}
    </div>
  );
}
