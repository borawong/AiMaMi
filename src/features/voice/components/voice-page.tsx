/**
 * 中文职责说明：语音页面渲染语音工作区与运行时状态，不持有语音处理事务。
 */
import { useState, type ReactElement } from "react";
import type { VoiceProcessingMode, VoiceSpeechModel } from "@/types";
import {
  History,
  Keyboard,
  Mic,
  Play,
  Save,
  ScrollText,
  Search,
  Square,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  envelopeData,
  readArray,
  readBoolean,
  readString,
} from "@/features/_shared/evidence-data";
import {
  BoolBadge,
  EvidencePageHeader,
  MetricCard,
  QueryPanel,
  RecordList,
  RecordSummary,
} from "@/features/_shared/evidence-panels";
import { useVoiceModule } from "../hooks";

export function VoicePage() {
  const { t } = useTranslation();
  const module = useVoiceModule();
  const [shortcutDraft, setShortcutDraft] = useState("");
  const [injectDraft, setInjectDraft] = useState("");
  const [overlayQueryDraft, setOverlayQueryDraft] = useState("");
  const [overlayOutputDraft, setOverlayOutputDraft] = useState("");
  const [llmProviderDraft, setLlmProviderDraft] = useState("");
  const [asrProviderDraft, setAsrProviderDraft] = useState("");
  const workspace = envelopeData(module.workspaceQuery.data);
  const runtime = envelopeData(module.runtimeQuery.data);
  const templates = readArray(workspace, ["templates"]);
  const vocabulary = readArray(workspace, ["vocabulary"]);
  const history = readArray(workspace, ["history"]);
  const supported = readBoolean(runtime, ["supported"]);
  const enabled = readBoolean(runtime, ["enabled"]);
  const captureState = readString(runtime, ["captureState"], "");
  const globalShortcut = readString(runtime, ["globalShortcut"], "");
  const processingMode = readString(runtime, ["processingMode"], "");
  const processingModeId = readString(runtime, ["processingModeId"], "");
  const speechModel = readString(runtime, ["speechModel"], "");
  const triggerStyle = readString(runtime, ["triggerStyle"], "");
  const triggerKeyLabel = readString(runtime, ["triggerKeyLabel"], "");
  const activeAsrProvider = readString(runtime, ["activeAsrProvider"], "");
  const activeAsrModel = readString(runtime, ["activeAsrModel"], "");
  const capturedBundleId = readString(runtime, ["capturedTargetBundleId"], "");
  const capturedAppName = readString(runtime, ["capturedTargetAppName"], "");
  const isBusy = module.isAnyMutationPending;

  return (
    <div className="space-y-5">
      <EvidencePageHeader
        titleKey="nav.voice"
        descriptionKey="voice.description"
        actions={[module.requestPermissionsAction, module.requestAccessibilityAction]}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          labelKey="voice.templateCount"
          value={<MetricIcon icon={<ScrollText />} value={templates.length} />}
        />
        <MetricCard
          labelKey="voice.vocabularyCount"
          value={<MetricIcon icon={<Wand2 />} value={vocabulary.length} />}
        />
        <MetricCard
          labelKey="voice.historyCount"
          value={<MetricIcon icon={<History />} value={history.length} />}
        />
        <MetricCard
          labelKey="voice.runtimeEnabled"
          value={
            <span className="inline-flex flex-wrap gap-2">
              <BoolBadge
                value={supported}
                trueKey="voice.supported"
                falseKey="voice.unsupported"
              />
              <BoolBadge
                value={enabled}
                trueKey="overview.enabled"
                falseKey="overview.disabled"
              />
            </span>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QueryPanel titleKey="voice.workspace" state={module.workspaceQuery}>
          <RecordList
            items={templates}
            emptyKey="voice.emptyTemplates"
            renderItem={(template) => (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {readString(template, ["title", "name", "id"], t("voice.unknownTemplate"))}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {readString(template, ["description", "kind"], "")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0 text-destructive hover:text-destructive"
                  aria-label="remove_voice_template"
                  disabled={!readString(template, ["id"], "") || isBusy}
                  onClick={() =>
                    void module.workspaceActions.removeTemplate.run(
                      readString(template, ["id"], ""),
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {/* 新增或更新模板需要完整编辑器与字段校验，本轮只保留已证实通信边界。 */}
            <BoundaryButton
              icon={<Save />}
              label={t("voice.upsertTemplateBoundary")}
              ariaLabel="upsert_voice_template"
            />
          </div>
        </QueryPanel>

        <QueryPanel titleKey="voice.vocabulary" state={module.workspaceQuery}>
          <RecordList
            items={vocabulary}
            emptyKey="voice.emptyVocabulary"
            renderItem={(entry) => (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {readString(entry, ["source", "id"], t("voice.unknownVocabulary"))}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {readString(entry, ["replacement", "kind"], "")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0 text-destructive hover:text-destructive"
                  aria-label="remove_voice_vocabulary"
                  disabled={!readString(entry, ["id"], "") || isBusy}
                  onClick={() =>
                    void module.workspaceActions.removeVocabulary.run(
                      readString(entry, ["id"], ""),
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {/* 词表写入、批量替换和应用范围需要完整传输结构，还原前不编造表单。 */}
            <BoundaryButton
              icon={<Save />}
              label={t("voice.upsertVocabularyBoundary")}
              ariaLabel="upsert_voice_vocabulary"
            />
            <BoundaryButton
              icon={<Wand2 />}
              label={t("voice.replaceVocabularyBoundary")}
              ariaLabel="replace_voice_vocabulary_kind"
            />
            <BoundaryButton
              icon={<Search />}
              label={t("voice.vocabularyAppBoundary")}
              ariaLabel="upsert_voice_vocabulary_app_scope"
            />
          </div>
        </QueryPanel>

        <QueryPanel titleKey="voice.runtime" state={module.runtimeQuery}>
          <div className="space-y-3">
            <RuntimeRow label={t("voice.captureState")} value={captureState || "-"} />
            <RuntimeRow label={t("voice.shortcut")} value={globalShortcut || "-"} />
            <RuntimeRow label={t("voice.triggerStyle")} value={triggerStyle || "-"} />
            <RuntimeRow label={t("voice.triggerKey")} value={triggerKeyLabel || "-"} />
            <RuntimeRow label={t("voice.processingMode")} value={processingMode || "-"} />
            <RuntimeRow label={t("voice.processingModeId")} value={processingModeId || "-"} />
            <RecordSummary value={readRuntimePermissions(runtime)} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <ActionButton
              icon={<Mic />}
              label={t("voice.startCapture")}
              disabled={isBusy}
              onClick={() => void module.runtimeActions.startCapture.run()}
            />
            <ActionButton
              icon={<Square />}
              label={t("voice.stopCapture")}
              disabled={isBusy}
              onClick={() => void module.runtimeActions.stopCapture.run()}
            />
            <ActionButton
              icon={<Keyboard />}
              label={t("voice.captureHoldTrigger")}
              disabled={isBusy}
              onClick={() => void module.runtimeActions.captureTriggerKey.run("hold")}
            />
            <ActionButton
              icon={<Keyboard />}
              label={t("voice.captureToggleTrigger")}
              disabled={isBusy}
              onClick={() => void module.runtimeActions.captureTriggerKey.run("toggle")}
            />
            <ActionButton
              icon={<X />}
              label={t("voice.cancelTriggerCapture")}
              disabled={isBusy}
              onClick={() => void module.runtimeActions.cancelTriggerCapture.run()}
            />
            <ActionButton
              icon={<Play />}
              label={t("voice.allowTriggerListener")}
              disabled={isBusy}
              onClick={() =>
                void module.runtimeActions.setTriggerListenerSuppressed.run(false)
              }
            />
            <ActionButton
              icon={<Square />}
              label={t("voice.suppressTriggerListener")}
              disabled={isBusy}
              onClick={() =>
                void module.runtimeActions.setTriggerListenerSuppressed.run(true)
              }
            />
          </div>
          <div className="mt-4 grid gap-3 border-t border-border pt-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="min-w-0 text-xs text-muted-foreground">
              <span>{t("voice.shortcutDraft")}</span>
              <input
                className="mt-1 h-9 w-full rounded-[8px] border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                value={shortcutDraft}
                placeholder={globalShortcut || t("voice.shortcutPlaceholder")}
                onChange={(event) => setShortcutDraft(event.target.value)}
              />
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isBusy}
              onClick={() =>
                void module.runtimeActions.setGlobalShortcut.run(
                  shortcutDraft.trim() || null,
                )
              }
            >
              <Keyboard className="h-3.5 w-3.5" />
              {t("voice.setShortcut")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isBusy}
              onClick={() =>
                void module.runtimeActions.updateRuntimeSettings.run({
                  enabled: !enabled,
                  shortcut: globalShortcut || null,
                  speechModel: speechModel
                    ? (speechModel as VoiceSpeechModel)
                    : null,
                  processingMode: processingMode
                    ? (processingMode as VoiceProcessingMode)
                    : null,
                  processingModeId: processingModeId || null,
                })
              }
            >
              <Play className="h-3.5 w-3.5" />
              {t(enabled ? "voice.disableRuntime" : "voice.enableRuntime")}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* 触发键、触发绑定和模式快捷键需要真实按键传输结构，先只暴露禁用边界。 */}
            <BoundaryButton
              icon={<Keyboard />}
              label={t("voice.setTriggerKeyBoundary")}
              ariaLabel="set_voice_trigger_key"
            />
            <BoundaryButton
              icon={<Keyboard />}
              label={t("voice.setTriggerBindingsBoundary")}
              ariaLabel="set_voice_trigger_bindings"
            />
            <BoundaryButton
              icon={<Save />}
              label={t("voice.setProcessingModeBoundary")}
              ariaLabel="set_voice_processing_mode_id"
            />
            <BoundaryButton
              icon={<Keyboard />}
              label={t("voice.modeShortcutBoundary")}
              ariaLabel="set_voice_mode_shortcut"
            />
          </div>
        </QueryPanel>

        <QueryPanel titleKey="voice.history" state={module.workspaceQuery}>
          <RecordList
            items={history}
            emptyKey="voice.emptyHistory"
            renderItem={(entry) => (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {readString(entry, ["templateTitle", "id"], t("voice.unknownHistory"))}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {readString(entry, ["renderedText", "rawText"], "")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0 text-destructive hover:text-destructive"
                  aria-label="remove_voice_history_entry"
                  disabled={!readString(entry, ["id"], "") || isBusy}
                  onClick={() =>
                    void module.workspaceActions.removeHistoryEntry.run(
                      readString(entry, ["id"], ""),
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {/* 提示词生成需要原始文本、模板和上下文输入，本轮仅保留动作边界。 */}
            <BoundaryButton
              icon={<Wand2 />}
              label={t("voice.generatePromptBoundary")}
              ariaLabel="generate_voice_prompt"
            />
          </div>
        </QueryPanel>

        <QueryPanel titleKey="voice.injectOverlay" state={module.runtimeQuery}>
          <div className="grid gap-3">
            <label className="min-w-0 text-xs text-muted-foreground">
              <span>{t("voice.injectDraft")}</span>
              <textarea
                className="mt-1 min-h-20 w-full resize-y rounded-[8px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                value={injectDraft}
                placeholder={t("voice.injectPlaceholder")}
                onChange={(event) => setInjectDraft(event.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <RuntimeRow label={t("voice.capturedApp")} value={capturedAppName || "-"} />
              <RuntimeRow label={t("voice.capturedBundle")} value={capturedBundleId || "-"} />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="justify-self-start"
              disabled={!injectDraft.trim() || isBusy}
              onClick={() =>
                void module.runtimeActions.injectText.run({
                  text: injectDraft.trim(),
                  expectedBundleId: capturedBundleId || null,
                })
              }
            >
              <Play className="h-3.5 w-3.5" />
              {t("voice.injectText")}
            </Button>
          </div>

          <div className="mt-4 grid gap-3 border-t border-border pt-3">
            <label className="min-w-0 text-xs text-muted-foreground">
              <span>{t("voice.overlayQuery")}</span>
              <input
                className="mt-1 h-9 w-full rounded-[8px] border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                value={overlayQueryDraft}
                placeholder={t("voice.overlayQueryPlaceholder")}
                onChange={(event) => setOverlayQueryDraft(event.target.value)}
              />
            </label>
            <label className="min-w-0 text-xs text-muted-foreground">
              <span>{t("voice.overlayOutput")}</span>
              <textarea
                className="mt-1 min-h-20 w-full resize-y rounded-[8px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                value={overlayOutputDraft}
                placeholder={t("voice.overlayOutputPlaceholder")}
                onChange={(event) => setOverlayOutputDraft(event.target.value)}
              />
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="justify-self-start"
              disabled={
                !overlayQueryDraft.trim() || !overlayOutputDraft.trim() || isBusy
              }
              onClick={() =>
                void module.runtimeActions.showSearchOverlay.run({
                  query: overlayQueryDraft.trim(),
                  output: overlayOutputDraft.trim(),
                })
              }
            >
              <Search className="h-3.5 w-3.5" />
              {t("voice.showOverlay")}
            </Button>
          </div>
        </QueryPanel>

        <QueryPanel titleKey="voice.config" state={module.runtimeQuery}>
          <div className="grid gap-3 sm:grid-cols-2">
            <RuntimeRow label={t("voice.speechModel")} value={speechModel || "-"} />
            <RuntimeRow label={t("voice.activeAsrProvider")} value={activeAsrProvider || "-"} />
            <RuntimeRow label={t("voice.activeAsrModel")} value={activeAsrModel || "-"} />
            <RuntimeRow label={t("voice.processingMode")} value={processingMode || "-"} />
          </div>
          <div className="mt-4 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
            <label className="min-w-0 text-xs text-muted-foreground">
              <span>{t("voice.llmProvider")}</span>
              <input
                className="mt-1 h-9 w-full rounded-[8px] border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                value={llmProviderDraft}
                placeholder={t("voice.providerPlaceholder")}
                onChange={(event) => setLlmProviderDraft(event.target.value)}
              />
            </label>
            <label className="min-w-0 text-xs text-muted-foreground">
              <span>{t("voice.asrProvider")}</span>
              <input
                className="mt-1 h-9 w-full rounded-[8px] border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                value={asrProviderDraft}
                placeholder={activeAsrProvider || t("voice.providerPlaceholder")}
                onChange={(event) => setAsrProviderDraft(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ActionButton
              icon={<Search />}
              label={t("voice.loadLlmConfig")}
              disabled={!llmProviderDraft.trim() || isBusy}
              onClick={() =>
                void module.configActions.loadLlmConfig.run(llmProviderDraft.trim())
              }
            />
            <ActionButton
              icon={<Search />}
              label={t("voice.loadAsrConfig")}
              disabled={!asrProviderDraft.trim() || isBusy}
              onClick={() =>
                void module.configActions.loadAsrConfig.run(asrProviderDraft.trim())
              }
            />
            {/* 保存和测试配置需要密钥、模型和基础地址草稿，未补齐前不编造真实表单。 */}
            <BoundaryButton
              icon={<Save />}
              label={t("voice.saveLlmConfigBoundary")}
              ariaLabel="save_voice_llm_config"
            />
            <BoundaryButton
              icon={<Save />}
              label={t("voice.saveAsrConfigBoundary")}
              ariaLabel="save_voice_asr_config"
            />
          </div>
        </QueryPanel>
      </div>
    </div>
  );
}

function MetricIcon({ icon, value }: { icon: ReactElement; value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      {value}
    </span>
  );
}

function RuntimeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-foreground">{value}</span>
    </div>
  );
}

function readRuntimePermissions(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return (value as Record<string, unknown>).permissions ?? null;
}

function ActionButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: ReactElement;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onClick}>
      {icon}
      {label}
    </Button>
  );
}

function BoundaryButton({
  icon,
  label,
  ariaLabel,
}: {
  icon: ReactElement;
  label: string;
  ariaLabel: string;
}) {
  return (
    <Button type="button" size="sm" variant="outline" disabled aria-label={ariaLabel}>
      {icon}
      {label}
    </Button>
  );
}
