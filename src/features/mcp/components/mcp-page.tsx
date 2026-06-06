/**
 * 中文职责说明：mcp page 是 route/module shell，只装配 controller、panels 和 dialogs。
 */
import { McpEditorDialog, McpRemoveDialog } from "../dialogs";
import { useMcpPageController } from "../hooks";
import { McpOverviewPanel, McpServersPanel } from "../panels";

export function McpPage() {
  const controller = useMcpPageController();

  return (
    <div className="space-y-6">
      <McpOverviewPanel
        overview={controller.overview}
        requestState={controller.requestState}
      />

      <McpServersPanel
        list={controller.list}
        pagination={controller.pagination}
      />

      <McpRemoveDialog
        remover={controller.remover}
      />

      <McpEditorDialog
        editor={controller.editor}
      />
    </div>
  );
}
