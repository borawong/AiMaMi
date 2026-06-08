import { useTranslation } from "react-i18next";

export function CustomInstructionsPageHeaderPanel() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="max-w-md text-sm text-muted-foreground">
        {t("customInstructions.description")}
      </p>
    </div>
  );
}
