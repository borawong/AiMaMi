import {
  IPC_COMMAND_DEFINITIONS,
  type IpcArgs,
  type IpcCommandName,
} from "@/contracts/ipc";
import type { CoreEnvelope } from "@/types";
import type { IpcMockStepResult } from "@/mocks/ipc";
import {
  createEvidenceBackedIpcFixture,
  type EvidenceBackedIpcFixture,
} from "./index";

export interface IpcCommandFixture {
  argKeys: readonly string[];
  command: IpcCommandName;
  domain: (typeof IPC_COMMAND_DEFINITIONS)[number]["domain"];
  handler: IpcCommandHandler;
  source: (typeof IPC_COMMAND_DEFINITIONS)[number]["source"];
  tier: (typeof IPC_COMMAND_DEFINITIONS)[number]["tier"];
  wrapperNames: readonly string[];
}

export type IpcCommandMockData =
  | EvidenceBackedIpcFixture
  | boolean
  | string
  | Record<string, unknown>;

export type IpcCommandHandler = (context: {
  args?: IpcArgs;
  command: IpcCommandName;
  steps: IpcMockStepResult[];
}) => CoreEnvelope<IpcCommandMockData>;

export function createDefaultIpcCommandHandler(): IpcCommandHandler {
  return ({ args, command, steps }) =>
    createEvidenceBackedIpcFixture(command, args, steps);
}

const defaultHandler = createDefaultIpcCommandHandler();

function withMockData<T extends IpcCommandMockData>(
  context: Parameters<IpcCommandHandler>[0],
  data: T,
): CoreEnvelope<T> {
  const envelope = createEvidenceBackedIpcFixture(
    context.command,
    context.args,
    context.steps,
  );
  return { ...envelope, data };
}

const readFalseHandler: IpcCommandHandler = (context) => withMockData(context, false);

const readManualIntervalHandler: IpcCommandHandler = (context) =>
  withMockData(context, "manual");

const writeBooleanArgHandler: IpcCommandHandler = (context) =>
  withMockData(context, context.args?.enabled === true);

const writeIntervalArgHandler: IpcCommandHandler = (context) => {
  const interval = context.args?.interval;
  return withMockData(context, typeof interval === "string" ? interval : "manual");
};

const evidenceObjectHandler: IpcCommandHandler = (context) => {
  const envelope = createEvidenceBackedIpcFixture(
    context.command,
    context.args,
    context.steps,
  );
  return {
    ...envelope,
    data: {
      backendStatus: envelope.data.status,
    },
  };
};

function readArgString(args: IpcArgs | undefined, key: string, fallback: string) {
  const value = args?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function skillSummaryFromId(id: string) {
  return {
    id,
    name: id,
    title: null,
    summary: null,
    relativePath: id,
    directoryPath: "",
    skillFilePath: "",
    updatedAt: null,
  };
}

function skillBackupFromId(id: string) {
  return {
    id,
    skillID: id,
    name: id,
    title: null,
    relativePath: id,
    backupPath: "",
    createdAt: 0,
  };
}

const loadInstalledSkillsHandler: IpcCommandHandler = (context) => {
  const envelope = createEvidenceBackedIpcFixture(
    context.command,
    context.args,
    context.steps,
  );
  return {
    ...envelope,
    data: {
      status: envelope.data.status,
      items: [],
      total: 0,
      rootPath: "",
      lastScanAt: 0,
    },
  };
};

const loadSkillBackupsHandler: IpcCommandHandler = (context) => {
  const envelope = createEvidenceBackedIpcFixture(
    context.command,
    context.args,
    context.steps,
  );
  return {
    ...envelope,
    data: {
      status: envelope.data.status,
      items: [],
      total: 0,
      rootPath: "",
      lastScanAt: 0,
    },
  };
};

const importSkillHandler: IpcCommandHandler = (context) => {
  const envelope = createEvidenceBackedIpcFixture(
    context.command,
    context.args,
    context.steps,
  );
  const id = readArgString(context.args, "path", "mock-skill");
  return {
    ...envelope,
    data: {
      status: envelope.data.status,
      skill: skillSummaryFromId(id),
      replacedExisting: false,
      backup: null,
    },
  };
};

const removeSkillHandler: IpcCommandHandler = (context) => {
  const envelope = createEvidenceBackedIpcFixture(
    context.command,
    context.args,
    context.steps,
  );
  const id = readArgString(context.args, "id", "mock-skill");
  return {
    ...envelope,
    data: {
      status: envelope.data.status,
      removedSkillID: id,
      backup: skillBackupFromId(id),
      remainingInstalledCount: 0,
    },
  };
};

const restoreSkillBackupHandler: IpcCommandHandler = (context) => {
  const envelope = createEvidenceBackedIpcFixture(
    context.command,
    context.args,
    context.steps,
  );
  const id = readArgString(context.args, "id", "mock-skill");
  return {
    ...envelope,
    data: {
      status: envelope.data.status,
      restoredSkill: skillSummaryFromId(id),
      backup: skillBackupFromId(id),
      rollbackBackup: null,
    },
  };
};

const deleteSkillBackupHandler: IpcCommandHandler = (context) => {
  const envelope = createEvidenceBackedIpcFixture(
    context.command,
    context.args,
    context.steps,
  );
  const id = readArgString(context.args, "id", "mock-skill");
  return {
    ...envelope,
    data: {
      status: envelope.data.status,
      deletedBackupID: id,
      remainingBackupCount: 0,
    },
  };
};

const systemInfoHandler: IpcCommandHandler = (context) => {
  const envelope = createEvidenceBackedIpcFixture(
    context.command,
    context.args,
    context.steps,
  );
  return {
    ...envelope,
    data: {
      backendStatus: envelope.data.status,
      os: "unknown",
      osVersion: "unknown",
      arch: "unknown",
      hostname: "",
    },
  };
};

const systemCommandHandlers: Partial<Record<IpcCommandName, IpcCommandHandler>> = {
  focus_main_window: evidenceObjectHandler,
  get_hotspot_enabled: readFalseHandler,
  get_image_compat: readFalseHandler,
  get_system_info: systemInfoHandler,
  get_usage_refresh_interval: readManualIntervalHandler,
  has_notch: readFalseHandler,
  hotspot_ready: evidenceObjectHandler,
  set_hotspot_enabled: writeBooleanArgHandler,
  set_image_compat: writeBooleanArgHandler,
  set_usage_refresh_interval: writeIntervalArgHandler,
};

const skillsCommandHandlers: Partial<Record<IpcCommandName, IpcCommandHandler>> = {
  delete_skill_backup: deleteSkillBackupHandler,
  import_skill: importSkillHandler,
  load_installed_skills: loadInstalledSkillsHandler,
  load_skill_backups: loadSkillBackupsHandler,
  remove_skill: removeSkillHandler,
  restore_skill_backup: restoreSkillBackupHandler,
};

export const ipcCommandFixtures = IPC_COMMAND_DEFINITIONS.reduce(
  (fixtures, definition) => {
    fixtures[definition.command] = {
      argKeys: definition.argKeys,
      command: definition.command,
      domain: definition.domain,
      handler:
        skillsCommandHandlers[definition.command] ??
        systemCommandHandlers[definition.command] ??
        defaultHandler,
      source: definition.source,
      tier: definition.tier,
      wrapperNames: definition.wrapperNames,
    };
    return fixtures;
  },
  {} as Record<IpcCommandName, IpcCommandFixture>,
);

export function getIpcCommandFixture(command: IpcCommandName) {
  return ipcCommandFixtures[command];
}

export function assertIpcFixtureCoverage() {
  const missing = IPC_COMMAND_DEFINITIONS.filter(
    (definition) => !ipcCommandFixtures[definition.command],
  ).map((definition) => definition.command);

  return {
    covered: IPC_COMMAND_DEFINITIONS.length - missing.length,
    missing,
    total: IPC_COMMAND_DEFINITIONS.length,
  };
}
