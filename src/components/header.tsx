import { useTranslation } from "react-i18next";
import { DesktopMessagePopover } from "@/app/runtime/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import type { RouteMeta } from "@/routes/registry/meta";

interface SiteHeaderProps {
  routeMeta: RouteMeta;
}

export function SiteHeader({ routeMeta }: SiteHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-4" />
      <h1 className="text-sm font-medium">{t(routeMeta.titleKey)}</h1>
      <div className="ml-auto">
        <DesktopMessagePopover />
      </div>
    </header>
  );
}
