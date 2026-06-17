import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Server, Terminal, Trash2, Wifi, RefreshCw, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import type { SshServerConfig, SshServerSummary, SshSyncStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format-time";

const SSH_SERVERS_QUERY_KEY = ["ssh-servers"] as const;

const emptyConfig: SshServerConfig = {
  alias: "",
  host: "",
  user: "",
  port: null,
  keyPath: "",
  remoteCodexHome: "~/.codex",
  enabled: true,
};

export function SshServersSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<SshServerSummary | "new" | null>(null);

  const serversQuery = useQuery({
    queryKey: SSH_SERVERS_QUERY_KEY,
    queryFn: () => api.loadSshServers(),
  });
  const servers = serversQuery.data?.data.items ?? [];

  const syncAllMutation = useMutation({
    mutationFn: () => api.syncAllSshServers(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: SSH_SERVERS_QUERY_KEY });
      const failed = result.data.results.filter((item) => item.status === "failed").length;
      toast({
        title: failed > 0 ? t("settings.sshSyncPartial") : t("settings.sshSyncComplete"),
        description: t("settings.sshSyncSummary", { count: result.data.results.length, failed }),
        variant: failed > 0 ? "destructive" : "success",
      });
    },
    onError: (error) => toast({ title: t("settings.sshSyncFailed"), description: String(error), variant: "destructive" }),
  });

  return (
    <div className="space-y-3 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium">{t("settings.sshServers")}</span>
            <Badge variant="secondary" className="text-[11px] font-normal">
              {t("settings.sshServerCount", { count: servers.length })}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.sshServersDesc")}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => syncAllMutation.mutate()} disabled={syncAllMutation.isPending || servers.length === 0}>
            {syncAllMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {t("settings.sshSyncAll")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" />
            {t("settings.sshAdd")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/70">
        {serversQuery.isLoading ? (
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("common.loading")}
          </div>
        ) : servers.length === 0 ? (
          <div className="px-4 py-5 text-xs text-muted-foreground">{t("settings.sshEmpty")}</div>
        ) : (
          <div className="divide-y divide-border/70">
            {servers.map((server) => (
              <SshServerRow key={server.id} server={server} onEdit={() => setEditing(server)} />
            ))}
          </div>
        )}
      </div>

      <SshServerDialog open={!!editing} server={editing === "new" ? null : editing} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  );
}

function SshServerRow({ server, onEdit }: { server: SshServerSummary; onEdit: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const status = formatStatus(t, server.lastSyncStatus, server.lastError);
  const subtitle = useMemo(() => {
    const target = server.user ? `${server.user}@${server.host}` : server.host;
    const port = server.port ? `:${server.port}` : "";
    return `${target}${port} → ${server.remoteCodexHome}`;
  }, [server.host, server.port, server.remoteCodexHome, server.user]);

  const updateMutation = useMutation({
    mutationFn: (enabled: boolean) => api.upsertSshServer(server.id, toConfig({ ...server, enabled })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SSH_SERVERS_QUERY_KEY }),
  });

  const testMutation = useMutation({
    mutationFn: () => api.testSshServer({ id: server.id }),
    onSuccess: (result) => {
      toast({
        title: result.data.reachable ? t("settings.sshTestSuccess") : t("settings.sshTestFailed"),
        description: result.data.message,
        variant: result.data.reachable ? "success" : "destructive",
      });
    },
    onError: (error) => toast({ title: t("settings.sshTestFailed"), description: String(error), variant: "destructive" }),
  });

  const syncMutation = useMutation({
    mutationFn: () => api.syncSshServer(server.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: SSH_SERVERS_QUERY_KEY });
      const first = result.data.results[0];
      toast({
        title: first?.status === "success" ? t("settings.sshSyncComplete") : t("settings.sshSyncFailed"),
        description: first?.message ?? "",
        variant: first?.status === "success" ? "success" : "destructive",
      });
    },
    onError: (error) => toast({ title: t("settings.sshSyncFailed"), description: String(error), variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: () => api.removeSshServer(server.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SSH_SERVERS_QUERY_KEY }),
    onError: (error) => toast({ title: t("settings.sshRemoveFailed"), description: String(error), variant: "destructive" }),
  });

  const openMutation = useMutation({
    mutationFn: () => api.openSshServer(server.id),
    onError: (error) => toast({ title: t("settings.sshOpenFailed"), description: String(error), variant: "destructive" }),
  });

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold">{server.alias}</span>
            <Badge variant="secondary" className={cn("text-[10px] font-normal", status.className)}>{status.label}</Badge>
            {!server.enabled && <Badge variant="outline" className="text-[10px] font-normal">{t("settings.sshDisabled")}</Badge>}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
          {server.lastSyncedAt && <p className="mt-0.5 text-[11px] text-muted-foreground">{t("settings.sshLastSynced", { time: formatRelative(server.lastSyncedAt) })}</p>}
          {server.lastError && <p className="mt-0.5 line-clamp-1 text-[11px] text-destructive">{server.lastError}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Switch checked={server.enabled} onCheckedChange={(v) => updateMutation.mutate(v)} disabled={updateMutation.isPending} />
        <IconButton label={t("settings.sshTest")} busy={testMutation.isPending} onClick={() => testMutation.mutate()} icon={<Wifi className="h-3.5 w-3.5" />} />
        <IconButton label={t("settings.sshSyncNow")} busy={syncMutation.isPending} onClick={() => syncMutation.mutate()} icon={<RefreshCw className="h-3.5 w-3.5" />} />
        <IconButton label={t("settings.sshOpen")} busy={openMutation.isPending} onClick={() => openMutation.mutate()} icon={<Terminal className="h-3.5 w-3.5" />} />
        <Button variant="outline" size="icon-sm" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="outline" size="icon-sm" onClick={() => removeMutation.mutate()} disabled={removeMutation.isPending} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

function IconButton({ label, busy, onClick, icon }: { label: string; busy: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={busy} title={label} className="px-2">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function SshServerDialog({ open, server, onOpenChange }: { open: boolean; server: SshServerSummary | null; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SshServerConfig>(emptyConfig);

  useEffect(() => {
    if (!open) return;
    setDraft(server ? toConfig(server) : emptyConfig);
  }, [open, server]);

  const saveMutation = useMutation({
    mutationFn: () => api.upsertSshServer(server?.id, normalizeDraft(draft)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SSH_SERVERS_QUERY_KEY });
      onOpenChange(false);
    },
    onError: (error) => toast({ title: t("settings.sshSaveFailed"), description: String(error), variant: "destructive" }),
  });

  const testMutation = useMutation({
    mutationFn: () => api.testSshServer({ config: normalizeDraft(draft) }),
    onSuccess: (result) => toast({
      title: result.data.reachable ? t("settings.sshTestSuccess") : t("settings.sshTestFailed"),
      description: result.data.message,
      variant: result.data.reachable ? "success" : "destructive",
    }),
    onError: (error) => toast({ title: t("settings.sshTestFailed"), description: String(error), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{server ? t("settings.sshEditTitle") : t("settings.sshAddTitle")}</DialogTitle>
          <DialogDescription>{t("settings.sshDialogDesc")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Field label={t("settings.sshAlias")} value={draft.alias} onChange={(alias) => setDraft((d) => ({ ...d, alias }))} placeholder="Production" />
          <Field label={t("settings.sshHost")} value={draft.host} onChange={(host) => setDraft((d) => ({ ...d, host }))} placeholder="my-server or example.com" />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("settings.sshUser")} value={draft.user ?? ""} onChange={(user) => setDraft((d) => ({ ...d, user }))} placeholder="ubuntu" />
            <Field label={t("settings.sshPort")} value={draft.port?.toString() ?? ""} onChange={(port) => setDraft((d) => ({ ...d, port: port ? Number(port) : null }))} placeholder="22" type="number" />
          </div>
          <Field label={t("settings.sshKeyPath")} value={draft.keyPath ?? ""} onChange={(keyPath) => setDraft((d) => ({ ...d, keyPath }))} placeholder="~/.ssh/id_ed25519" />
          <Field label={t("settings.sshRemoteHome")} value={draft.remoteCodexHome} onChange={(remoteCodexHome) => setDraft((d) => ({ ...d, remoteCodexHome }))} placeholder="~/.codex" />
          <div className="flex items-center justify-between rounded-xl border px-3 py-2">
            <span className="text-sm">{t("settings.sshEnabled")}</span>
            <Switch checked={draft.enabled} onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending || !draft.host.trim()}>
            {testMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("settings.sshTest")}
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !draft.alias.trim() || !draft.host.trim()}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} className="h-9" />
    </label>
  );
}

function normalizeDraft(config: SshServerConfig): SshServerConfig {
  return {
    alias: config.alias.trim(),
    host: config.host.trim(),
    user: config.user?.trim() || null,
    port: config.port || null,
    keyPath: config.keyPath?.trim() || null,
    remoteCodexHome: config.remoteCodexHome.trim() || "~/.codex",
    enabled: config.enabled,
  };
}

function toConfig(server: SshServerSummary): SshServerConfig {
  return {
    alias: server.alias,
    host: server.host,
    user: server.user ?? "",
    port: server.port ?? null,
    keyPath: server.keyPath ?? "",
    remoteCodexHome: server.remoteCodexHome || "~/.codex",
    enabled: server.enabled,
  };
}

function formatStatus(t: (key: string) => string, status?: SshSyncStatus | null, error?: string | null) {
  if (status === "success") return { label: t("settings.sshStatusSuccess"), className: "text-emerald-600" };
  if (status === "failed" || error) return { label: t("settings.sshStatusFailed"), className: "text-destructive" };
  if (status === "skipped") return { label: t("settings.sshStatusSkipped"), className: "text-muted-foreground" };
  return { label: t("settings.sshStatusUnknown"), className: "text-muted-foreground" };
}
