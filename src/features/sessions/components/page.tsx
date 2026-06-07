import { SessionsDeleteConfirmDialog } from "../dialogs";
import { useSessionsPageController } from "../hooks";
import { SessionsMainPanel } from "../panels";

export function SessionsPage() {
  const controller = useSessionsPageController();

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
