import { cn } from "@/lib/utils";
import { AnimatedSegmentedControl } from "@/components/ui/segmented";

type SegmentedOption = {
  value: string;
  label: string;
};

export function SegmentedOptions({
  items,
  value,
  onChange,
  className,
}: {
  items: readonly SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-full bg-muted p-0.5 dark:bg-white/[0.06]", className)}>
      <AnimatedSegmentedControl
        items={items}
        value={value}
        onValueChange={(nextValue) => onChange(nextValue)}
        className="gap-0.5"
        indicatorClassName="rounded-full bg-primary shadow-sm"
        itemClassName="rounded-full px-[18px] py-[5px] text-[13px] font-medium whitespace-nowrap"
        activeItemClassName="text-primary-foreground"
        inactiveItemClassName="text-muted-foreground hover:text-foreground"
      />
    </div>
  );
}
