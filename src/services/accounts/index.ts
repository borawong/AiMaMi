import { invokeIpc } from "@/contracts/ipc";
import type {
  AccountExportPayload,
  AccountImportPayload,
  AccountImportPreviewPayload,
  AccountMonitorPayload,
  AccountSessionImportPayload,
  CoreEnvelope,
  LogoutPayload,
  RemovePayload,
  SwitchPayload,
} from "@/types";
import { maintenanceService } from "../maintenance";
import { systemService } from "../system";

export const accountsService = {
  loadSnapshot: (localOnly = true) => systemService.loadSnapshot(localOnly),

  refreshUsageSnapshot: () => systemService.refreshUsageSnapshot(),

  beginAddAccountAttachMonitor: () =>
    invokeIpc<CoreEnvelope<AccountMonitorPayload>>("begin_add_account_attach_monitor"),

  switchAccount: (accountKey: string) =>
    invokeIpc<CoreEnvelope<SwitchPayload>>("switch_account", { accountKey }),

  switchAccountAndRestartCodex: (accountKey: string) =>
    invokeIpc<CoreEnvelope<SwitchPayload>>("switch_account_and_restart_codex", {
      accountKey,
    }),

  removeAccounts: (accountKeys: string[]) =>
    invokeIpc<CoreEnvelope<RemovePayload>>("remove_accounts", { accountKeys }),

  logout: () => invokeIpc<CoreEnvelope<LogoutPayload>>("logout"),

  importChatGptSessionAccount: (
    sessionJson: string,
    overwriteExisting = false,
  ) =>
    invokeIpc<CoreEnvelope<AccountSessionImportPayload>>("import_chatgpt_session_account", {
      sessionJson,
      overwriteExisting,
    }),

  exportAccountsToFile: (targetPath: string, accountKeys?: string[] | null) =>
    invokeIpc<CoreEnvelope<AccountExportPayload>>("export_accounts_to_file", {
      targetPath,
      accountKeys: accountKeys ?? null,
    }),

  previewAccountImport: (filePath: string) =>
    invokeIpc<CoreEnvelope<AccountImportPreviewPayload>>("preview_account_import", {
      filePath,
    }),

  importAccountsFromFile: (
    filePath: string,
    overwriteExisting: boolean,
    selectedKeys?: string[] | null,
  ) =>
    invokeIpc<CoreEnvelope<AccountImportPayload>>("import_accounts_from_file", {
      filePath,
      overwriteExisting,
      selectedKeys: selectedKeys ?? null,
    }),

  openPath: (path: string) => maintenanceService.openPath(path),
};
