import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KbdProps {
  children: ReactNode;
  className?: string;
}

/** A small keyboard-cap visual for inline shortcut hints. */
export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-semibold",
        "rounded border border-gray-300 bg-gray-50 text-gray-600 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]",
        "font-mono leading-none",
        className
      )}
    >
      {children}
    </kbd>
  );
}
