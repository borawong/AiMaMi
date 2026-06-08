import { useTranslation } from "react-i18next";

export function DaemonAutoswitchHeader() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-foreground">
          {t("nav.daemonAutoswitch")}
        </h2>
      </div>
    </section>
  );
}
