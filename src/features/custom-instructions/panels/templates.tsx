import { RotateCw, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BentoCard } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/busy";
import { TemplateCard } from "../components/template";
import type { CustomInstructionsTemplatesPanelController } from "../types";

export function CustomInstructionsTemplatesPanel({
  templates,
  selectedTemplateCode,
  refreshing,
  onRefresh,
  onSelectTemplate,
  onPreviewTemplate,
}: CustomInstructionsTemplatesPanelController) {
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
