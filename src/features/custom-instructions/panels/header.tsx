/**
 * 中文职责说明：页面顶部面板只渲染说明和 tab 入口，tab owner 由页面 controller 提供。
 */
import { useTranslation } from "react-i18next";

import { SegmentedOptions } from "@/components/ui/options";
import type { CustomInstructionsTab } from "../types";

interface CustomInstructionsPageHeaderPanelProps {
  tab: CustomInstructionsTab;
  onTabChange: (tab: CustomInstructionsTab) => void;
}

export function CustomInstructionsPageHeaderPanel({
  tab,
  onTabChange,
}: CustomInstructionsPageHeaderPanelProps) {
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
