import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, trailing, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.replace(/\s+/g, "-").toLowerCase();
    return (
      <label htmlFor={inputId} className="flex flex-col gap-1.5 w-full">
        {label && <span className="text-sm font-semibold text-text">{label}</span>}
        <div className="relative flex items-center">
          {icon && <span className="absolute left-4 text-text-muted">{icon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={clsx(
              "w-full rounded-2xl border bg-white px-4 py-3.5 text-[15px] text-text placeholder:text-text-muted/70",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors",
              error ? "border-danger" : "border-border",
              icon && "pl-11",
              trailing && "pr-11",
              className,
            )}
            {...rest}
          />
          {trailing && <span className="absolute right-4">{trailing}</span>}
        </div>
        {error ? (
          <span className="text-xs text-danger font-medium">{error}</span>
        ) : hint ? (
          <span className="text-xs text-text-muted">{hint}</span>
        ) : null}
      </label>
    );
  },
);

Input.displayName = "Input";
export default Input;
