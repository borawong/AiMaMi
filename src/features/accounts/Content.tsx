import { AccountsPage } from "./components/page";
import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { DUMPED_ACCOUNTS_COMMANDS } from "./contract";

export function AccountsContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="accounts" commands={DUMPED_ACCOUNTS_COMMANDS} />
      <AccountsPage />
    </>
  );
}
