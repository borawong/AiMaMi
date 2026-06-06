import type { ReactNode } from "react";
import "@/lib/i18n";

export function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
