import { type ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
  /** What the tooltip should say. */
  label: string;
  /** Wrapper element gets the mouseenter / focus listeners. */
  children: ReactNode;
  /** Side relative to the wrapper. */
  side?: "top" | "right" | "bottom" | "left";
  /** Delay in ms before showing. */
  delay?: number;
  /** Disable rendering entirely. */
  disabled?: boolean;
  className?: string;
}

/**
 * Lightweight portal-based tooltip — mouse hover and keyboard focus both
 * trigger it. We don't pull in @radix-ui/tooltip to keep bundle small.
 */
export function Tooltip({
  label,
  children,
  side = "right",
  delay = 350,
  disabled,
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<number | null>(null);

  function place() {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (side === "right") setCoords({ x: r.right + 8, y: r.top + r.height / 2 });
    else if (side === "left") setCoords({ x: r.left - 8, y: r.top + r.height / 2 });
    else if (side === "top") setCoords({ x: r.left + r.width / 2, y: r.top - 8 });
    else setCoords({ x: r.left + r.width / 2, y: r.bottom + 8 });
  }

  function show() {
    if (disabled) return;
    timerRef.current = window.setTimeout(() => {
      place();
      setOpen(true);
    }, delay);
  }
  function hide() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setOpen(false);
  }

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  const transform =
    side === "right" ? "translate(0, -50%)" :
    side === "left"  ? "translate(-100%, -50%)" :
    side === "top"   ? "translate(-50%, -100%)" :
                       "translate(-50%, 0)";

  return (
    <>
      <span
        ref={wrapRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="contents"
      >
        {children}
      </span>
      {open && createPortal(
        <div
          role="tooltip"
          style={{
            position: "fixed",
            left: coords.x,
            top: coords.y,
            transform,
            zIndex: 1000,
          }}
          className={cn(
            "px-2 py-1 text-[11px] font-medium rounded-md shadow-md pointer-events-none",
            "bg-[var(--color-ink-900)] text-white whitespace-nowrap",
            className
          )}
        >
          {label}
        </div>,
        document.body
      )}
    </>
  );
}
