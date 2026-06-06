import type { ReactNode } from "react";

import { Spinner } from "@/components/ui/spinner";

interface ButtonBusyContentProps {
  busy: boolean;
  idleIcon?: ReactNode;
  idleLabel?: ReactNode;
  busyLabel?: ReactNode;
  spinnerClassName?: string;
  spinnerSide?: "inline-start" | "inline-end";
}

export function ButtonBusyContent({
  busy,
  idleIcon,
  idleLabel,
  busyLabel,
  spinnerClassName = "h-3.5 w-3.5",
  spinnerSide = "inline-start",
}: ButtonBusyContentProps) {
  return (
    <>
      {busy ? <Spinner className={spinnerClassName} data-icon={spinnerSide} /> : idleIcon}
      {busy ? busyLabel : idleLabel}
    </>
  );
}
