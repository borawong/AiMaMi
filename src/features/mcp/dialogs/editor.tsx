import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { McpEditorController } from "../types";
import { MCP_TRANSPORTS } from "../utils";

interface McpEditorDialogProps {
  editor: McpEditorController;
}

export function McpEditorDialog({
  editor,
}: McpEditorDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={editor.open} onOpenChange={(value) => !value && editor.onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editor.server ? t("mcp.edit") : t("mcp.add")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <InputField
            label={t("mcp.name")}
            value={editor.draft.name}
            onChange={(value) => editor.onFieldChange("name", value)}
            disabled={!!editor.server}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("mcp.transport")}</label>
            <div className="flex gap-2">
              {MCP_TRANSPORTS.map((transport) => (
                <Button
                  key={transport}
                  variant={editor.draft.transport === transport ? "soft" : "outline"}
                  size="sm"
                  onClick={() => editor.onFieldChange("transport", transport)}
                >
                  {transport.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          {editor.draft.transport === "stdio" ? (
            <>
              <InputField
                label={t("mcp.command")}
                value={editor.draft.command}
                onChange={(value) => editor.onFieldChange("command", value)}
                mono
              />
              <InputField
                label={t("mcp.args")}
                value={editor.draft.args}
                onChange={(value) => editor.onFieldChange("args", value)}
                mono
              />
            </>
          ) : (
            <>
              <InputField
                label={t("mcp.url")}
                value={editor.draft.url}
                onChange={(value) => editor.onFieldChange("url", value)}
                mono
              />
              <TextareaField
                label={t("mcp.headers")}
                value={editor.draft.headersText}
                onChange={(value) => editor.onFieldChange("headersText", value)}
                mono
              />
            </>
          )}
          <TextareaField
            label={t("mcp.env")}
            value={editor.draft.envText}
            onChange={(value) => editor.onFieldChange("envText", value)}
            mono
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={editor.onClose}>
            {t("mcp.cancel")}
          </Button>
          <Button onClick={editor.onSave} disabled={!editor.canSave} aria-busy={editor.requestState.save}>
            {t("mcp.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InputField({
  label,
  value,
  onChange,
  disabled,
  mono,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "focus:ring-2 focus:ring-ring/20 focus:border-primary",
          mono && "",
        )}
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={2}
        className={cn(mono && "")}
      />
    </div>
  );
}
