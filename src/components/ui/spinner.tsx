import type { ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface SpinnerProps extends ComponentProps<typeof LoaderCircle> {
  "data-icon"?: "inline-start" | "inline-end";
}

export function Spinner({
  className,
  "data-icon": dataIcon,
  ...props
}: SpinnerProps) {
  return (
    <LoaderCircle
      aria-hidden="true"
      data-icon={dataIcon}
      className={cn(
        "[animation:spin_0.78s_linear_infinite]",
        dataIcon === "inline-start" && "-ml-0.5",
        dataIcon === "inline-end" && "-mr-0.5",
        className,
      )}
      {...props}
    />
  );
}
