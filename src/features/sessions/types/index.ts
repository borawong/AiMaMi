import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  CoreEnvelope,
  SessionRecordPayload,
  SessionsDeletePayload,
  SessionsListPayload,
} from "@/types";

export type SessionsModuleId = "sessions";
export type SessionsListEnvelope = CoreEnvelope<SessionsListPayload>;
export type SessionsDeleteEnvelope = CoreEnvelope<SessionsDeletePayload>;
export type SessionsMutationPayload = SessionsDeletePayload;
export type SessionsMutationEnvelope = CoreEnvelope<SessionsMutationPayload>;
export type SessionsCachePayload =
  | SessionsListEnvelope
  | SessionsMutationEnvelope
  | null;
export type SessionsCacheEnvelope<TPayload = SessionsCachePayload> =
  ModuleCacheEnvelope<TPayload>;
export type SessionRecord = SessionRecordPayload;

export interface SessionNode {
  session: SessionRecord;
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

export interface SessionsDeleteRequest {
  ids: string[];
  title: string;
  description: string;
  actionLabel: string;
}
