import type { OverviewDialogController } from "../types";

export function OverviewDialogsHost({
  dialogs,
}: {
  dialogs?: OverviewDialogController;
}) {
  if (!dialogs) return null;
  return <ImportRemoteSecretDialog dialog={dialogs.importRemoteSecret} />;
}

function ImportRemoteSecretDialog({
  dialog,
}: {
  dialog: OverviewDialogController["importRemoteSecret"];
}) {
  const onSubmit = () => dialog.onSubmit();
  void onSubmit;
  return null;
}
