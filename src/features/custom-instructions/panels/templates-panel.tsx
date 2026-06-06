/**
 * 中文职责说明：模板面板只渲染模板列表和用户意图，不直接触碰 service 或 cache。
 */
import { RotateCw, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/button-busy-content";
import type { CustomInstructionTemplate } from "@/lib/custom-instruction-templates";
import { TemplateCard } from "../components/template-card";
import type { CustomInstructionTemplateView } from "../types";

interface CustomInstructionsTemplatesPanelProps {
  templates: CustomInstructionTemplateView[];
  selectedTemplateCode: string | null;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onSelectTemplate: (template: CustomInstructionTemplate) => void;
  onPreviewTemplate: (template: CustomInstructionTemplate) => void;
}

export function CustomInstructionsTemplatesPanel({
  templates,
  selectedTemplateCode,
  refreshing,
  onRefresh,
  onSelectTemplate,
  onPreviewTemplate,
}: CustomInstructionsTemplatesPanelProps) {
  const { t } = useTranslation();

  return (
    <BentoCard className="min-h-[520px]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wand2 className="h-4 w-4 text-primary" />
            {t("customInstructions.templatesTitle")}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("customInstructions.templatesDescription")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void onRefresh()}
          disabled={refreshing}
        >
          <ButtonBusyContent
            busy={refreshing}
            idleIcon={<RotateCw className="h-4 w-4" />}
            idleLabel={t("common.refresh")}
            busyLabel={t("common.refreshing")}
            spinnerClassName="h-4 w-4"
          />
        </Button>
      </div>

      <div className="space-y-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.code}
            template={template}
            isSelected={selectedTemplateCode === template.code}
            onSelect={() => onSelectTemplate(template)}
            onPreview={() => onPreviewTemplate(template)}
          />
        ))}
      </div>
    </BentoCard>
  );
}
