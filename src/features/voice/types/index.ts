import type { ModuleCacheEnvelope } from "@/features/_shared/cache";

export type VoiceModuleId = "voice";
export type VoiceCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;

export type VoiceMetricIcon = "templates" | "vocabulary" | "history";

export interface VoiceHeaderModel {
  titleKey: string;
  descriptionKey: string;
}

export interface VoiceCountMetricModel {
  id: string;
  labelKey: string;
  kind: "count";
  icon: VoiceMetricIcon;
  value: number;
}

export interface VoiceRuntimeMetricModel {
  id: string;
  labelKey: string;
  kind: "runtime";
  supported: boolean;
  enabled: boolean;
  captureState: string;
}

export type VoiceMetricModel = VoiceCountMetricModel | VoiceRuntimeMetricModel;
