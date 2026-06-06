/**
 * 中文职责说明：编辑面板只展示 draft 并发出预览、重置和文本变更意图。
 */
import { PencilLine, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

interface CustomInstructionsEditorPanelProps {
  draftContent: string;
  protectedMode: boolean;
  previewPending: boolean;
  selectedTemplateTitle: string | null;
  onDraftContentChange: (content: string) => void;
  onPreviewDraft: () => void;
  onResetEditor: () => void;
}

export function CustomInstructionsEditorPanel({
  draftContent,
  protectedMode,
  previewPending,
  selectedTemplateTitle,
  onDraftContentChange,
  onPreviewDraft,
  onResetEditor,
}: CustomInstructionsEditorPanelProps) {
  const { t } = useTranslation();

  return (
    <BentoCard>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <PencilLine className="h-4 w-4 text-primary" />
            {t("customInstructions.editorTitle")}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("customInstructions.editorDescription")}
          </p>
        </div>
        {selectedTemplateTitle ? (
          <Badge variant="outline">{selectedTemplateTitle}</Badge>
        ) : null}
      </div>

      <div className="space-y-4">
        <Textarea
          value={draftContent}
          onChange={(event) => onDraftContentChange(event.target.value)}
          className="min-h-[220px] font-mono text-xs"
          placeholder={t("customInstructions.editorPlaceholder")}
          disabled={protectedMode}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onPreviewDraft}
            disabled={protectedMode || !draftContent.trim() || previewPending}
          >
            {previewPending ? (
              <Spinner className="h-4 w-4" data-icon="inline-start" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {t("customInstructions.previewAndApply")}
          </Button>
          <Button variant="outline" onClick={onResetEditor}>
            {t("customInstructions.resetEditor")}
          </Button>
        </div>
      </div>
    </BentoCard>
  );
}
