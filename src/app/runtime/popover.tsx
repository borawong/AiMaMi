/**
 * 中文职责说明：还原 raw 主 chunk 中的 desktop-message 全局消息 popover，只消费 runtime 查询边界。
 */
import { useState } from "react";
import { Bell, Inbox, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  DESKTOP_MESSAGE_QUERY_KEY,
  DESKTOP_MESSAGE_STALE_TIME,
  loadDesktopMessageBoundary,
} from "./message";

export function DesktopMessagePopover() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: DESKTOP_MESSAGE_QUERY_KEY,
    queryFn: loadDesktopMessageBoundary,
    staleTime: DESKTOP_MESSAGE_STALE_TIME,
    enabled: open,
  });
  const message = query.data ?? null;
  const title = message?.title?.trim() || t("messageBoard.defaultTitle");
  const hasBody = Boolean(message?.body?.trim());
  const hasImage = Boolean(message?.imageUrl?.trim());
  const empty = !query.isPending && !query.isError && !hasBody && !hasImage;
  const loading = query.isPending || (open && query.isFetching && !message);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) void query.refetch();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className={cn(
            "relative h-8 w-8 rounded-[8px] text-primary transition-colors duration-200 dark:text-white",
            "hover:bg-accent/80",
          )}
          aria-label={t("messageBoard.openAria")}
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-[340px] p-0"
      >
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <div className="max-h-[min(420px,70vh)] overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">{t("common.loading")}</span>
            </div>
          ) : query.isError ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Inbox className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">{t("messageBoard.loadError")}</p>
            </div>
          ) : empty ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Inbox className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">{t("messageBoard.empty")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hasImage ? (
                <div
                  className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-border bg-muted/30"
                  aria-hidden
                >
                  <img
                    src={message?.imageUrl ?? ""}
                    alt=""
                    className="h-full w-full object-contain object-center"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : null}
              {hasBody ? (
                <p className="whitespace-pre-wrap break-words text-center text-xs leading-relaxed text-muted-foreground">
                  {message?.body}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
