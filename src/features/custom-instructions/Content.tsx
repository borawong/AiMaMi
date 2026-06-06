import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { CustomInstructionsPage } from "./components/page";
import { DUMPED_CUSTOM_INSTRUCTIONS_COMMANDS } from "./contract";

export function CustomInstructionsContent() {
  return (
    <>
      <DumpedContractBoundary
        moduleId="custom-instructions"
        commands={DUMPED_CUSTOM_INSTRUCTIONS_COMMANDS}
      />
      <CustomInstructionsPage />
    </>
  );
}
