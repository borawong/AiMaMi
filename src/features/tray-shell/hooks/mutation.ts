import { useMutation, useQueryClient } from "@tanstack/react-query";
import { systemService } from "@/services/system";
import { invalidateTrayShellContractQueries } from "../cache";
import type { TrayShellActionModel } from "../types";

export function useTrayShellFocusMainWindowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => systemService.focusMainWindow(),
    onSuccess: () => {
      void invalidateTrayShellContractQueries(queryClient);
    },
  });
}

export function useTrayShellFocusMainWindowAction(): TrayShellActionModel {
  const focusMutation = useTrayShellFocusMainWindowMutation();

  return {
    id: "focus-main-window",
    labelKey: "trayShell.focusMainWindow",
    displayKey: "tray.openMain",
    run: () => focusMutation.mutateAsync(),
    isPending: focusMutation.isPending,
  };
}
