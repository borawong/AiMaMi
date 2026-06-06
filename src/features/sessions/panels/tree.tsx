import {
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  MessageSquareText,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SessionGroup, SessionNode } from "../types";
import {
  SESSIONS_CONVERSATION_GROUP_KEY,
  flattenGroup,
  flattenNode,
  formatBytes,
  formatSessionTime,
  readNumber,
  readString,
  sessionId,
  sessionKindLabel,
} from "../utils";

export function SessionsTreePanel({
  groups,
  expandedProjects,
  expandedThreads,
  selected,
  focusedId,
  onToggleProject,
  onToggleThread,
  onToggleIds,
  onFocusSession,
}: {
  groups: SessionGroup[];
  expandedProjects: Set<string>;
  expandedThreads: Set<string>;
  selected: Set<string>;
  focusedId: string | null;
  onToggleProject: (key: string) => void;
  onToggleThread: (id: string) => void;
  onToggleIds: (ids: string[]) => void;
  onFocusSession: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="shrink-0 border-b border-border/60 px-4 py-4">
        <div className="text-sm font-semibold text-foreground">{t("sessions.treeTitle")}</div>
        <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">
          {t("sessions.treeDescription")}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-card px-4 py-4">
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <SessionGroupBlock
              key={group.key}
              group={group}
              expandedProjects={expandedProjects}
              expandedThreads={expandedThreads}
              selected={selected}
              focusedId={focusedId}
              onToggleProject={onToggleProject}
              onToggleThread={onToggleThread}
              onToggleIds={onToggleIds}
              onFocusSession={onFocusSession}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionGroupBlock({
  group,
  expandedProjects,
  expandedThreads,
  selected,
  focusedId,
  onToggleProject,
  onToggleThread,
  onToggleIds,
  onFocusSession,
}: {
  group: SessionGroup;
  expandedProjects: Set<string>;
  expandedThreads: Set<string>;
  selected: Set<string>;
  focusedId: string | null;
  onToggleProject: (key: string) => void;
  onToggleThread: (id: string) => void;
  onToggleIds: (ids: string[]) => void;
  onFocusSession: (id: string) => void;
}) {
  const { t } = useTranslation();
  const ids = flattenGroup(group);
  const checked = ids.length > 0 && ids.every((id) => selected.has(id));
  const expanded = expandedProjects.has(group.key);

  return (
    <div className="shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div
        className={cn(
          "flex cursor-pointer items-center gap-3 px-3.5 py-3.5 transition-colors",
          expanded ? "bg-muted/60" : "hover:bg-muted/40",
        )}
        onClick={() => onToggleProject(group.key)}
      >
        <SessionCheck checked={checked} onToggle={() => onToggleIds(ids)} />
        {expanded ? <ChevronDown className="h-[18px] w-[18px] text-muted-foreground" /> : <ChevronRight className="h-[18px] w-[18px] text-muted-foreground" />}
        {group.key === SESSIONS_CONVERSATION_GROUP_KEY ? (
          <MessageSquareText className="h-[18px] w-[18px] text-primary" strokeWidth={2.4} />
        ) : (
          <Folder className="h-[18px] w-[18px] text-primary" strokeWidth={2.4} />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-foreground">
            {group.key === SESSIONS_CONVERSATION_GROUP_KEY
              ? t("sessions.conversationGroup")
              : group.name || t("sessions.unknownProject")}
          </div>
          {group.key !== SESSIONS_CONVERSATION_GROUP_KEY ? (
            <div className="truncate text-[13px] text-muted-foreground">{group.path}</div>
          ) : null}
        </div>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium tabular-nums text-muted-foreground">
          {group.sessionCount}
        </div>
      </div>
      {expanded ? (
        <div className="border-t border-border/60 bg-background/40">
          {group.roots.map((node) => (
            <RootSessionNode
              key={sessionId(node.session)}
              node={node}
              expandedThreads={expandedThreads}
              selected={selected}
              focusedId={focusedId}
              onToggleThread={onToggleThread}
              onToggleIds={onToggleIds}
              onFocusSession={onFocusSession}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RootSessionNode({
  node,
  expandedThreads,
  selected,
  focusedId,
  onToggleThread,
  onToggleIds,
  onFocusSession,
}: {
  node: SessionNode;
  expandedThreads: Set<string>;
  selected: Set<string>;
  focusedId: string | null;
  onToggleThread: (id: string) => void;
  onToggleIds: (ids: string[]) => void;
  onFocusSession: (id: string) => void;
}) {
  const id = sessionId(node.session);
  const ids = flattenNode(node);
  const hasChildren = node.children.length > 0;
  const expanded = expandedThreads.has(id);
  const checked = ids.length > 0 && ids.every((item) => selected.has(item));
  const focused = focusedId === id;

  const activate = () => {
    if (hasChildren) {
      onToggleIds(ids);
      if (!expanded) onToggleThread(id);
    } else {
      onToggleIds([id]);
    }
    onFocusSession(id);
  };

  return (
    <div className="border-t border-border/60 py-3 first:border-t-0">
      <div className="group relative w-full transition-colors hover:bg-muted/40">
        {focused ? <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[3px] bg-primary" /> : null}
        <div className="relative z-0 flex w-full cursor-pointer items-center gap-3 px-4 py-3" onClick={activate}>
          <SessionCheck checked={checked} onToggle={() => onToggleIds(ids)} />
          {hasChildren ? (
            expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <div className="w-4 shrink-0" />
          )}
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" />
          <SessionNodeText node={node} focused={focused} root />
        </div>
      </div>
      {hasChildren && expanded ? (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <ChildSessionNode
              key={sessionId(child.session)}
              node={child}
              level={1}
              expandedThreads={expandedThreads}
              selected={selected}
              focusedId={focusedId}
              onToggleThread={onToggleThread}
              onToggleIds={onToggleIds}
              onFocusSession={onFocusSession}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChildSessionNode({
  node,
  level,
  expandedThreads,
  selected,
  focusedId,
  onToggleThread,
  onToggleIds,
  onFocusSession,
}: {
  node: SessionNode;
  level: number;
  expandedThreads: Set<string>;
  selected: Set<string>;
  focusedId: string | null;
  onToggleThread: (id: string) => void;
  onToggleIds: (ids: string[]) => void;
  onFocusSession: (id: string) => void;
}) {
  const id = sessionId(node.session);
  const ids = flattenNode(node);
  const hasChildren = node.children.length > 0;
  const expanded = expandedThreads.has(id);
  const checked = hasChildren
    ? ids.every((item) => selected.has(item))
    : selected.has(id);
  const activate = () => {
    if (hasChildren) {
      onToggleIds(ids);
      if (!expanded) onToggleThread(id);
    } else {
      onToggleIds([id]);
    }
    onFocusSession(id);
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full transition-colors hover:bg-muted/40">
        {focusedId === id ? <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[3px] bg-primary" /> : null}
        <div className="flex w-full cursor-pointer items-center gap-3 px-4 py-3" onClick={activate}>
          <SessionCheck
            checked={checked}
            onToggle={() => onToggleIds(hasChildren ? ids : [id])}
          />
          {hasChildren ? (
            expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <div className="w-4 shrink-0" />
          )}
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary/60 ring-4 ring-primary/10" />
          <SessionNodeText node={node} focused={focusedId === id} />
        </div>
      </div>
      {hasChildren && expanded ? (
        <div className="space-y-3 border-l border-border/60 pl-4" style={{ marginLeft: `${Math.max(8, level * 12)}px` }}>
          {node.children.map((child) => (
            <ChildSessionNode
              key={sessionId(child.session)}
              node={child}
              level={level + 1}
              expandedThreads={expandedThreads}
              selected={selected}
              focusedId={focusedId}
              onToggleThread={onToggleThread}
              onToggleIds={onToggleIds}
              onFocusSession={onFocusSession}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SessionNodeText({
  node,
  focused,
  root,
}: {
  node: SessionNode;
  focused: boolean;
  root?: boolean;
}) {
  const { t } = useTranslation();
  const size = formatBytes(readNumber(node.session, ["fileSize"]));

  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "block min-w-0 flex-1 truncate text-left font-semibold transition-colors",
            root ? "text-[14px]" : "text-[14px] font-medium",
            focused ? "text-foreground" : "text-foreground/90",
          )}
        >
          {readString(node.session, ["threadName", "title", "name", "id"], t("sessions.untitled"))}
        </span>
      </div>
      <div className="mt-1 flex min-w-0 flex-nowrap items-center gap-2 text-[12px] text-muted-foreground">
        <div className="min-w-0 flex-1 truncate">
          {sessionKindLabel(node, t)} - {formatSessionTime(readNumber(node.session, ["updatedAt"]))}
          {size ? ` - ${size}` : ""}
        </div>
        {node.isOrphan ? (
          <Badge variant="outline" className="shrink-0 rounded-full px-2 py-0 text-[10px] font-medium text-amber-600 dark:text-amber-300">
            {t("sessions.orphanThread")}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function SessionCheck({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all",
        checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-transparent hover:border-primary",
      )}
      aria-pressed={checked}
    >
      <Check className={cn("h-3 w-3", checked ? "opacity-100" : "opacity-0")} strokeWidth={3} />
    </button>
  );
}
