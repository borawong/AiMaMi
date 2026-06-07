import { customInstructionsService } from "@/services/custom-instructions";

export function useCustomInstructionPathActions() {
  return {
    openPath: (path: string) => customInstructionsService.openPath(path),
  };
}
