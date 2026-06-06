import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useInstallLocationPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void api
      .checkUpdateInstallability()
      .then((payload) => {
        if (cancelled) {
          return;
        }
        if (payload.code === "app_translocation" || payload.code === "read_only_location") {
          setOpen(true);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => setOpen(false);

  const openApplications = async () => {
    await api.openPath("/Applications");
    setOpen(false);
  };

  return {
    open,
    dismiss,
    openApplications,
  };
}
