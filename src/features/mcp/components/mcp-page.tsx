import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/button-busy-content";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BentoCard } from "@/components/ui/bento-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Server, Plus, Pencil, Trash2, RotateCw, Copy } from "lucide-react";
import type { McpServerSummary, McpTransport } from "@/types";
import { useBusyAction } from "@/hooks/use-busy-action";
import {
  useMcpServerMutations,
  useMcpServers,
  useUpsertMcpServerMutation,
  type UpsertMcpServerInput,
} from "../hooks";

const transportStyles: Record<string, { dot: string; text: string }> = {
  stdio: { dot: "bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]", text: "text-blue-500" },
  http: { dot: "bg-violet-500 shadow-[0_0_0_2px_rgba(139,92,246,0.2)]", text: "text-violet-500" },
  sse: { dot: "bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]", text: "text-amber-500" },
};

function DotBadge({ dotClass, textClass, children }: { dotClass: string; textClass: string; children: React.ReactNode }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 pl-2 pr-2.5 py-0.5 text-[11px] font-medium", textClass)}>
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", dotClass)} />
      {children}
    </Badge>
  );
}

export function McpPage() {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<McpServerSummary | "new" | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const refreshAction = useBusyAction({ minVisibleMs: 800 });
  const { data, refresh } = useMcpServers();
  const { toggleMutation, removeMutation } = useMcpServerMutations({
    onRemoved: () => setRemoving(null),
  });

  const refreshBusy = refreshAction.busy;

  const handleRefresh = async () => {
    await refreshAction.run(async () => {
      await refresh();
    });
  };

  const servers = data?.data.items ?? [];
  const enabledCount = servers.filter((s) => s.enabled).length;
  const sourcePath = data?.data.sourcePath ?? "";

  const totalPages = Math.max(1, Math.ceil(servers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedServers = servers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const paginationRange = useMemo(() => {
    const range: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1);
      if (safePage > 3) range.push("ellipsis");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) range.push(i);
      if (safePage < totalPages - 2) range.push("ellipsis");
      range.push(totalPages);
    }
    return range;
  }, [totalPages, safePage]);

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <p className="max-w-md text-sm text-muted-foreground">{t("mcp.description")}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" />
            {t("mcp.addServer")}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={refreshBusy}
            aria-busy={refreshBusy}
            title={refreshBusy ? t("common.refreshing") : t("common.refresh")}
          >
            <ButtonBusyContent
              busy={refreshBusy}
              idleIcon={<RotateCw className="h-3.5 w-3.5" />}
            />
          </Button>
        </div>
      </div>

      {/* 统计行 */}
      <div className="grid grid-cols-3 gap-4">
        <BentoCard compact>
          <span className="text-xs text-muted-foreground">{t("mcp.serverCount")}</span>
          <span className="mt-1 text-lg font-semibold">{servers.length}</span>
        </BentoCard>
        <BentoCard compact>
          <span className="text-xs text-muted-foreground">{t("mcp.enabledCount")}</span>
          <span className="mt-1 text-lg font-semibold">{enabledCount}</span>
        </BentoCard>
        <BentoCard compact>
          <span className="text-xs text-muted-foreground">{t("mcp.configFile")}</span>
          <button
            className="mt-1 flex w-full items-center gap-1.5 text-left"
            title={sourcePath}
            onClick={() => {
              navigator.clipboard.writeText(sourcePath);
              toast({
                title: t("mcp.pathCopied"),
                description: t("mcp.pathCopiedDesc"),
                variant: "default",
              });
            }}
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{sourcePath}</span>
            <Copy className="h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
        </BentoCard>
      </div>

      {/* 服务列表 */}
      {servers.length === 0 ? (
        <BentoCard>
          <div className="flex h-48 flex-col items-center justify-center">
            <Server className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">{t("mcp.empty")}</p>
          </div>
        </BentoCard>
      ) : (
        <>
          <BentoCard className="p-0">
            <div className="divide-y divide-border">
              {pagedServers.map((server) => (
                <div key={server.name} className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-accent">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold">{server.name}</span>
                      <DotBadge
                        dotClass={(transportStyles[server.transport] ?? transportStyles.stdio).dot}
                        textClass={(transportStyles[server.transport] ?? transportStyles.stdio).text}
                      >
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
                    <p className="mt-1.5 truncate  text-[13px] text-muted-foreground">
                      {server.command}
                      {server.args.length > 0 && ` ${server.args.join(" ")}`}
                      {server.url && server.url}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <Switch
                      checked={server.enabled}
                      onCheckedChange={(v) => toggleMutation.mutate({ name: server.name, enabled: v })}
                    />
                    <Button variant="outline" size="icon-sm" onClick={() => setEditing(server)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setRemoving(server.name)}
                      className="text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {paginationRange.map((page, i) =>
                  page === "ellipsis" ? (
                    <PaginationItem key={`e${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page as number)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={cn(currentPage >= totalPages && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* 删除确认弹窗 */}
      <AlertDialog open={removing !== null} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mcp.delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("mcp.confirmDelete")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("mcp.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removing && removeMutation.mutate(removing)}
            >
              {t("mcp.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <McpEditorDialog
        key={editing === "new" ? "__new__" : editing?.name ?? "__closed__"}
        open={editing !== null}
        server={editing === "new" ? undefined : editing ?? undefined}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function McpEditorDialog({
  open,
  server,
  onClose,
}: {
  open: boolean;
  server?: McpServerSummary;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [transport, setTransport] = useState<McpTransport>("stdio");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [envText, setEnvText] = useState("");
  const [headersText, setHeadersText] = useState("");

  useEffect(() => {
    if (open) {
      setName(server?.name ?? "");
      setTransport(server?.transport ?? "stdio");
      setCommand(server?.command ?? "");
      setArgs(server?.args.join(", ") ?? "");
      setUrl(server?.url ?? "");
      setEnvText(
        server?.environment ? Object.entries(server.environment).map(([k, v]) => `${k}=${v}`).join("\n") : ""
      );
      setHeadersText(
        server?.headers ? Object.entries(server.headers).map(([k, v]) => `${k}: ${v}`).join("\n") : ""
      );
    }
  }, [open, server]);

  const upsertMutation = useUpsertMcpServerMutation({
    onSaved: onClose,
  });

  const handleSave = () => {
    upsertMutation.mutate(buildMcpServerInput({
      name,
      transport,
      command,
      args,
      url,
      headersText,
      envText,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{server ? t("mcp.edit") : t("mcp.add")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <InputField label={t("mcp.name")} value={name} onChange={setName} disabled={!!server} />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("mcp.transport")}</label>
            <div className="flex gap-2">
              {(["stdio", "http", "sse"] as McpTransport[]).map((tr) => (
                <Button
                  key={tr}
                  variant={transport === tr ? "soft" : "outline"}
                  size="sm"
                  onClick={() => setTransport(tr)}
                >
                  {tr.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          {transport === "stdio" ? (
            <>
              <InputField label={t("mcp.command")} value={command} onChange={setCommand} mono />
              <InputField label={t("mcp.args")} value={args} onChange={setArgs} mono placeholder={t("mcp.argsPlaceholder")} />
            </>
          ) : (
            <>
              <InputField label={t("mcp.url")} value={url} onChange={setUrl} mono />
              <TextareaField label={t("mcp.headers")} value={headersText} onChange={setHeadersText} placeholder={t("mcp.headersPlaceholder")} mono />
            </>
          )}
          <TextareaField label={t("mcp.env")} value={envText} onChange={setEnvText} placeholder={t("mcp.envPlaceholder")} mono />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("mcp.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!name || upsertMutation.isPending}>
            {t("mcp.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildMcpServerInput({
  name,
  transport,
  command,
  args,
  url,
  headersText,
  envText,
}: {
  name: string;
  transport: McpTransport;
  command: string;
  args: string;
  url: string;
  headersText: string;
  envText: string;
}): UpsertMcpServerInput {
  const environment: Record<string, string> = {};
  envText.split("\n").filter(Boolean).forEach((line) => {
    const idx = line.indexOf("=");
    if (idx > 0) environment[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });

  const headers: Record<string, string> = {};
  headersText.split("\n").filter(Boolean).forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > 0) headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });

  return {
    name,
    transport,
    enabled: true,
    command: transport === "stdio" ? command : undefined,
    args: transport === "stdio" ? args.split(",").map((s) => s.trim()).filter(Boolean) : [],
    url: transport !== "stdio" ? url : undefined,
    headers,
    environment,
  };
}

function InputField({
  label,
  value,
  onChange,
  disabled,
  mono,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "focus:ring-2 focus:ring-ring/20 focus:border-primary",
          mono && ""
        )}
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={cn(mono && "")}
      />
    </div>
  );
}
