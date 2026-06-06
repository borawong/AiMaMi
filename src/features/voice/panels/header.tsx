import { useTranslation } from "react-i18next";
import type { VoiceHeaderModel } from "../types";

export function VoiceHeader({ header }: { header: VoiceHeaderModel }) {
  const { t } = useTranslation();

  return (
    <section className="border-b border-border pb-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t(header.titleKey)}
      </h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
        {t(header.descriptionKey)}
      </p>
    </section>
  );
}
