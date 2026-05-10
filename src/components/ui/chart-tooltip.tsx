import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const OFFSET = 14;
const VIEWPORT_PADDING = 12;

export function ChartTooltip({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x + OFFSET, top: y + OFFSET, ready: false });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x + OFFSET;
    let top = y + OFFSET;

    if (left + rect.width > viewportWidth - VIEWPORT_PADDING) {
      left = x - rect.width - OFFSET;
    }
    if (top + rect.height > viewportHeight - VIEWPORT_PADDING) {
      top = y - rect.height - OFFSET;
    }

    left = Math.max(VIEWPORT_PADDING, Math.min(left, viewportWidth - rect.width - VIEWPORT_PADDING));
    top = Math.max(VIEWPORT_PADDING, Math.min(top, viewportHeight - rect.height - VIEWPORT_PADDING));

    setPosition({ left, top, ready: true });
  }, [x, y, children]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={ref}
      className="pointer-events-none fixed z-50 rounded-[8px] border border-border bg-popover px-2 py-1.5 text-[10px] leading-[1.6] text-center shadow-lg dark:[&_div]:text-foreground"
      style={{
        left: position.left,
        top: position.top,
        opacity: position.ready ? 1 : 0,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
