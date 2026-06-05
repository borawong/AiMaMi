/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: services/accounts
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { invokeIpc } from "@/contracts/ipc";
import type { CoreEnvelope } from "@/types";

export const accountsService = {
  beginAddAccountAttachMonitor: () =>
    invokeIpc<CoreEnvelope<unknown>>("begin_add_account_attach_monitor"),

  switchAccount: (accountKey: string) =>
    invokeIpc<CoreEnvelope<unknown>>("switch_account", { accountKey }),

  switchAccountAndRestartCodex: (accountKey: string) =>
    invokeIpc<CoreEnvelope<unknown>>("switch_account_and_restart_codex", {
      accountKey,
    }),

  removeAccounts: (accountKeys: string[]) =>
    invokeIpc<CoreEnvelope<unknown>>("remove_accounts", { accountKeys }),

  logout: () => invokeIpc<CoreEnvelope<unknown>>("logout"),

  importChatGptSessionAccount: (
    sessionJson: string,
    overwriteExisting = false,
  ) =>
    invokeIpc<CoreEnvelope<unknown>>("import_chatgpt_session_account", {
      sessionJson,
      overwriteExisting,
    }),

  exportAccountsToFile: (targetPath: string, accountKeys?: string[] | null) =>
    invokeIpc<CoreEnvelope<unknown>>("export_accounts_to_file", {
      targetPath,
      accountKeys: accountKeys ?? null,
    }),

  previewAccountImport: (filePath: string) =>
    invokeIpc<CoreEnvelope<unknown>>("preview_account_import", { filePath }),

  importAccountsFromFile: (
    filePath: string,
    overwriteExisting: boolean,
    selectedKeys?: string[] | null,
  ) =>
    invokeIpc<CoreEnvelope<unknown>>("import_accounts_from_file", {
      filePath,
      overwriteExisting,
      selectedKeys: selectedKeys ?? null,
    }),
};
