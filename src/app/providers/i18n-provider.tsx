/**
 * 中文职责说明：加载本地化资源并透传子节点，不拥有任何页面状态。
 */
import type { ReactNode } from "react";
import "@/lib/i18n";

export function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
