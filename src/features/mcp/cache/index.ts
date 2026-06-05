/**
 * 中文职责说明：mcp 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const McpCache = createModuleCacheOwner("mcp");
export const McpQueryKeys = McpCache.queryKeys;
export const writeMcpAuthoritativePayload = McpCache.writeAuthoritativePayload;
export const invalidateMcpContractQueries = McpCache.invalidateContractQueries;
