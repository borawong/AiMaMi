import { invokeIpc } from "@/contracts/ipc";
import type {
  CoreEnvelope,
  SkillBackupListPayload,
  SkillDeleteBackupPayload,
  SkillImportPayload,
  SkillListPayload,
  SkillRemovePayload,
  SkillRestorePayload,
} from "@/types";

export const skillsService = {
  loadInstalled: () =>
    invokeIpc<CoreEnvelope<SkillListPayload>>("load_installed_skills"),

  loadBackups: () =>
    invokeIpc<CoreEnvelope<SkillBackupListPayload>>("load_skill_backups"),

  importSkill: (path: string) =>
    invokeIpc<CoreEnvelope<SkillImportPayload>>("import_skill", { path }),

  pickSkillDirectory: async () => {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const path = await open({ directory: true });
    return typeof path === "string" ? path : null;
  },

  removeSkill: (id: string) =>
    invokeIpc<CoreEnvelope<SkillRemovePayload>>("remove_skill", { id }),

  restoreBackup: (id: string) =>
    invokeIpc<CoreEnvelope<SkillRestorePayload>>("restore_skill_backup", {
      id,
    }),

  deleteBackup: (id: string) =>
    invokeIpc<CoreEnvelope<SkillDeleteBackupPayload>>("delete_skill_backup", {
      id,
    }),
};
