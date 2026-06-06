import { AccountsPage } from "./components/accounts-page";
import { DumpedContractBoundary } from "@/features/_shared/dumped-contract-boundary";
import { DUMPED_ACCOUNTS_COMMANDS } from "./dumped-contract";

export function AccountsContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="accounts" commands={DUMPED_ACCOUNTS_COMMANDS} />
      <AccountsPage />
    </>
  );
}
