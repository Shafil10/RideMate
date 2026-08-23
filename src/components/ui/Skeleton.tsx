import clsx from "clsx";

interface SkeletonProps {
  className?: string;
  rounded?: "full" | "2xl" | "lg";
}

export default function Skeleton({ className, rounded = "lg" }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-slate-200/80",
        rounded === "full" && "rounded-full",
        rounded === "2xl" && "rounded-2xl",
        rounded === "lg" && "rounded-lg",
        className,
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card rounded-3xl border border-border/60 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11" rounded="full" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}
