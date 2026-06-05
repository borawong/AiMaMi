/**
 * 中文职责说明：accounts 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const AccountsCache = createModuleCacheOwner("accounts");
export const AccountsQueryKeys = AccountsCache.queryKeys;
export const writeAccountsAuthoritativePayload = AccountsCache.writeAuthoritativePayload;
export const invalidateAccountsContractQueries = AccountsCache.invalidateContractQueries;
