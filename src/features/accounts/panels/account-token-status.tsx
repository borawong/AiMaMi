/**
 * 中文职责说明：账号 token 状态展示只读取 accounts 快照字段，不 owning mutation 或刷新流程。
 */
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AccountRecord } from "../types";
import { readNumber, readPath, readString, tokenStatusCode } from "../utils";
import { formatEpoch } from "./account-display";

export function AccountTokenStatusBadge({
  account,
  selected,
}: {
  account: AccountRecord;
  selected: boolean;
}) {
  const { t } = useTranslation();
  const code = tokenStatusCode(account);
  if (!code || code === "fresh" || code === "refreshed") return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 shrink-0 px-1.5 py-0 text-[10px] font-medium leading-none",
        selected
          ? "border-white/35 bg-white/10 text-white"
          : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      )}
    >
      {t(`accounts.tokenStatus.${code}`)}
    </Badge>
  );
}

export function AccountTokenStatusPanel({
  account,
}: {
  account: AccountRecord;
}) {
  const { t } = useTranslation();
  const status = readPath(account, "tokenStatus");
  const code = tokenStatusCode(account);
  if (!code || code === "fresh" || code === "refreshed") return null;
  const message = readString(status, ["message"], "");
  const expiresAt = readNumber(status, ["accessTokenExpiresAt"]);
  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-[8px] border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1 leading-snug">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <span>{t(`accounts.tokenStatus.${code}`)}</span>
          {expiresAt > 0 ? (
            <span className="text-[11px] font-normal text-muted-foreground">
              {formatEpoch(expiresAt)}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {t(`accounts.tokenStatus.${code}Desc`)}
        </p>
        {message ? (
          <p className="mt-1 break-all text-[10.5px] text-muted-foreground/75">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
