/**
 * 中文职责说明：accounts 模块只声明边界类型，未证实业务字段不在这里编造。
 */
import type { ModuleCacheEnvelope } from "@/features/_shared/module-cache";

export type AccountsModuleId = "accounts";
export type AccountsCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;

export interface AccountKeysInput {
  accountKeys: string[];
}

export interface AccountSwitchInput {
  accountKey: string;
}

export interface AccountImportSessionInput {
  sessionJson: string;
  overwriteExisting: boolean;
}

export interface AccountExportFileInput {
  targetPath: string;
  accountKeys?: string[] | null;
}

export interface AccountPreviewImportInput {
  filePath: string;
}

export interface AccountImportFileInput {
  filePath: string;
  overwriteExisting: boolean;
  selectedKeys?: string[] | null;
}

export interface AccountOpenPathInput {
  path: string;
}
