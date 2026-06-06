import { SessionsPage } from "./components/sessions-page";
import { DumpedContractBoundary } from "@/features/_shared/dumped-contract-boundary";
import { DUMPED_SESSIONS_COMMANDS } from "./dumped-contract";

export function SessionsContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="sessions" commands={DUMPED_SESSIONS_COMMANDS} />
      <SessionsPage />
    </>
  );
}
