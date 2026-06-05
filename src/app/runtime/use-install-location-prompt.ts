/**
 * 中文职责说明：安装位置提示 hook 只拥有启动期安装可写性检查和打开应用目录动作。
 */
import { useEffect, useState } from "react";
import { maintenanceService } from "@/services/maintenance";
import { settingsService } from "@/services/settings";

export function useInstallLocationPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void settingsService
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
    await maintenanceService.openPath("/Applications");
    setOpen(false);
  };

  return {
    open,
    dismiss,
    openApplications,
  };
}
