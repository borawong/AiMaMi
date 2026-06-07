import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert";
import type { AccountRecord, AccountsModuleController } from "../types";
import { accountEmail, accountKey } from "../utils";

interface AccountActionDialogControls {
  requestSwitch: (account: AccountRecord) => void;
  requestRemove: (account: AccountRecord) => void;
}

export function AccountActionDialogs({
  module,
  children,
}: {
  module: AccountsModuleController;
  children: (controls: AccountActionDialogControls) => ReactNode;
}) {
  const { t } = useTranslation();
  const [switchTarget, setSwitchTarget] = useState<AccountRecord | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AccountRecord | null>(null);

  return (
    <>
      {children({
        requestSwitch: setSwitchTarget,
        requestRemove: setRemoveTarget,
      })}
      <ConfirmAccountAction
        open={switchTarget !== null}
        title={t("accounts.switchConfirmTitle")}
        description={t("accounts.switchConfirmDesc", {
          email: switchTarget ? accountEmail(switchTarget) : "",
        })}
        actionLabel={t("accounts.switchAndRestart")}
        pending={module.switchAccountAndRestart.isPending}
        onOpenChange={(open) => !open && setSwitchTarget(null)}
        onConfirm={() => {
          if (!switchTarget) return;
          void module.switchAccountAndRestart
            .run({ accountKey: accountKey(switchTarget) })
            .finally(() => setSwitchTarget(null));
        }}
      />
      <ConfirmAccountAction
        open={removeTarget !== null}
        title={t("accounts.removeConfirmTitle")}
        description={t("accounts.confirmRemove", {
          email: removeTarget ? accountEmail(removeTarget) : "",
        })}
        actionLabel={t("common.confirm")}
        destructive
        pending={module.removeAccounts.isPending}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        onConfirm={() => {
          if (!removeTarget) return;
          void module.removeAccounts
            .run({ accountKeys: [accountKey(removeTarget)] })
            .finally(() => setRemoveTarget(null));
        }}
      />
    </>
  );
}

function ConfirmAccountAction({
  open,
  title,
  description,
  actionLabel,
  destructive,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  actionLabel: string;
  destructive?: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? t("common.loading") : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
