import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type { CustomInstructionTemplate } from "@/lib/templates";

export type CustomInstructionsModuleId = "custom-instructions";
export type CustomInstructionsCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;
export type CustomInstructionsTab = "configure" | "templates";
export type CustomInstructionTemplateView = CustomInstructionTemplate & {
  applyCount?: number;
};
