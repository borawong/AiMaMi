import type { ReactNode } from "react";
import { useState } from "react";
import {
  Accessibility,
  Bot,
  History,
  Keyboard,
  Loader2,
  Mic,
  MousePointer2,
  Play,
  Save,
  Search,
  Settings2,
  Square,
  Trash2,
  Wand2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { VoiceRecordPreview } from "../cache";
import type { useVoiceModule } from "../hooks";
import { previewText, recordEntries } from "../utils";

type VoiceModuleView = ReturnType<typeof useVoiceModule>;
type EvidenceAction<TInput = void> = {
  run: (input: TInput) => Promise<unknown>;
  isPending: boolean;
};

export function VoiceWorkspacePanel({ module }: { module: VoiceModuleView }) {
  const { t } = useTranslation();
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [vocabularySource, setVocabularySource] = useState("");
  const [vocabularyReplacement, setVocabularyReplacement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const facts = module.workspaceFacts;

  return (
    <QueryPanel titleKey="voice.workspace" state={module.workspaceQuery}>
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow label={t("voice.sourcePath")}>
          {facts.sourcePath || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.lastUpdatedAt")}>
          {formatTimestamp(facts.lastUpdatedAt) || t("voice.notAvailable")}
        </DetailRow>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <RecordList
          titleKey="voice.templateCount"
          items={facts.templates}
          emptyKey="voice.emptyTemplates"
          fallbackKey="voice.unknownTemplate"
          onRemove={(id) =>
            runEvidence(setError, () =>
              module.workspaceActions.removeTemplate.run(id),
            )
          }
          removeLabelKey="voice.removeTemplate"
          removing={module.workspaceActions.removeTemplate.isPending}
        />
        <RecordList
          titleKey="voice.vocabularyCount"
          items={facts.vocabulary}
          emptyKey="voice.emptyVocabulary"
          fallbackKey="voice.unknownVocabulary"
          onRemove={(id) =>
            runEvidence(setError, () =>
              module.workspaceActions.removeVocabulary.run(id),
            )
          }
          removeLabelKey="voice.removeVocabulary"
          removing={module.workspaceActions.removeVocabulary.isPending}
        />
        <RecordList
          titleKey="voice.vocabularyApps"
          items={facts.vocabularyApps}
          emptyKey="voice.emptyVocabularyApps"
          fallbackKey="voice.unknownVocabularyApp"
          onRemove={(id) =>
            runEvidence(setError, () =>
              module.workspaceActions.removeVocabularyAppScope.run(id),
            )
          }
          removeLabelKey="voice.removeVocabularyAppScopeBoundary"
          removing={module.workspaceActions.removeVocabularyAppScope.isPending}
        />
        <RecordList
          titleKey="voice.historyCount"
          items={facts.history}
          emptyKey="voice.emptyHistory"
          fallbackKey="voice.unknownHistory"
          onRemove={(id) =>
            runEvidence(setError, () =>
              module.workspaceActions.removeHistoryEntry.run(id),
            )
          }
          removeLabelKey="voice.removeHistoryEntry"
          removing={module.workspaceActions.removeHistoryEntry.isPending}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <BoundaryForm titleKey="voice.upsertTemplateBoundary" icon={<Wand2 />}>
          <Input
            value={templateTitle}
            onChange={(event) => setTemplateTitle(event.target.value)}
            placeholder={t("voice.templateTitlePlaceholder")}
          />
          <Input
            value={templateDescription}
            onChange={(event) => setTemplateDescription(event.target.value)}
            placeholder={t("voice.templateDescriptionPlaceholder")}
          />
          <Textarea
            value={templateContent}
            onChange={(event) => setTemplateContent(event.target.value)}
            placeholder={t("voice.templateContentPlaceholder")}
            className="min-h-24"
          />
          <ActionButton
            icon={<Save />}
            labelKey="voice.upsertTemplateBoundary"
            action={module.workspaceActions.upsertTemplate}
            disabled={!templateTitle.trim() || !templateContent.trim()}
            onRun={() =>
              module.workspaceActions.upsertTemplate.run({
                title: templateTitle.trim(),
                description: templateDescription.trim(),
                content: templateContent,
              })
            }
            onError={setError}
          />
        </BoundaryForm>

        <BoundaryForm titleKey="voice.upsertVocabularyBoundary" icon={<Wand2 />}>
          <Input
            value={vocabularySource}
            onChange={(event) => setVocabularySource(event.target.value)}
            placeholder={t("voice.vocabularySourcePlaceholder")}
          />
          <Input
            value={vocabularyReplacement}
            onChange={(event) => setVocabularyReplacement(event.target.value)}
            placeholder={t("voice.vocabularyReplacementPlaceholder")}
          />
          <ActionButton
            icon={<Save />}
            labelKey="voice.upsertVocabularyBoundary"
            action={module.workspaceActions.upsertVocabulary}
            disabled={!vocabularySource.trim() || !vocabularyReplacement.trim()}
            onRun={() =>
              module.workspaceActions.upsertVocabulary.run({
                source: vocabularySource.trim(),
                replacement: vocabularyReplacement.trim(),
                kind: "mapping",
              })
            }
            onError={setError}
          />
        </BoundaryForm>
      </div>

      <LocalError error={error} />
    </QueryPanel>
  );
}

export function VoiceRuntimePanel({ module }: { module: VoiceModuleView }) {
  const { t } = useTranslation();
  const [shortcutDraft, setShortcutDraft] = useState(
    module.runtimeFacts.globalShortcut,
  );
  const [modeDraft, setModeDraft] = useState(
    module.runtimeFacts.processingModeId,
  );
  const [error, setError] = useState<string | null>(null);
  const facts = module.runtimeFacts;

  return (
    <QueryPanel titleKey="voice.runtime" state={module.runtimeQuery}>
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow label={t("voice.captureState")}>
          {facts.captureState || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.shortcut")}>
          {facts.globalShortcut || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.triggerStyle")}>
          {facts.triggerStyle || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.triggerKey")}>
          {facts.triggerKeyLabel || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.processingMode")}>
          {facts.processingMode || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.processingModeId")}>
          {facts.processingModeId || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.speechModel")}>
          {facts.speechModel || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.autoInject")}>
          {t(facts.autoInject ? "overview.enabled" : "overview.disabled")}
        </DetailRow>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <BoundaryForm titleKey="voice.runtimeSwitch" icon={<Settings2 />}>
          <label className="flex items-center justify-between gap-3 rounded-[8px] border border-border px-3 py-2 text-sm">
            <span>{t(facts.enabled ? "voice.disableRuntime" : "voice.enableRuntime")}</span>
            <Switch
              checked={facts.enabled}
              disabled={module.runtimeActions.updateRuntimeSettings.isPending}
              onCheckedChange={(checked) =>
                void runEvidence(setError, () =>
                  module.runtimeActions.updateRuntimeSettings.run({ enabled: checked }),
                )
              }
            />
          </label>
          <div className="flex gap-2">
            <ActionButton
              icon={<Play />}
              labelKey="voice.startCapture"
              action={module.runtimeActions.startCapture}
              onRun={() => module.runtimeActions.startCapture.run()}
              onError={setError}
            />
            <ActionButton
              icon={<Square />}
              labelKey="voice.stopCapture"
              action={module.runtimeActions.stopCapture}
              onRun={() => module.runtimeActions.stopCapture.run()}
              onError={setError}
              variant="outline"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <ActionButton
              icon={<Mic />}
              labelKey="voice.requestPermissions"
              action={module.requestPermissionsAction}
              onRun={() => module.requestPermissionsAction.run()}
              onError={setError}
              variant="outline"
            />
            <ActionButton
              icon={<Accessibility />}
              labelKey="voice.requestAccessibilityPermission"
              action={module.requestAccessibilityAction}
              onRun={() => module.requestAccessibilityAction.run()}
              onError={setError}
              variant="outline"
            />
          </div>
        </BoundaryForm>

        <BoundaryForm titleKey="voice.triggerBindings" icon={<Keyboard />}>
          <div className="grid gap-2 sm:grid-cols-3">
            <ActionButton
              icon={<Keyboard />}
              labelKey="voice.captureHoldTrigger"
              action={module.runtimeActions.captureTriggerKey}
              onRun={() => module.runtimeActions.captureTriggerKey.run("hold")}
              onError={setError}
              variant="outline"
            />
            <ActionButton
              icon={<Keyboard />}
              labelKey="voice.captureToggleTrigger"
              action={module.runtimeActions.captureTriggerKey}
              onRun={() => module.runtimeActions.captureTriggerKey.run("toggle")}
              onError={setError}
              variant="outline"
            />
            <ActionButton
              icon={<Square />}
              labelKey="voice.cancelTriggerCapture"
              action={module.runtimeActions.cancelTriggerCapture}
              onRun={() => module.runtimeActions.cancelTriggerCapture.run()}
              onError={setError}
              variant="outline"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              value={shortcutDraft}
              onChange={(event) => setShortcutDraft(event.target.value)}
              placeholder={t("voice.shortcutPlaceholder")}
            />
            <ActionButton
              icon={<Save />}
              labelKey="voice.setShortcut"
              action={module.runtimeActions.setGlobalShortcut}
              onRun={() =>
                module.runtimeActions.setGlobalShortcut.run(
                  shortcutDraft.trim() || null,
                )
              }
              onError={setError}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              value={modeDraft}
              onChange={(event) => setModeDraft(event.target.value)}
              placeholder={t("voice.processingModeId")}
            />
            <ActionButton
              icon={<Save />}
              labelKey="voice.setProcessingModeBoundary"
              action={module.runtimeActions.setProcessingModeId}
              disabled={!modeDraft.trim()}
              onRun={() =>
                module.runtimeActions.setProcessingModeId.run({
                  modeId: modeDraft.trim(),
                  processingMode: facts.processingMode || null,
                })
              }
              onError={setError}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton
              icon={<Keyboard />}
              labelKey="voice.suppressTriggerListener"
              action={module.runtimeActions.setTriggerListenerSuppressed}
              onRun={() =>
                module.runtimeActions.setTriggerListenerSuppressed.run(true)
              }
              onError={setError}
              variant="outline"
            />
            <ActionButton
              icon={<Keyboard />}
              labelKey="voice.allowTriggerListener"
              action={module.runtimeActions.setTriggerListenerSuppressed}
              onRun={() =>
                module.runtimeActions.setTriggerListenerSuppressed.run(false)
              }
              onError={setError}
              variant="outline"
            />
          </div>
        </BoundaryForm>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <RuntimeTextPreview titleKey="voice.liveText" value={facts.liveText} />
        <RuntimeTextPreview titleKey="voice.committedText" value={facts.committedText} />
        <RuntimeTextPreview
          titleKey="voice.capturedSelectedText"
          value={facts.capturedSelectedText}
        />
        <RuntimeTextPreview
          titleKey="voice.capturedClipboardText"
          value={facts.capturedClipboardText}
        />
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="text-xs font-medium text-muted-foreground">
          {t("voice.runtimeDiagnostics")}
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <DetailRow label={t("voice.configPath")}>
            {facts.configPath || t("voice.notAvailable")}
          </DetailRow>
          <DetailRow label={t("voice.sidecarPath")}>
            {facts.sidecarPath || t("voice.notAvailable")}
          </DetailRow>
          <DetailRow label={t("voice.lastError")}>
            {facts.lastError || t("voice.notAvailable")}
          </DetailRow>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {t("voice.permissions")}
            </p>
            <LocalObjectPreview value={facts.permissions} />
          </div>
        </div>
      </div>

      <LocalError error={error} />
    </QueryPanel>
  );
}

export function VoiceConfigPanel({ module }: { module: VoiceModuleView }) {
  const { t } = useTranslation();
  const [llmProvider, setLlmProvider] = useState("default");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [llmModel, setLlmModel] = useState("");
  const [llmBaseUrl, setLlmBaseUrl] = useState("");
  const [asrProvider, setAsrProvider] = useState("default");
  const [asrApiKey, setAsrApiKey] = useState("");
  const [asrModel, setAsrModel] = useState("");
  const [asrBaseUrl, setAsrBaseUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const facts = module.runtimeFacts;

  return (
    <QueryPanel titleKey="voice.config" state={module.runtimeQuery}>
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow label={t("voice.activeAsrProvider")}>
          {facts.activeAsrProvider || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.activeAsrModel")}>
          {facts.activeAsrModel || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.recognitionLanguage")}>
          {facts.recognitionLanguage || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.detectedAsrLanguage")}>
          {facts.detectedAsrLanguage || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.detectedAsrEmotion")}>
          {facts.detectedAsrEmotion || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.lastAsrDurationMs")}>
          {facts.lastAsrDurationMs === null
            ? t("voice.notAvailable")
            : `${facts.lastAsrDurationMs} ms`}
        </DetailRow>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <BoundaryForm titleKey="voice.saveLlmConfigBoundary" icon={<Bot />}>
          <Input
            value={llmProvider}
            onChange={(event) => setLlmProvider(event.target.value)}
            placeholder={t("voice.providerPlaceholder")}
          />
          <Input
            value={llmApiKey}
            onChange={(event) => setLlmApiKey(event.target.value)}
            placeholder={t("voice.apiKeyPlaceholder")}
          />
          <Input
            value={llmModel}
            onChange={(event) => setLlmModel(event.target.value)}
            placeholder={t("voice.modelPlaceholder")}
          />
          <Input
            value={llmBaseUrl}
            onChange={(event) => setLlmBaseUrl(event.target.value)}
            placeholder={t("voice.baseUrlPlaceholder")}
          />
          <div className="flex flex-wrap gap-2">
            <ActionButton
              icon={<Settings2 />}
              labelKey="voice.loadLlmConfig"
              action={module.configActions.loadLlmConfig}
              onRun={() => module.configActions.loadLlmConfig.run(llmProvider)}
              onError={setError}
              variant="outline"
            />
            <ActionButton
              icon={<Save />}
              labelKey="voice.saveLlmConfigBoundary"
              action={module.configActions.saveLlmConfig}
              onRun={() =>
                module.configActions.saveLlmConfig.run({
                  llmProvider,
                  llmApiKey,
                  llmModel,
                  llmBaseUrl,
                })
              }
              onError={setError}
            />
            <ActionButton
              icon={<Play />}
              labelKey="voice.testLlmConfigBoundary"
              action={module.configActions.testLlmConfig}
              onRun={() =>
                module.configActions.testLlmConfig.run({
                  llmProvider,
                  llmApiKey,
                  llmModel,
                  llmBaseUrl,
                })
              }
              onError={setError}
              variant="outline"
            />
          </div>
        </BoundaryForm>

        <BoundaryForm titleKey="voice.saveAsrConfigBoundary" icon={<Mic />}>
          <Input
            value={asrProvider}
            onChange={(event) => setAsrProvider(event.target.value)}
            placeholder={t("voice.providerPlaceholder")}
          />
          <Input
            value={asrApiKey}
            onChange={(event) => setAsrApiKey(event.target.value)}
            placeholder={t("voice.apiKeyPlaceholder")}
          />
          <Input
            value={asrModel}
            onChange={(event) => setAsrModel(event.target.value)}
            placeholder={t("voice.modelPlaceholder")}
          />
          <Input
            value={asrBaseUrl}
            onChange={(event) => setAsrBaseUrl(event.target.value)}
            placeholder={t("voice.baseUrlPlaceholder")}
          />
          <div className="flex flex-wrap gap-2">
            <ActionButton
              icon={<Settings2 />}
              labelKey="voice.loadAsrConfig"
              action={module.configActions.loadAsrConfig}
              onRun={() => module.configActions.loadAsrConfig.run(asrProvider)}
              onError={setError}
              variant="outline"
            />
            <ActionButton
              icon={<Save />}
              labelKey="voice.saveAsrConfigBoundary"
              action={module.configActions.saveAsrConfig}
              onRun={() =>
                module.configActions.saveAsrConfig.run({
                  asrProvider,
                  asrApiKey,
                  asrModel,
                  asrBaseUrl,
                })
              }
              onError={setError}
            />
            <ActionButton
              icon={<Play />}
              labelKey="voice.testAsrConfigBoundary"
              action={module.configActions.testAsrConfig}
              onRun={() =>
                module.configActions.testAsrConfig.run({
                  asrProvider,
                  asrApiKey,
                  asrModel,
                  asrBaseUrl,
                })
              }
              onError={setError}
              variant="outline"
            />
          </div>
        </BoundaryForm>
      </div>

      <LocalError error={error} />
    </QueryPanel>
  );
}

export function VoiceOverlayPanel({ module }: { module: VoiceModuleView }) {
  const { t } = useTranslation();
  const [rawText, setRawText] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [injectDraft, setInjectDraft] = useState("");
  const [expectedBundleId, setExpectedBundleId] = useState(
    module.runtimeFacts.capturedBundleId,
  );
  const [overlayQuery, setOverlayQuery] = useState("");
  const [overlayOutput, setOverlayOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const facts = module.runtimeFacts;

  return (
    <QueryPanel titleKey="voice.injectOverlay" state={module.runtimeQuery}>
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow label={t("voice.capturedApp")}>
          {facts.capturedAppName || t("voice.notAvailable")}
        </DetailRow>
        <DetailRow label={t("voice.capturedBundle")}>
          {facts.capturedBundleId || t("voice.notAvailable")}
        </DetailRow>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <BoundaryForm titleKey="voice.generatePromptBoundary" icon={<Wand2 />}>
          <Textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder={t("voice.rawTextPlaceholder")}
            className="min-h-24"
          />
          <Textarea
            value={selectedText}
            onChange={(event) => setSelectedText(event.target.value)}
            placeholder={t("voice.selectedTextPlaceholder")}
            className="min-h-20"
          />
          <ActionButton
            icon={<Wand2 />}
            labelKey="voice.generatePromptBoundary"
            action={module.generationActions.generatePrompt}
            disabled={!rawText.trim() && !selectedText.trim()}
            onRun={() =>
              module.generationActions.generatePrompt.run({
                rawText,
                selectedText,
                clipboardText: facts.capturedClipboardText || null,
                targetAppName: facts.capturedAppName || null,
                targetBundleId: facts.capturedBundleId || null,
                asrProvider: facts.activeAsrProvider || null,
                asrModel: facts.activeAsrModel || null,
                asrLanguage: facts.detectedAsrLanguage || null,
                asrEmotion: facts.detectedAsrEmotion || null,
                asrDurationMs: facts.lastAsrDurationMs,
                asrErrorCode: facts.lastAsrErrorCode || null,
              })
            }
            onError={setError}
          />
        </BoundaryForm>

        <BoundaryForm titleKey="voice.injectText" icon={<MousePointer2 />}>
          <Textarea
            value={injectDraft}
            onChange={(event) => setInjectDraft(event.target.value)}
            placeholder={t("voice.injectPlaceholder")}
            className="min-h-28"
          />
          <Input
            value={expectedBundleId}
            onChange={(event) => setExpectedBundleId(event.target.value)}
            placeholder={t("voice.expectedBundlePlaceholder")}
          />
          <ActionButton
            icon={<MousePointer2 />}
            labelKey="voice.injectText"
            action={module.runtimeActions.injectText}
            disabled={!injectDraft.trim()}
            onRun={() =>
              module.runtimeActions.injectText.run({
                text: injectDraft,
                expectedBundleId: expectedBundleId.trim() || null,
              })
            }
            onError={setError}
          />
        </BoundaryForm>

        <BoundaryForm titleKey="voice.showOverlay" icon={<Search />}>
          <Input
            value={overlayQuery}
            onChange={(event) => setOverlayQuery(event.target.value)}
            placeholder={t("voice.overlayQueryPlaceholder")}
          />
          <Textarea
            value={overlayOutput}
            onChange={(event) => setOverlayOutput(event.target.value)}
            placeholder={t("voice.overlayOutputPlaceholder")}
            className="min-h-28"
          />
          <ActionButton
            icon={<Search />}
            labelKey="voice.showOverlay"
            action={module.runtimeActions.showSearchOverlay}
            disabled={!overlayQuery.trim() && !overlayOutput.trim()}
            onRun={() =>
              module.runtimeActions.showSearchOverlay.run({
                query: overlayQuery,
                output: overlayOutput,
              })
            }
            onError={setError}
          />
        </BoundaryForm>
      </div>

      <LocalError error={error} />
    </QueryPanel>
  );
}

function QueryPanel({
  titleKey,
  state,
  children,
}: {
  titleKey: string;
  state: {
    isLoading?: boolean;
    isFetching?: boolean;
    isError?: boolean;
    refetch?: () => Promise<unknown>;
  };
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <BentoCard className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground">
            {t(titleKey)}
          </h3>
          <StatusLine state={state} />
        </div>
        {state.refetch && (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={state.isFetching}
            aria-label={t("common.refresh")}
            onClick={() => void state.refetch?.()}
          >
            <Loader2
              className={cn("h-3.5 w-3.5", state.isFetching && "animate-spin")}
            />
          </Button>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </BentoCard>
  );
}

function StatusLine({
  state,
}: {
  state: { isLoading?: boolean; isFetching?: boolean; isError?: boolean };
}) {
  const { t } = useTranslation();
  const key = state.isLoading
    ? "feature.restored.loading"
    : state.isError
      ? "feature.restored.error"
      : state.isFetching
        ? "feature.restored.refreshing"
        : "feature.restored.ready";

  return (
    <span
      className={cn(
        "text-xs text-muted-foreground",
        state.isError && "text-destructive",
      )}
    >
      {t(key)}
    </span>
  );
}

function BoundaryForm({
  titleKey,
  icon,
  children,
}: {
  titleKey: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <section className="min-w-0 space-y-3 rounded-[8px] border border-border p-4">
      <h4 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
        {t(titleKey)}
      </h4>
      {children}
    </section>
  );
}

function RecordList({
  titleKey,
  items,
  emptyKey,
  fallbackKey,
  onRemove,
  removeLabelKey,
  removing,
}: {
  titleKey: string;
  items: VoiceRecordPreview[];
  emptyKey: string;
  fallbackKey: string;
  onRemove?: (id: string) => void;
  removeLabelKey?: string;
  removing?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <section className="min-w-0">
      <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <History className="h-3.5 w-3.5" />
        {t(titleKey)}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 rounded-[8px] border border-dashed border-border p-4 text-sm text-muted-foreground">
          {t(emptyKey)}
        </p>
      ) : (
        <div className="mt-2 divide-y divide-border rounded-[8px] border border-border">
          {items.map((item, index) => {
            const id = item.id || item.primary;
            return (
              <div
                key={id || index}
                className="grid min-w-0 gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.primary || t(fallbackKey)}
                  </p>
                  {item.secondary && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.secondary}
                    </p>
                  )}
                </div>
                {onRemove && id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={removing}
                    aria-label={t(removeLabelKey ?? "common.delete")}
                    onClick={() => onRemove(id)}
                  >
                    {removing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RuntimeTextPreview({
  titleKey,
  value,
}: {
  titleKey: string;
  value: string;
}) {
  const { t } = useTranslation();

  return (
    <section className="min-w-0 rounded-[8px] border border-border p-3">
      <h4 className="text-xs font-medium text-muted-foreground">{t(titleKey)}</h4>
      <p className="mt-2 min-h-10 whitespace-pre-wrap break-words text-sm text-foreground">
        {value || t("voice.notAvailable")}
      </p>
    </section>
  );
}

function ActionButton<TInput>({
  labelKey,
  icon,
  action,
  onRun,
  onError,
  disabled,
  variant = "default",
}: {
  labelKey: string;
  icon: ReactNode;
  action: EvidenceAction<TInput>;
  onRun: () => Promise<unknown>;
  onError: (error: string | null) => void;
  disabled?: boolean;
  variant?: "default" | "outline";
}) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={disabled || action.isPending}
      onClick={() => void runEvidence(onError, onRun)}
    >
      {action.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {t(labelKey)}
    </Button>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-1 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-foreground">{children}</span>
    </div>
  );
}

function LocalObjectPreview({ value }: { value: unknown }) {
  const entries = recordEntries(value).slice(0, 4);

  if (entries.length === 0) {
    return (
      <p className="mt-1 truncate text-sm text-muted-foreground">
        {previewText(value)}
      </p>
    );
  }

  return (
    <div className="mt-1 space-y-2">
      {entries.map(([key, item]) => (
        <div
          key={key}
          className="grid gap-2 text-xs sm:grid-cols-[7rem_minmax(0,1fr)]"
        >
          <Badge variant="outline" className="w-fit max-w-full truncate">
            {key}
          </Badge>
          <span className="min-w-0 break-words text-foreground">
            {previewText(item)}
          </span>
        </div>
      ))}
    </div>
  );
}

function LocalError({ error }: { error: string | null }) {
  const { t } = useTranslation();
  if (!error) return null;

  return (
    <p className="mt-4 rounded-[8px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      {t("voice.boundaryActionFailed")}: {error}
    </p>
  );
}

async function runEvidence(
  setError: (error: string | null) => void,
  run: () => Promise<unknown>,
) {
  setError(null);
  try {
    await run();
  } catch (error) {
    setError(error instanceof Error ? error.message : String(error));
  }
}

function formatTimestamp(value: number | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value);
  } catch {
    return String(value);
  }
}
