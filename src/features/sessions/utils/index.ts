import type { SessionGroup, SessionNode } from "../types";

export type SessionEvidenceRecord = Record<string, unknown>;

export const SESSIONS_CONVERSATION_GROUP_KEY = "__conversations__";

export function selectSessionsEnvelopeData(value: unknown) {
  return unwrapEnvelope(value);
}

export function selectSessionRecords(payload: unknown) {
  return readArray(payload, ["items", "sessions", "data.items"]);
}

export function readArray(value: unknown, paths: string[]) {
  if (Array.isArray(value)) return value;

  for (const path of paths) {
    const candidate = readPath(value, path);
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

export function readBoolean(value: unknown, paths: string[], fallback = false) {
  for (const path of paths) {
    const candidate = readPath(value, path);
    if (typeof candidate === "boolean") return candidate;
    if (typeof candidate === "number") return candidate !== 0;
    if (typeof candidate === "string") {
      if (candidate.toLowerCase() === "true") return true;
      if (candidate.toLowerCase() === "false") return false;
    }
  }

  return fallback;
}

export function readNumber(value: unknown, paths: string[], fallback = 0) {
  for (const path of paths) {
    const candidate = readPath(value, path);
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === "string") {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

export function readString(value: unknown, paths: string[], fallback = "") {
  for (const path of paths) {
    const candidate = readPath(value, path);
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }

  return fallback;
}

export function formatSessionTime(value: number) {
  if (!value) return "";
  const date = new Date(value > 10_000_000_000 ? value : value * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function buildSessionGroups(sessions: unknown[]): SessionGroup[] {
  const grouped = new Map<string, unknown[]>();
  for (const session of sessions) {
    const key = readBoolean(session, ["isConversationThread"])
      ? SESSIONS_CONVERSATION_GROUP_KEY
      : readString(session, ["projectPath"], "__ungrouped__") || "__ungrouped__";
    const bucket = grouped.get(key) ?? [];
    bucket.push(session);
    grouped.set(key, bucket);
  }

  return [...grouped.entries()]
    .map(([key, items]) => {
      const nodeMap = new Map<string, SessionNode>();
      for (const session of items) {
        nodeMap.set(sessionId(session), { session, isOrphan: false, children: [] });
      }

      const roots: SessionNode[] = [];
      for (const session of items) {
        const id = sessionId(session);
        const node = nodeMap.get(id);
        if (!node) continue;
        const parentId = readString(session, ["parentSessionId"], "");
        const parent = parentId ? nodeMap.get(parentId) : undefined;
        if (parent) {
          parent.children.push(node);
        } else {
          node.isOrphan = Boolean(parentId);
          roots.push(node);
        }
      }

      sortNodes(roots);
      const first = items[0];
      return {
        key,
        name:
          key === SESSIONS_CONVERSATION_GROUP_KEY
            ? SESSIONS_CONVERSATION_GROUP_KEY
            : readString(first, ["projectName"], ""),
        path: key === SESSIONS_CONVERSATION_GROUP_KEY ? "" : readString(first, ["projectPath"], ""),
        roots,
        sessionCount: items.length,
        projectPathMissing:
          key !== SESSIONS_CONVERSATION_GROUP_KEY &&
          items.some((item) => readBoolean(item, ["projectPathMissing"])),
      };
    })
    .sort((left, right) => latestUpdated(right.roots) - latestUpdated(left.roots));
}

export function flattenNode(node: SessionNode): string[] {
  return [sessionId(node.session), ...node.children.flatMap(flattenNode)];
}

export function flattenGroup(group: SessionGroup): string[] {
  return group.roots.flatMap(flattenNode);
}

export function flattenGroups(groups: SessionGroup[]): string[] {
  return groups.flatMap(flattenGroup);
}

export function countOrphans(groups: SessionGroup[]) {
  let count = 0;
  const visit = (node: SessionNode) => {
    if (node.isOrphan) count += 1;
    node.children.forEach(visit);
  };
  groups.forEach((group) => group.roots.forEach(visit));
  return count;
}

export function sessionId(session: unknown) {
  return readString(session, ["id", "sessionId", "conversationId", "path"], "");
}

export function sessionKindLabel(
  node: SessionNode,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (node.isOrphan) return t("sessions.orphanThread");
  if (readString(node.session, ["parentSessionId"], "")) return t("sessions.childThread");
  const count = node.children.length;
  return `${t("sessions.mainThread")} - ${t("sessions.childThreadsInline", { count })}`;
}

function sortNodes(nodes: SessionNode[]) {
  nodes.sort((left, right) => readNumber(right.session, ["updatedAt"]) - readNumber(left.session, ["updatedAt"]));
  for (const node of nodes) sortNodes(node.children);
}

function latestUpdated(nodes: SessionNode[]) {
  let latest = 0;
  const visit = (items: SessionNode[]) => {
    for (const item of items) {
      latest = Math.max(latest, readNumber(item.session, ["updatedAt"]));
      visit(item.children);
    }
  };
  visit(nodes);
  return latest;
}

function unwrapEnvelope(value: unknown) {
  if (!isRecord(value)) return value;
  if ("data" in value) return value.data;
  if ("payload" in value) return value.payload;
  return value;
}

function readPath(value: unknown, path: string) {
  let current = value;
  for (const segment of path.split(".")) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function isRecord(value: unknown): value is SessionEvidenceRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
