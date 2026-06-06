import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/app/providers/i18n";
import { AppQueryClientProvider } from "@/app/providers/query";
import { RouteSettingsProvider } from "@/app/providers/settings";
import { PromptHost } from "@/app/providers/prompt";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AppQueryClientProvider>
        <TooltipProvider delayDuration={200}>
          <PromptHost>
            <RouteSettingsProvider>{children}</RouteSettingsProvider>
          </PromptHost>
        </TooltipProvider>
      </AppQueryClientProvider>
    </I18nProvider>
  );
}
