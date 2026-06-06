import { invokeIpc, type IpcEvidencePayload } from "@/contracts/ipc";
import type { CoreEnvelope } from "@/types";
import { maintenanceService } from "../maintenance";
import { systemService } from "../system";

export const accountsService = {
  loadSnapshot: (localOnly = true) => systemService.loadSnapshot(localOnly),

  refreshUsageSnapshot: () => systemService.refreshUsageSnapshot(),

  beginAddAccountAttachMonitor: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("begin_add_account_attach_monitor"),

  switchAccount: (accountKey: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("switch_account", { accountKey }),

  switchAccountAndRestartCodex: (accountKey: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("switch_account_and_restart_codex", {
      accountKey,
    }),

  removeAccounts: (accountKeys: string[]) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("remove_accounts", { accountKeys }),

  logout: () => invokeIpc<CoreEnvelope<IpcEvidencePayload>>("logout"),

  importChatGptSessionAccount: (
    sessionJson: string,
    overwriteExisting = false,
  ) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("import_chatgpt_session_account", {
      sessionJson,
      overwriteExisting,
    }),

  exportAccountsToFile: (targetPath: string, accountKeys?: string[] | null) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("export_accounts_to_file", {
      targetPath,
      accountKeys: accountKeys ?? null,
    }),

  previewAccountImport: (filePath: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("preview_account_import", { filePath }),

  importAccountsFromFile: (
    filePath: string,
    overwriteExisting: boolean,
    selectedKeys?: string[] | null,
  ) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("import_accounts_from_file", {
      filePath,
      overwriteExisting,
      selectedKeys: selectedKeys ?? null,
    }),

  openPath: (path: string) => maintenanceService.openPath(path),
};
