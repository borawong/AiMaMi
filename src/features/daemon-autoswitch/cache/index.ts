/**
 * 中文职责说明：daemon-autoswitch 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const DaemonAutoswitchCache = createModuleCacheOwner("daemon-autoswitch");
export const DaemonAutoswitchQueryKeys = DaemonAutoswitchCache.queryKeys;
export const writeDaemonAutoswitchAuthoritativePayload = DaemonAutoswitchCache.writeAuthoritativePayload;
export const invalidateDaemonAutoswitchContractQueries = DaemonAutoswitchCache.invalidateContractQueries;
