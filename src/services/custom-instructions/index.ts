import { invokeIpc } from "@/contracts/ipc";
import { systemService } from "@/services/system";
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

async function readEnvelopeData<T>(promise: Promise<CoreEnvelope<T>>): Promise<T> {
  return (await promise).data;
}

export const customInstructionsService = {
  loadState: () =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<CustomInstructionStatePayload>>(
        "load_custom_instruction_state",
      ),
    ),

  previewApply: (content: string) =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<CustomInstructionPreviewPayload>>(
        "preview_custom_instruction_apply",
        { content },
      ),
    ),

  apply: (params: ApplyCustomInstructionParams) =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<CustomInstructionStatePayload>>(
        "apply_custom_instruction",
        {
          content: params.content,
          templateCode: params.templateCode,
          templateTitle: params.templateTitle,
          source: params.source,
        },
      ),
    ),

  clearBlock: () =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<CustomInstructionStatePayload>>(
        "clear_custom_instruction_block",
      ),
    ),

  rollback: (historyId: string) =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<CustomInstructionStatePayload>>(
        "rollback_custom_instruction",
        { historyId },
      ),
    ),

  openPath: systemService.openPath,
};
