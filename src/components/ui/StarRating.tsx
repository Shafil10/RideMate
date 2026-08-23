import { Star } from "lucide-react";
import clsx from "clsx";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  showValue?: boolean;
  count?: number;
}

export default function StarRating({ value, onChange, size = 18, showValue, count }: StarRatingProps) {
  const interactive = Boolean(onChange);

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(n)}
            className={clsx(interactive && "cursor-pointer", !interactive && "cursor-default")}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
          >
            <Star
              size={size}
              className={n <= value ? "fill-accent text-accent" : "fill-transparent text-border"}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-text">
          {value.toFixed(1)}
          {typeof count === "number" && <span className="text-text-muted font-normal"> ({count})</span>}
        </span>
      )}
    </div>
  );
}
