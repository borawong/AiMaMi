/**
 * 中文职责说明：mcp servers panel 只消费列表、分页和错误状态，不保存服务端事实或表单草稿。
 */
import { useTranslation } from "react-i18next";
import { Pencil, Server, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import type { McpServerSummary } from "@/types";
import type { useMcpPageController } from "../hooks";
import { getMcpServerCommandLine } from "../utils";

type McpPageController = ReturnType<typeof useMcpPageController>;

const transportStyles: Record<string, { dot: string; text: string }> = {
  stdio: { dot: "bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]", text: "text-blue-500" },
  http: { dot: "bg-violet-500 shadow-[0_0_0_2px_rgba(139,92,246,0.2)]", text: "text-violet-500" },
  sse: { dot: "bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]", text: "text-amber-500" },
};

interface McpServersPanelProps {
  list: McpPageController["list"];
  pagination: McpPageController["pagination"];
}

export function McpServersPanel({
  list,
  pagination,
}: McpServersPanelProps) {
  const { t } = useTranslation();

  if (list.isError) {
    return (
      <BentoCard>
        <div className="flex h-48 flex-col items-center justify-center">
          <Server className="h-10 w-10 text-destructive/50" />
          <p className="mt-3 text-sm text-destructive">{t("common.error")}</p>
        </div>
      </BentoCard>
    );
  }

  if (list.isEmpty) {
    return (
      <BentoCard>
        <div className="flex h-48 flex-col items-center justify-center">
          <Server className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">{t("mcp.empty")}</p>
        </div>
      </BentoCard>
    );
  }

  return (
    <div className="space-y-4">
      <BentoCard className="p-0">
        <div className="divide-y divide-border">
          {list.pagedServers.map((server) => (
            <McpServerRow
              key={server.name}
              server={server}
              onToggleServer={list.onToggleServer}
              onEditServer={list.onEditServer}
              onRemoveServer={list.onRemoveServer}
            />
          ))}
        </div>
      </BentoCard>

      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={pagination.onPreviousPage}
                className={cn(pagination.currentPage <= 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            {pagination.range.map((page, index) =>
              page === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === pagination.currentPage}
                    onClick={() => pagination.onPageChange(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                onClick={pagination.onNextPage}
                className={cn(pagination.currentPage >= pagination.totalPages && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

function McpServerRow({
  server,
  onToggleServer,
  onEditServer,
  onRemoveServer,
}: {
  server: McpServerSummary;
  onToggleServer: (name: string, enabled: boolean) => void;
  onEditServer: (server: McpServerSummary) => void;
  onRemoveServer: (name: string) => void;
}) {
  const { t } = useTranslation();
  const transportStyle = transportStyles[server.transport] ?? transportStyles.stdio;

  return (
    <div className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-accent">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold">{server.name}</span>
          <DotBadge dotClass={transportStyle.dot} textClass={transportStyle.text}>
            {server.transport.toUpperCase()}
          </DotBadge>
          <DotBadge
            dotClass={server.enabled
              ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]"
              : "bg-destructive shadow-[0_0_0_2px_rgba(239,68,68,0.2)]"}
            textClass={server.enabled ? "text-emerald-500" : "text-destructive"}
          >
            {server.enabled ? t("mcp.enabled") : t("mcp.disabled")}
          </DotBadge>
        </div>
        <p className="mt-1.5 truncate text-[13px] text-muted-foreground">
          {getMcpServerCommandLine(server)}
        </p>
      </div>
      <div className="ml-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <Switch
          checked={server.enabled}
          onCheckedChange={(enabled) => onToggleServer(server.name, enabled)}
        />
        <Button variant="outline" size="icon-sm" onClick={() => onEditServer(server)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onRemoveServer(server.name)}
          className="text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function DotBadge({
  dotClass,
  textClass,
  children,
}: {
  dotClass: string;
  textClass: string;
  children: React.ReactNode;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 pl-2 pr-2.5 py-0.5 text-[11px] font-medium", textClass)}
    >
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", dotClass)} />
      {children}
    </Badge>
  );
}
