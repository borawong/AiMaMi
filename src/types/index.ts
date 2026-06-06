export type UsageSource = "local" | "api";
export type ApiProxyMode = "direct" | "manual";
export type ApiReachabilityStatus = "unknown" | "reachable" | "unreachable";
export type AutoSwitchRuntimeState = "running" | "stopped" | "notInstalled" | "unknown";
export type McpTransport = "stdio" | "http" | "sse" | "unknown";
export type CustomInstructionProtectionState = "ready" | "unmanaged" | "protected";
export type CustomInstructionHistoryAction = "apply" | "clear" | "rollback";
export type VoiceTemplateKind = "dictation" | "task" | "review" | "translation" | "summary" | "custom";
export type VoiceVocabularyKind = "hotword" | "mapping";
export type VoiceSpeechModel = "appleSpeech" | "aliyunFunAsr" | "openai";
export type VoiceProcessingMode = "dictation" | "task" | "review" | "summary";
export type VoiceProcessingStatus = "completed" | "llm_error" | "llm_missing";
export type VoicePermissionState = "authorized" | "denied" | "restricted" | "notDetermined" | "unsupported";
export type VoiceCaptureState = "idle" | "starting" | "recording" | "stopping" | "error";
export type VoiceTriggerStyle = "hold" | "toggle";

export interface CoreWarning {
  code: string;
  message: string;
}

export interface AppPathState {
  codexHome: string;
  accountsPath: string;
  authPath: string;
  registryPath: string;
  sessionsPath: string;
  launchAgentPath: string;
  autoSwitchLogPath: string;
  authExists: boolean;
  registryExists: boolean;
  sessionsExists: boolean;
}

export interface AutoSwitchStatusPayload {
  enabled: boolean;
  threshold5hPercent: number;
  thresholdWeeklyPercent: number;
  serviceState: AutoSwitchRuntimeState;
  serviceLabel: string;
}

export interface ApiConfigPayload {
  proxy: ApiProxyConfigPayload;
}

export interface ApiProxyConfigPayload {
  mode: ApiProxyMode;
  url: string | null;
}

export interface ApiConnectivityPayload {
  usageStatus: ApiReachabilityStatus;
  usageLastError: string | null;
}

export interface UpdateInstallabilityPayload {
  backendStatus: BackendSkeletonStatus;
  canInstall: boolean;
  code: string;
  executablePath: string | null;
  bundlePath: string | null;
  translocated: boolean;
  quarantined: boolean;
}

export interface SystemInfoPayload {
  backendStatus: BackendSkeletonStatus;
  os: string;
  osVersion: string;
  arch: string;
  hostname: string;
}

export interface AppStatusPayload {
  paths: AppPathState;
  lastScanAt: number;
  usageSource: UsageSource;
  autoSwitch: AutoSwitchStatusPayload;
  api: ApiConfigPayload;
  apiConnectivity: ApiConnectivityPayload;
}

export interface CoreSnapshotPayload {
  backendStatus: BackendSkeletonStatus;
  status: AppStatusPayload;
}

export interface CustomInstructionCurrentState {
  globalPath: string;
  fileExists: boolean;
  managedBlockPresent: boolean;
  protectionState: CustomInstructionProtectionState;
  issueMessage: string | null;
  managedContent: string;
  lastAppliedAt: number | null;
  lastTemplateCode: string | null;
  lastTemplateTitle: string | null;
}

export interface CustomInstructionHistoryEntry {
  id: string;
  createdAt: number;
  action: CustomInstructionHistoryAction;
  source: string;
  templateCode: string | null;
  templateTitle: string | null;
}

export interface CustomInstructionStatePayload {
  current: CustomInstructionCurrentState;
  history: CustomInstructionHistoryEntry[];
}

export interface CustomInstructionPreviewPayload {
  globalPath: string;
  protectionState: CustomInstructionProtectionState;
  issueMessage: string | null;
  currentManagedContent: string;
  nextManagedContent: string;
  resultingContent: string;
}

export interface VoicePromptTemplate {
  id: string;
  title: string;
  description: string;
  kind: VoiceTemplateKind;
  content: string;
  builtIn: boolean;
  updatedAt: number;
}

export interface VoiceVocabularyEntry {
  id: string;
  source: string;
  replacement: string;
  kind: VoiceVocabularyKind;
  appBundleId?: string | null;
  appName?: string | null;
  notes: string | null;
  updatedAt: number;
}

export interface VoiceVocabularyAppPayload {
  bundleId: string;
  name: string;
  path: string;
}

export interface VoiceHistoryEntry {
  id: string;
  templateId: string;
  templateTitle: string;
  templateKind: VoiceTemplateKind;
  promptContent?: string;
  rawText: string;
  renderedText: string;
  selectedText: string;
  clipboardText: string;
  targetBundleId?: string;
  targetAppName?: string;
  status?: VoiceProcessingStatus;
  processingError?: string | null;
  asrProvider?: string;
  asrModel?: string;
  asrLanguage?: string;
  asrEmotion?: string;
  asrDurationMs?: number | null;
  asrErrorCode?: string | null;
  createdAt: number;
}

export interface VoiceWorkspacePayload {
  templates: VoicePromptTemplate[];
  vocabulary: VoiceVocabularyEntry[];
  vocabularyApps?: VoiceVocabularyAppPayload[];
  history: VoiceHistoryEntry[];
  sourcePath: string;
  lastUpdatedAt: number;
}

export interface VoiceTemplateMutationPayload {
  workspace: VoiceWorkspacePayload;
  template: VoicePromptTemplate;
}

export interface VoiceVocabularyMutationPayload {
  workspace: VoiceWorkspacePayload;
  entry: VoiceVocabularyEntry;
}

export interface VoiceGeneratePayload {
  output: string;
  historyEntry: VoiceHistoryEntry;
  workspace: VoiceWorkspacePayload;
  processingStatus: VoiceProcessingStatus;
  processingError?: string | null;
}

export interface VoiceLlmConfigPayload {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
  configured: boolean;
}

export interface VoiceAsrConfigPayload {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
  configured: boolean;
}

export interface VoiceRuntimePermissionsPayload {
  microphone: VoicePermissionState;
  speechRecognition: VoicePermissionState;
  /**
   * macOS 辅助功能权限状态。用于合成 Cmd+V 把识别文本粘贴到前台应用的光标。
   * 非 macOS 恒为 `unsupported`；macOS 下只会是 `authorized` 或 `notDetermined`
   * （系统 API 无法区分「从未授权」与「被显式关闭」）。
   */
  accessibility: VoicePermissionState;
}

export interface VoiceRuntimeStatusPayload {
  supported: boolean;
  enabled: boolean;
  captureState: VoiceCaptureState;
  permissions: VoiceRuntimePermissionsPayload;
  globalShortcut: string;
  triggerKeyCode: number;
  triggerKeyLabel: string;
  triggerKeyKind: string;
  triggerStyle: VoiceTriggerStyle;
  /** 修饰键 mask（CGEventFlags 的 4 个语义位）；0 = 单键。旧版本无此字段时为 undefined。 */
  triggerModifierMask?: number;
  holdTriggerKeyCode: number;
  holdTriggerKeyLabel: string;
  holdTriggerKeyKind: string;
  holdTriggerModifierMask?: number;
  toggleTriggerKeyCode: number;
  toggleTriggerKeyLabel: string;
  toggleTriggerKeyKind: string;
  toggleTriggerModifierMask?: number;
  speechModel: VoiceSpeechModel;
  recognitionLanguage: string;
  processingMode: VoiceProcessingMode;
  processingModeId: string;
  sessionProcessingModeId?: string | null;
  perModeShortcuts: Record<
    string,
    {
      keyCode: number;
      keyLabel: string;
      keyKind: string;
      style: VoiceTriggerStyle;
      modifierMask?: number;
    }
  >;
  liveText: string;
  committedText: string;
  capturedSelectedText: string;
  capturedClipboardText: string;
  capturedTargetBundleId: string;
  capturedTargetAppName: string;
  activeAsrProvider: string;
  activeAsrModel: string;
  detectedAsrLanguage: string;
  detectedAsrEmotion: string;
  lastAsrDurationMs: number | null;
  lastAsrErrorCode: string | null;
  lastError: string | null;
  configPath: string;
  sidecarPath: string | null;
  autoInject: boolean;
}

export interface McpServerSummary {
  name: string;
  transport: McpTransport;
  enabled: boolean;
  sourcePath: string;
  command: string | null;
  args: string[];
  url: string | null;
  headers: Record<string, string>;
  environment: Record<string, string>;
}

export interface McpServerListPayload {
  status: BackendSkeletonStatus;
  items: McpServerSummary[];
  total: number;
  sourcePath: string;
  lastScanAt: number;
}

export interface McpServerMutationPayload {
  status: BackendSkeletonStatus;
  server: McpServerSummary;
  total: number;
  sourcePath: string;
}

export interface McpServerRemovePayload {
  status: BackendSkeletonStatus;
  removedName: string;
  total: number;
  sourcePath: string;
}

export interface InstalledSkillSummary {
  id: string;
  name: string;
  title: string | null;
  summary: string | null;
  relativePath: string;
  directoryPath: string;
  skillFilePath: string;
  updatedAt: number | null;
}

export interface SkillListPayload {
  items: InstalledSkillSummary[];
  total: number;
  rootPath: string;
  lastScanAt: number;
}

export interface SkillBackupSummary {
  id: string;
  skillID: string;
  name: string;
  title: string | null;
  relativePath: string;
  backupPath: string;
  createdAt: number;
}

export interface SkillBackupListPayload {
  items: SkillBackupSummary[];
  total: number;
  rootPath: string;
  lastScanAt: number;
}

export interface SkillImportPayload {
  skill: InstalledSkillSummary;
  replacedExisting: boolean;
  backup: SkillBackupSummary | null;
}

export interface SkillRemovePayload {
  removedSkillID: string;
  backup: SkillBackupSummary;
  remainingInstalledCount: number;
}

export interface SkillRestorePayload {
  restoredSkill: InstalledSkillSummary;
  backup: SkillBackupSummary;
  rollbackBackup: SkillBackupSummary | null;
}

export interface SkillDeleteBackupPayload {
  deletedBackupID: string;
  remainingBackupCount: number;
}

export interface CleanPayload {
  authBackupsRemoved: number;
  registryBackupsRemoved: number;
  staleEntriesRemoved: number;
}

export interface RebuildRegistryPayload {
  accountCount: number;
  activeAccountKey: string | null;
  registryUpdated: boolean;
}

export interface AutoSwitchConfigPayload {
  autoSwitch: AutoSwitchStatusPayload;
}

export interface ApiModePayload {
  api: ApiConfigPayload;
}

export interface ApiProxyTestPayload {
  code: string;
  reachable: boolean;
  statusCode: number | null;
  message: string;
}

export interface ApiProxyDetectPayload {
  found: boolean;
  mode: ApiProxyMode | null;
  url: string | null;
  probe: ApiProxyTestPayload;
}

export interface DaemonRunPayload {
  executedAt: number;
  runOnce: boolean;
  autoSwitchEnabled: boolean;
  serviceState: AutoSwitchRuntimeState;
}

export interface DiagnosePayload {
  paths: AppPathState;
  coreVersion: string;
  platform: { os: string; arch: string };
  registryState: { accountCount: number };
  sessionState: { latestRolloutFound: boolean };
  apiState: {
    usageAttemptCount: number;
    usageSuccessCount: number;
    nameAttemptCount: number;
    nameSuccessCount: number;
    lastUsageFailure: string | null;
    lastUsageFailureAccount: string | null;
    lastNameFailure: string | null;
    lastNameFailureAccount: string | null;
  };
}

export interface CoreEnvelope<T> {
  schemaVersion: number;
  success: boolean;
  code: string;
  message: string;
  warnings: CoreWarning[];
  data: T;
}

export interface BackendSkeletonBoundaryStatus {
  [key: string]: string | boolean;
  repositoryChecked: boolean;
  repositoryPathKnown: boolean;
  platformChecked: boolean;
  coreChecked: boolean;
  effect: "pending" | "no_op" | "unsupported" | string;
}

export interface BackendSkeletonStatus {
  [key: string]: string | boolean | BackendSkeletonBoundaryStatus;
  module: string;
  command: string;
  restored: boolean;
  note: string;
  boundary: BackendSkeletonBoundaryStatus;
}

export interface BootstrapStatePayload {
  writtenAt: number | null;
  snapshotProgressive: CoreSnapshotPayload | null;
  usageAnalytics: UsageAnalyticsPayload | null;
  mcpServers: McpServerListPayload | null;
  installedSkills: SkillListPayload | null;
}

// ---------------------------------------------------------------------------
// 分析数据
// ---------------------------------------------------------------------------

export interface DailyActivity {
  date: string;
  sessionCount: number;
  totalFileSize: number;
  activityLevel: number;
}

export interface TodaySummary {
  sessionCount: number;
  totalFileSize: number;
  activeMinutesEstimate: number;
}

export interface SessionStats {
  totalSessions: number;
  totalSizeBytes: number;
  activeDays: number;
  avgSessionsPerActiveDay: number;
  mostActiveDate: string | null;
  mostActiveCount: number;
}

export interface UsageAnalyticsPayload {
  today: TodaySummary;
  sessionStats: SessionStats;
  dailyActivity: DailyActivity[];
}

export interface QuotaHistoryPoint {
  timestamp: number;
  accountKey: string;
  primaryUsedPercent: number | null;
  secondaryUsedPercent: number | null;
}

export interface QuotaHistoryPayload {
  points: QuotaHistoryPoint[];
}

// ---------------------------------------------------------------------------
// 会话分析（新增 4 个端点）
// ---------------------------------------------------------------------------

export type AnalyticsRange = "today" | "week" | "month";

export interface TokenDaySeries {
  date: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  cumulative: number;
}

export interface TokenAnalyticsPayload {
  totalTokens: number;
  avgPerSession: number;
  inputPct: number;
  outputPct: number;
  reasoningPct: number;
  inputTotal: number;
  outputTotal: number;
  reasoningTotal: number;
  series: TokenDaySeries[];
}

export interface ToolRankItem {
  name: string;
  count: number;
}

export interface ToolAnalyticsPayload {
  totalCalls: number;
  distinctCount: number;
  searchCount: number;
  editCount: number;
  topTools: ToolRankItem[];
}

export interface ChangeDaySeries {
  date: string;
  commands: number;
  writeOps: number;
  readOps: number;
}

export interface ChangeAnalyticsPayload {
  totalCommands: number;
  writeCommands: number;
  readCommands: number;
  otherCommands: number;
  series: ChangeDaySeries[];
}
