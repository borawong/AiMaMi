/**
 * 中文职责说明：sessions 模块只声明边界类型，未证实业务字段不在这里编造。
 */
import type { ModuleCacheEnvelope } from "@/features/_shared/module-cache";

export type SessionsModuleId = "sessions";
export type SessionsCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;

export interface SessionNode {
  session: unknown;
  isOrphan: boolean;
  children: SessionNode[];
}

export interface SessionGroup {
  key: string;
  name: string;
  path: string;
  roots: SessionNode[];
  sessionCount: number;
  projectPathMissing: boolean;
}

export interface SessionMetricItem {
  key: string;
  labelKey: string;
  value: string | number;
}

export interface SessionsPageController {
  groups: SessionGroup[];
  metrics: SessionMetricItem[];
  loading: boolean;
  orphanCount: number;
  selected: Set<string>;
  selectedCount: number;
  expandedProjects: Set<string>;
  expandedThreads: Set<string>;
  focusedId: string | null;
  deleteRequest: SessionsDeleteRequest | null;
  deletePending: boolean;
  refreshPending: boolean;
  refresh: () => Promise<void>;
  toggleProject: (key: string) => void;
  toggleThread: (id: string) => void;
  toggleIds: (ids: string[]) => void;
  focusSession: (id: string) => void;
  requestSelectedDelete: () => void;
  cancelDeleteRequest: () => void;
  confirmDeleteRequest: () => Promise<void>;
}

/**
 * 中文职责说明：delete request 只保存确认弹窗的本地化展示载荷和目标 id。
 */
export interface SessionsDeleteRequest {
  ids: string[];
  title: string;
  description: string;
  actionLabel: string;
}
