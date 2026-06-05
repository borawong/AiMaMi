/**
 * 中文职责说明：accounts route shell 只负责路由装配和模块 Provider 接入。
 */
import { AccountsFeature } from "@/features/accounts";

export function AccountsRoute() {
  return <AccountsFeature />;
}
