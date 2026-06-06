/**
 * 中文职责说明：聚合应用级 Provider，不包含路由状态或业务副作用。
 */
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/app/providers/i18n-provider";
import { AppQueryClientProvider } from "@/app/providers/query-client-provider";
import { RouteSettingsProvider } from "@/app/providers/route-settings-provider";
import { PromptHost } from "@/app/runtime/prompt-host";

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
