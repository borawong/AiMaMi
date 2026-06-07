import { useTranslation } from "react-i18next";

import { SegmentedOptions } from "@/components/ui/options";
import type {
  CustomInstructionsHeaderPanelController,
  CustomInstructionsTab,
} from "../types";

export function CustomInstructionsPageHeaderPanel({
  tab,
  onTabChange,
}: CustomInstructionsHeaderPanelController) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="max-w-md text-sm text-muted-foreground">
        {t("customInstructions.description")}
      </p>
      <SegmentedOptions
        items={[
          { value: "configure", label: t("customInstructions.configureTab") },
          { value: "templates", label: t("customInstructions.templatesTab") },
        ]}
        value={tab}
        onChange={(value) => onTabChange(value as CustomInstructionsTab)}
      />
    </div>
  );
}
