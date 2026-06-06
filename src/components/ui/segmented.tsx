import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

type AnimatedSegmentedControlItem = {
  value: string;
  label: ReactNode;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: string | number }>;
  disabled?: boolean;
};

type IndicatorFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
};

export function AnimatedSegmentedControl({
  items,
  value,
  onValueChange,
  equalWidth = false,
  className,
  indicatorClassName,
  itemClassName,
  activeItemClassName,
  inactiveItemClassName,
}: {
  items: readonly AnimatedSegmentedControlItem[];
  value: string;
  onValueChange: (
    value: string,
    event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
  ) => void;
  equalWidth?: boolean;
  className?: string;
  indicatorClassName?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  inactiveItemClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const [indicator, setIndicator] = useState<IndicatorFrame>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const itemValues = useMemo(() => items.map((item) => item.value).join("|"), [items]);
  const enabledItems = useMemo(() => items.filter((item) => !item.disabled), [items]);
  const activeIndex = items.findIndex((item) => item.value === value);
  const fallbackFocusableValue = enabledItems[0]?.value ?? null;

  const measure = () => {
    const container = containerRef.current;
    const activeButton = itemRefs.current.get(value);
    if (!container || !activeButton) {
      setIndicator((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeButton.getBoundingClientRect();

    setIndicator({
      left: activeRect.left - containerRect.left,
      top: activeRect.top - containerRect.top,
      width: activeRect.width,
      height: activeRect.height,
      opacity: 1,
    });
  };

  useLayoutEffect(() => {
    measure();
  }, [value, itemValues]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(container);
    for (const item of items) {
      const node = itemRefs.current.get(item.value);
      if (node) {
        observer.observe(node);
      }
    }

    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items, itemValues, value]);

  const focusItem = (nextValue: string) => {
    itemRefs.current.get(nextValue)?.focus();
  };

  const moveByKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentValue: string,
  ) => {
    if (enabledItems.length === 0) {
      return;
    }

    const currentIndex = enabledItems.findIndex((item) => item.value === currentValue);
    if (currentIndex === -1) {
      return;
    }

    let targetValue: string | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      targetValue = enabledItems[(currentIndex + 1) % enabledItems.length]?.value ?? null;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      targetValue =
        enabledItems[(currentIndex - 1 + enabledItems.length) % enabledItems.length]?.value ?? null;
    } else if (event.key === "Home") {
      targetValue = enabledItems[0]?.value ?? null;
    } else if (event.key === "End") {
      targetValue = enabledItems[enabledItems.length - 1]?.value ?? null;
    }

    if (!targetValue) {
      return;
    }

    event.preventDefault();
    focusItem(targetValue);
    onValueChange(targetValue, event);
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      className={cn("relative", equalWidth ? "grid" : "inline-flex", className)}
      style={
        equalWidth
          ? {
              gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
            }
          : undefined
      }
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute transition-[left,top,width,height,opacity] duration-250 ease-out",
          indicatorClassName,
        )}
        style={{
          left: indicator.left,
          top: indicator.top,
          width: indicator.width,
          height: indicator.height,
          opacity: indicator.opacity,
        }}
      />

      {items.map(({ value: itemValue, label, icon: Icon, disabled }) => {
        const active = value === itemValue;
        return (
          <button
            key={itemValue}
            ref={(node) => {
              itemRefs.current.set(itemValue, node);
            }}
            type="button"
            role="radio"
            disabled={disabled}
            aria-checked={active}
            tabIndex={active || (activeIndex === -1 && itemValue === fallbackFocusableValue) ? 0 : -1}
            onClick={(event) => {
              if (disabled) return;
              onValueChange(itemValue, event);
            }}
            onKeyDown={(event) => moveByKeyboard(event, itemValue)}
            className={cn(
              "relative z-[1] flex items-center justify-center transition-colors",
              itemClassName,
              active ? activeItemClassName : inactiveItemClassName,
            )}
          >
            {Icon ? <Icon className="shrink-0" strokeWidth={1.85} /> : null}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
