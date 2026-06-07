import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type { CustomInstructionTemplate } from "@/lib/templates";
import type {
  CustomInstructionHistoryEntry,
  CustomInstructionPreviewPayload,
  CustomInstructionStatePayload,
} from "@/types";

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

export interface CustomInstructionsHeaderPanelController {
  tab: CustomInstructionsTab;
  onTabChange: (tab: CustomInstructionsTab) => void;
}

export interface CustomInstructionsLoadErrorPanelController {
  visible: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

export interface CustomInstructionsConfigurePanelController {
  current: CustomInstructionStatePayload["current"] | null;
  draftContent: string;
  history: CustomInstructionHistoryEntry[];
  protectedMode: boolean;
  selectedTemplateTitle: string | null;
  previewPending: boolean;
  clearPending: boolean;
  rollbackingId: string | null;
  onDraftContentChange: (content: string) => void;
  onOpenGlobalPath: () => void;
  onRestoreCurrent: () => void;
  onRequestClear: () => void;
  onPreviewDraft: () => void;
  onResetEditor: () => void;
  onRollback: (historyId: string) => void;
}

export interface CustomInstructionsTemplatesPanelController {
  templates: CustomInstructionTemplateView[];
  selectedTemplateCode: string | null;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onSelectTemplate: (template: CustomInstructionTemplate) => void;
  onPreviewTemplate: (template: CustomInstructionTemplate) => void;
}

export interface CustomInstructionsBodyPanelController {
  tab: CustomInstructionsTab;
  configure: CustomInstructionsConfigurePanelController;
  templates: CustomInstructionsTemplatesPanelController;
}

export interface CustomInstructionsPreviewDialogController {
  open: boolean;
  preview: CustomInstructionPreviewPayload | null;
  applying: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
}

export interface CustomInstructionsClearDialogController {
  open: boolean;
  clearing: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export interface CustomInstructionsPageController {
  headerPanel: CustomInstructionsHeaderPanelController;
  loadErrorPanel: CustomInstructionsLoadErrorPanelController;
  bodyPanel: CustomInstructionsBodyPanelController;
  previewDialog: CustomInstructionsPreviewDialogController;
  clearDialog: CustomInstructionsClearDialogController;
}
