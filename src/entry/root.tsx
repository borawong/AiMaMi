/**
 * 中文职责说明：应用根只装配全局 Provider、错误边界、runtime 初始化器和路由。
 */
import { useTranslation } from "react-i18next";
import { AppProviders } from "@/app/providers/app";
import { RuntimeInitializer } from "@/app/runtime/initializer";
import { AppRouter } from "@/app/router/router";
import { ErrorBoundary } from "@/components/boundary";

export function Root() {
  return (
    <AppProviders>
      <ErrorBoundary fallback={<RootErrorFallback />}>
        <RuntimeInitializer />
        <AppRouter />
      </ErrorBoundary>
    </AppProviders>
  );
}

function RootErrorFallback() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">{t("common.error")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("common.rootErrorDescription")}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("common.retry")}
        </button>
      </div>
    </div>
  );
}
