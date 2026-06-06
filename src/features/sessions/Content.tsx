import { SessionsPage } from "./components/page";
import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { DUMPED_SESSIONS_COMMANDS } from "./contract";

export function SessionsContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="sessions" commands={DUMPED_SESSIONS_COMMANDS} />
      <SessionsPage />
    </>
  );
}
