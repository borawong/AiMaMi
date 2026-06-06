import { invokeIpc } from "@/contracts/ipc";
import type {
  CoreEnvelope,
  CustomInstructionPreviewPayload,
  CustomInstructionStatePayload,
} from "@/types";

export interface ApplyCustomInstructionParams {
  content: string;
  templateCode?: string;
  templateTitle?: string;
  source: string;
}

export const customInstructionsService = {
  loadState: () =>
    invokeIpc<CoreEnvelope<CustomInstructionStatePayload>>(
      "load_custom_instruction_state",
    ),

  previewApply: (content: string) =>
    invokeIpc<CoreEnvelope<CustomInstructionPreviewPayload>>(
      "preview_custom_instruction_apply",
      { content },
    ),

  apply: (params: ApplyCustomInstructionParams) =>
    invokeIpc<CoreEnvelope<CustomInstructionStatePayload>>(
      "apply_custom_instruction",
      {
        content: params.content,
        templateCode: params.templateCode,
        templateTitle: params.templateTitle,
        source: params.source,
      },
    ),

  clearBlock: () =>
    invokeIpc<CoreEnvelope<CustomInstructionStatePayload>>(
      "clear_custom_instruction_block",
    ),

  rollback: (historyId: string) =>
    invokeIpc<CoreEnvelope<CustomInstructionStatePayload>>(
      "rollback_custom_instruction",
      { historyId },
    ),

  openPath: async (path: string) => {
    await invokeIpc<CoreEnvelope<unknown>>("open_path", { path });
  },
};
