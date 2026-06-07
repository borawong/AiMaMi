import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type { CustomInstructionTemplate } from "@/lib/templates";
import type { CustomInstructionStatePayload } from "@/types";

export type CustomInstructionsModuleId = "custom-instructions";
export type CustomInstructionsStateQueryKey = readonly [
  "custom-instructions",
  "current",
];
export type CustomInstructionsTemplatesQueryKey = readonly [
  "custom-instructions",
  "templates",
];
export type CustomInstructionsStateCachePayload = {
  queryKey: CustomInstructionsStateQueryKey;
  value: CustomInstructionStatePayload;
};
export type CustomInstructionsCachePayload = CustomInstructionsStateCachePayload;
export type CustomInstructionsCacheEnvelope<
  TPayload extends CustomInstructionsCachePayload = CustomInstructionsCachePayload,
> = ModuleCacheEnvelope<TPayload>;
export type CustomInstructionsTab = "configure" | "templates";
export type CustomInstructionTemplateView = CustomInstructionTemplate & {
  applyCount?: number;
};
