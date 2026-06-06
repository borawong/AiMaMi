import {
  getIpcCommandDefinition,
  type IpcArgs,
  type IpcCommandDomain,
  type IpcCommandName,
  type IpcJsonObject,
} from "@/contracts/ipc";
import type { BackendSkeletonStatus, CoreEnvelope } from "@/types";
import type { IpcMockStepResult } from "@/mocks/ipc";

export const fixturePolicy = {
  allowSyntheticBusinessData: false,
  source: "IPC contract shape only",
} as const;

export interface EvidenceBackedIpcFixture extends IpcJsonObject {
  args: IpcJsonObject;
  argKeys: string[];
  command: IpcCommandName;
  domain: IpcCommandDomain;
  fixture: {
    allowSyntheticBusinessData: false;
    source: string;
  };
  scenario: {
    delayMs: number;
    outcome: string;
    sequence: number;
    stepName: string;
  }[];
  source: string;
  status: BackendSkeletonStatus;
  tier: string;
  wrapperNames: string[];
}

function redactIpcArgs(args: IpcArgs | undefined): IpcJsonObject {
  if (!args) return {};

  return Object.fromEntries(
    Object.entries(args).map(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      const shouldRedact =
        normalizedKey.includes("secret") ||
        normalizedKey.includes("token") ||
        normalizedKey.includes("key") ||
        normalizedKey.includes("password") ||
        normalizedKey.includes("sensitive");

      return [key, shouldRedact ? "<redacted>" : value ?? null];
    }),
  ) as IpcJsonObject;
}

function resolveEnvelopeStatus(steps: IpcMockStepResult[]) {
  const terminalStep = steps.length > 0 ? steps[steps.length - 1] : undefined;

  if (!terminalStep) {
    return { code: "MOCK_OK", message: "IPC mock resolved", success: true };
  }

  if (terminalStep.outcome === "reject") {
    return { code: "MOCK_REJECT", message: "IPC mock rejected", success: false };
  }

  if (terminalStep.outcome === "abort") {
    return { code: "MOCK_ABORT", message: "IPC mock aborted", success: false };
  }

  if (terminalStep.outcome === "cancel") {
    return { code: "MOCK_CANCEL", message: "IPC mock cancelled", success: false };
  }

  return { code: "MOCK_OK", message: "IPC mock resolved", success: true };
}

function createBackendSkeletonStatus(
  command: IpcCommandName,
  domain: IpcCommandDomain,
): BackendSkeletonStatus {
  return {
    module: domain,
    command,
    restored: false,
    note: "后端业务实现由后续 PR 在当前边界内补齐",
    boundary: {
      repositoryChecked: false,
      repositoryPathKnown: false,
      platformChecked: false,
      coreChecked: true,
      effect: "pending",
    },
  };
}

export function createEvidenceBackedIpcFixture(
  command: IpcCommandName,
  args: IpcArgs | undefined,
  steps: IpcMockStepResult[],
): CoreEnvelope<EvidenceBackedIpcFixture> {
  const definition = getIpcCommandDefinition(command);
  const status = resolveEnvelopeStatus(steps);

  return {
    schemaVersion: 1,
    success: status.success,
    code: status.code,
    message: status.message,
    warnings: [],
    data: {
      args: redactIpcArgs(args),
      argKeys: [...(definition?.argKeys ?? [])],
      command,
      domain: definition?.domain ?? "system",
      fixture: fixturePolicy,
      scenario: steps.map((step) => ({
        delayMs: step.delayMs,
        outcome: step.outcome,
        sequence: step.sequence,
        stepName: step.stepName,
      })),
      source: definition?.source ?? "unknown",
      status: createBackendSkeletonStatus(
        command,
        definition?.domain ?? "system",
      ),
      tier: definition?.tier ?? "unknown",
      wrapperNames: [...(definition?.wrapperNames ?? [])],
    },
  };
}
