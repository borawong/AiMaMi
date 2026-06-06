import { SessionsDeleteConfirmDialog } from "../dialogs";
import { useSessionsModule, useSessionsPageController } from "../hooks";
import { SessionsMainPanel } from "../panels";

export function SessionsPage() {
  const module = useSessionsModule();
  const controller = useSessionsPageController(module);

  return (
    <>
      <SessionsMainPanel controller={controller} />
      <SessionsDeleteConfirmDialog
        request={controller.deleteRequest}
        pending={controller.deletePending}
        onCancel={controller.cancelDeleteRequest}
        onConfirm={() => void controller.confirmDeleteRequest()}
      />
    </>
  );
}
