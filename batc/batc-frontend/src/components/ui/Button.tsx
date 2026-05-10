import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // base
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap select-none",
    "font-medium rounded-md outline-none transition-all",
    "focus-visible:ring-2 focus-visible:ring-offset-1",
    "disabled:opacity-55 disabled:cursor-not-allowed disabled:pointer-events-none",
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-[#3B6D11] text-white shadow-sm hover:bg-[#2f560d] focus-visible:ring-[#3B6D11]/40",
        secondary:
          "bg-white border border-gray-300 text-gray-800 shadow-sm hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-400/50",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400/40",
        danger:
          "bg-[#b42318] text-white shadow-sm hover:bg-[#971a10] focus-visible:ring-red-500/40",
        warning:
          "bg-[#c2682e] text-white shadow-sm hover:bg-[#a55522] focus-visible:ring-orange-500/40",
        link:
          "bg-transparent text-[#3B6D11] hover:underline underline-offset-2 focus-visible:ring-[#3B6D11]/40 px-0 py-0 shadow-none",
      },
      size: {
        sm: "h-8 px-2.5 text-xs gap-1",
        md: "h-9 px-3.5 text-sm",
        lg: "h-11 px-5 text-sm",
        icon: "h-9 w-9 p-0",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, loading, disabled, leftIcon, rightIcon, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === "sm" ? 13 : 15} className="animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
