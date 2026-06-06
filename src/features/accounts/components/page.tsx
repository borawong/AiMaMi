import { AccountActionDialogs, AddSessionAccountDialog } from "../dialogs";
import { useAccountsPageController } from "../hooks";
import { AccountsPagePanel } from "../panels";

export function AccountsPage() {
  const controller = useAccountsPageController();

  return (
    <AccountActionDialogs module={controller.module}>
      {(actionControls) => (
        <AccountsPagePanel
          controller={controller}
          actionControls={actionControls}
          addSessionDialog={<AddSessionAccountDialog module={controller.module} />}
        />
      )}
    </AccountActionDialogs>
  );
}
