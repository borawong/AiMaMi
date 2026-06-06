import { Badge } from "@/components/ui/badge";
import { BentoInnerPanel } from "@/components/ui/inner";
import { Button } from "@/components/ui/button";
import type { CustomInstructionTemplate } from "@/lib/templates";
import { useTranslation } from "react-i18next";

interface TemplateCardProps {
  template: CustomInstructionTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

export function TemplateCard({ template, isSelected, onSelect, onPreview }: TemplateCardProps) {
  const { t } = useTranslation();

  return (
    <BentoInnerPanel
      className={isSelected ? "border-primary/40 bg-primary/[0.05]" : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div>
            <div className="text-sm font-semibold">{template.title}</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{template.summary}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[11px]">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {typeof template.applyCount === "number" && (
              <span className="flex items-center rounded-full border border-border px-2.5 py-0.5">
                {t("customInstructions.appliedCount", { count: template.applyCount })}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <Button variant={isSelected ? "default" : "outline"} size="sm" onClick={onSelect}>
            {isSelected ? t("customInstructions.loadedToEditor") : t("customInstructions.loadToEditor")}
          </Button>
          <Button variant="outline" size="sm" onClick={onPreview}>
            {t("customInstructions.previewAction")}
          </Button>
        </div>
      </div>
    </BentoInnerPanel>
  );
}
