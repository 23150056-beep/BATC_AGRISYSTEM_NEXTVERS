import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  /** Mark the field as required visually with an asterisk. */
  requiredMark?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    rightSlot,
    requiredMark,
    className,
    containerClassName,
    id,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {requiredMark && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined
          }
          className={cn(
            "w-full px-3 py-2.5 border rounded-md text-sm outline-none transition-colors bg-white",
            "focus:ring-2 focus:ring-[var(--color-brand-500)]/40 focus:border-[var(--color-brand-500)]",
            leftIcon && "pl-9",
            rightSlot && "pr-10",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-400/40"
              : "border-gray-300",
            className
          )}
          {...props}
        />
        {rightSlot && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
          <AlertCircle size={12} /> {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[11px] text-gray-500 mt-1">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
