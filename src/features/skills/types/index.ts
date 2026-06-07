import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  CoreEnvelope,
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
