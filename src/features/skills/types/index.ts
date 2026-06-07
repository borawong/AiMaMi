import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  CoreEnvelope,
  InstalledSkillSummary,
  SkillBackupSummary,
  SkillBackupListPayload,
  SkillDeleteBackupPayload,
  SkillImportPayload,
  SkillListPayload,
  SkillRemovePayload,
  SkillRestorePayload,
} from "@/types";

export type SkillsModuleId = "skills";
export type SkillsInstalledEnvelope = CoreEnvelope<SkillListPayload>;
export type SkillsBackupsEnvelope = CoreEnvelope<SkillBackupListPayload>;
export type SkillsImportEnvelope = CoreEnvelope<SkillImportPayload>;
export type SkillsRemoveEnvelope = CoreEnvelope<SkillRemovePayload>;
export type SkillsRestoreEnvelope = CoreEnvelope<SkillRestorePayload>;
export type SkillsDeleteBackupEnvelope = CoreEnvelope<SkillDeleteBackupPayload>;
export type SkillsQueryEnvelope = SkillsInstalledEnvelope | SkillsBackupsEnvelope;
export type SkillsMutationPayload =
  | SkillImportPayload
  | SkillRemovePayload
  | SkillRestorePayload
  | SkillDeleteBackupPayload;
export type SkillsMutationEnvelope =
  | SkillsImportEnvelope
  | SkillsRemoveEnvelope
  | SkillsRestoreEnvelope
  | SkillsDeleteBackupEnvelope;
export type SkillsCachePayload = SkillsQueryEnvelope | SkillsMutationEnvelope;
export type SkillsCacheEnvelope<
  TPayload extends SkillsCachePayload = SkillsCachePayload,
> = ModuleCacheEnvelope<TPayload>;

export type SkillsPageTab = "installed" | "backups";
export type SkillsPageTabLabelKey = "skills.installed" | "skills.backups";
export type SkillsQueryFailureTextKey =
  | "skills.loadFailed"
  | "skills.loadFailedDesc";

export interface SkillsPageTabItem {
  readonly value: SkillsPageTab;
  readonly labelKey: SkillsPageTabLabelKey;
}

export interface SkillsSummaryController {
  skillsCount: number;
  backupsCount: number;
  skillsRootPath: string;
  backupsRootPath: string;
}

export interface SkillsImportActionController {
  isPending: boolean;
  run: () => void;
}

export interface SkillsInstalledPanelController {
  skills: InstalledSkillSummary[];
  requestRemove: (id: string) => void;
  isRemovePending: boolean;
}

export interface SkillsBackupsPanelController {
  backups: SkillBackupSummary[];
  requestDeleteBackup: (id: string) => void;
  restoreBackup: (id: string) => void;
  isRestorePending: boolean;
  isDeletePending: boolean;
}

export interface SkillsQueryFailureAlertController {
  titleKey: Extract<SkillsQueryFailureTextKey, "skills.loadFailed">;
  descriptionKey: Extract<SkillsQueryFailureTextKey, "skills.loadFailedDesc">;
  isRetrying: boolean;
  retry: () => Promise<unknown>;
}

export interface SkillsDialogController {
  open: boolean;
  isPending: boolean;
  close: () => void;
  confirm: () => void;
}

export interface SkillsPageController {
  tab: SkillsPageTab;
  tabs: readonly SkillsPageTabItem[];
  selectTab: (value: string) => void;
  skillsSummary: SkillsSummaryController;
  importAction: SkillsImportActionController;
  installedPanel: SkillsInstalledPanelController;
  backupsPanel: SkillsBackupsPanelController;
  queryFailureAlert: SkillsQueryFailureAlertController | null;
  removeDialog: SkillsDialogController;
  deleteBackupDialog: SkillsDialogController;
}

export interface SkillsPagePanelProps {
  controller: SkillsPageController;
}

export interface SkillsMetricsPanelProps {
  controller: SkillsPageController;
  onCopyPath: (path: string) => void;
}

export interface SkillsPathMetricProps {
  labelKey: "skills.rootPath" | "skills.backupRootPath";
  path: string;
  onCopyPath: (path: string) => void;
}

export interface SkillsQueryFailureAlertProps {
  alert: SkillsQueryFailureAlertController;
}

export interface InstalledSkillsPanelProps {
  panel: SkillsInstalledPanelController;
}

export interface SkillBackupsPanelProps {
  panel: SkillsBackupsPanelController;
}

export interface SkillsConfirmDialogsProps {
  controller: SkillsPageController;
}

export interface SkillsConfirmDialogProps {
  controller: SkillsDialogController;
}
