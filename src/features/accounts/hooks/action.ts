import { useState } from "react";
import { accountsService } from "@/services/accounts";
import type { AccountOpenPathInput, AccountsPathActions } from "../types";

export function useAccountsPathActions(): AccountsPathActions {
  const [openPathPending, setOpenPathPending] = useState(false);

  const openPath = async ({ path }: AccountOpenPathInput) => {
    setOpenPathPending(true);
    try {
      await accountsService.openPath(path);
    } finally {
      setOpenPathPending(false);
    }
  };

  return {
    openPath: {
      run: openPath,
      isPending: openPathPending,
    },
  };
}
