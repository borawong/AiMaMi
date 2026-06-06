/**
 * 中文职责说明：全局 pending 切换提示只负责把模块查询结果转换成可展示的提示状态。
 */
import { useMemo } from "react";
import { useDaemonAutoswitchPendingPrompt } from "@/features/daemon-autoswitch/hooks";

interface PendingAutoSwitchView {
  currentText: string;
  candidateText: string;
  raw: unknown;
}

interface PendingAutoSwitchAccount {
  email: string;
  primaryWindow?: PendingAutoSwitchWindow | null;
  secondaryWindow?: PendingAutoSwitchWindow | null;
}

interface PendingAutoSwitchWindow {
  remainingPercent?: number | null;
}

interface PendingAutoSwitchRequest {
  currentAccount: PendingAutoSwitchAccount;
  candidateAccount: PendingAutoSwitchAccount;
}

export function usePendingAutoSwitchPrompt() {
  const prompt = useDaemonAutoswitchPendingPrompt();
  const pendingView = useMemo(
    () => buildPendingAutoSwitchView(unwrapEnvelopeData(prompt.pendingQuery.data)),
    [prompt.pendingQuery.data],
  );

  return {
    open: Boolean(pendingView),
    currentText: pendingView?.currentText ?? "",
    candidateText: pendingView?.candidateText ?? "",
    raw: pendingView?.raw ?? null,
    isPending:
      prompt.dismissPendingAction.isPending ||
      prompt.confirmPendingAndRestartAction.isPending,
    dismiss: prompt.dismissPendingAction.run,
    confirmAndRestart: prompt.confirmPendingAndRestartAction.run,
  };
}

function buildPendingAutoSwitchView(value: unknown): PendingAutoSwitchView | null {
  const pending = parsePendingAutoSwitchRequest(value);
  if (!pending) {
    return null;
  }

  return {
    currentText: pending.currentAccount.email,
    candidateText: pending.candidateAccount.email,
    raw: pending,
  };
}

function unwrapEnvelopeData(value: unknown): unknown {
  if (!isRecord(value)) return value ?? null;
  return "data" in value ? value.data ?? null : value;
}

function parsePendingAutoSwitchRequest(
  value: unknown,
): PendingAutoSwitchRequest | null {
  if (!isRecord(value)) return null;
  const currentAccount = parsePendingAccount(value.currentAccount);
  const candidateAccount = parsePendingAccount(value.candidateAccount);
  if (!currentAccount || !candidateAccount) return null;
  return {
    currentAccount,
    candidateAccount,
  };
}

function parsePendingAccount(value: unknown): PendingAutoSwitchAccount | null {
  if (!isRecord(value) || typeof value.email !== "string") return null;
  const email = value.email.trim();
  if (!email) return null;
  return {
    email,
    primaryWindow: parsePendingWindow(value.primaryWindow),
    secondaryWindow: parsePendingWindow(value.secondaryWindow),
  };
}

function parsePendingWindow(value: unknown): PendingAutoSwitchWindow | null {
  if (!isRecord(value)) return null;
  return typeof value.remainingPercent === "number"
    ? { remainingPercent: value.remainingPercent }
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
