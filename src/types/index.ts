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

export interface NotificationClientStatePayload {
  backendStatus: BackendSkeletonStatus;
  deviceId: string;
  notificationsSince: number;
}

export interface MysteryRouteGrant {
  route: string;
  epochMs: number;
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

export type RuntimeExtensionSettingsValue =
  | null
  | boolean
  | number
  | string
  | RuntimeExtensionSettingsValue[]
  | { [key: string]: RuntimeExtensionSettingsValue };

export interface RuntimeExtensionPluginPayload {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  path: string | null;
  enabled: boolean;
}

export interface RuntimeExtensionListPayload {
  backendStatus: BackendSkeletonStatus;
  items: RuntimeExtensionPluginPayload[];
  total: number;
  sourcePath: string;
  lastScanAt: number;
}

export interface RuntimeExtensionTogglePayload {
  backendStatus: BackendSkeletonStatus;
  plugin: RuntimeExtensionPluginPayload;
  items: RuntimeExtensionPluginPayload[];
  total: number;
  sourcePath: string;
  lastScanAt: number;
}

export interface RuntimeExtensionConfigPayload {
  backendStatus: BackendSkeletonStatus;
  id: string;
  settings: RuntimeExtensionSettingsValue;
  sourcePath: string;
  updated: boolean;
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
  effect: "pending" | "no_op" | "platform" | "unsupported";
}

export interface BackendSkeletonStatus {
  [key: string]: string | boolean | BackendSkeletonBoundaryStatus;
  module: string;
  command: string;
  restored: boolean;
  note: string;
  boundary: BackendSkeletonBoundaryStatus;
}

export interface AccountSummaryPayload {
  accountKey: string;
  email?: string | null;
  alias?: string | null;
  accountName?: string | null;
  workspaceName?: string | null;
  profileName?: string | null;
  plan?: string | null;
  active: boolean;
}

export interface AccountSkippedPayload {
  accountKey: string | null;
  reason: string;
  message: string | null;
}

export interface AccountMonitorPayload {
  backendStatus: BackendSkeletonStatus;
}

export interface SwitchPayload {
  backendStatus: BackendSkeletonStatus;
  previousAccountKey: string | null;
  activeAccountKey: string | null;
  activeAccount: AccountSummaryPayload | null;
  authUpdated: boolean;
  registryUpdated: boolean;
}

export interface LogoutPayload {
  backendStatus: BackendSkeletonStatus;
  authRemoved: boolean;
  authBackedUp: boolean;
}

export interface RemovePayload {
  backendStatus: BackendSkeletonStatus;
  removedAccountKeys: string[];
  removedCount: number;
  previousAccountKey: string | null;
}

export interface AccountImportPayload {
  backendStatus: BackendSkeletonStatus;
  importedCount: number;
  importedAccountKeys: string[];
  skipped: AccountSkippedPayload[];
  registryAccountCount: number;
  activeAccountKey: string | null;
}

export interface AccountSessionImportPayload {
  backendStatus: BackendSkeletonStatus;
  imported: boolean;
  accountKey: string | null;
  email: string | null;
  plan: string | null;
  snapshotPath: string | null;
  registryAccountCount: number;
  activeAccountKey: string | null;
  refreshTokenPlaceholder: boolean;
}

export interface AccountExportPayload {
  backendStatus: BackendSkeletonStatus;
  targetPath: string;
  accountCount: number;
  exportedAt: string | null;
  skipped: AccountSkippedPayload[];
}

export interface AccountImportPreviewEntry {
  accountKey: string;
  email?: string | null;
  plan?: string | null;
  authMode?: string | null;
  workspaceName?: string | null;
  profileName?: string | null;
  conflict: boolean;
  isActiveLocally: boolean;
}

export interface AccountImportPreviewPayload {
  backendStatus: BackendSkeletonStatus;
  filePath: string;
  schemaVersion: number;
  kind: string;
  appVersion: string | null;
  exportedAt: string | null;
  exportedHostname: string | null;
  entries: AccountImportPreviewEntry[];
  accountCount: number;
  conflictCount: number;
}

export interface SessionRecordPayload {
  id: string;
  threadName: string;
  projectPath: string | null;
  projectName: string | null;
  parentSessionId: string | null;
  updatedAt: number;
  createdAt: number | null;
  fileSize: number;
  isConversationThread: boolean;
  projectPathMissing: boolean;
  agentNickname: string | null;
  agentRole: string | null;
}

export interface SessionsListPayload {
  backendStatus: BackendSkeletonStatus;
  items: SessionRecordPayload[];
  total: number;
  sourcePath: string;
  lastScanAt: number;
}

export interface SessionsDeletePayload {
  backendStatus: BackendSkeletonStatus;
  requestedIds: string[];
  deletedIds: string[];
  skippedIds: string[];
  deletedCount: number;
  sourcePath: string;
}

export interface BootstrapStatePayload {
  backendStatus: BackendSkeletonStatus;
  executedAt: string | null;
  runOnce: boolean;
  autoSwitchEnabled: boolean;
  activeAccountKey: string | null;
  switchedAccountKey: string | null;
  pendingSwitchAccountKey: string | null;
}

export interface PendingAutoSwitchStatePayload {
  backendStatus: BackendSkeletonStatus;
  currentAccountKey: string;
  candidateAccountKey: string;
  dismissedAt: string | null;
}

export interface RelayProviderPayload {
  backendStatus?: BackendSkeletonStatus;
  id: string;
  ide: string;
  name: string;
  baseUrl: string;
  apiKey?: string | null;
  apiKeyStored: boolean;
  model: string;
  wireApi: string;
  extraHeaders: string | Record<string, string> | null;
  network: string;
  active: boolean;
  healthScore: number | null;
  latencyMs: number | null;
  lastTestedAt: number | null;
  updatedAt?: number | null;
  lastError: string | null;
  errorMessage?: string | null;
  modelsSample?: string[];
}

export interface RelayProxyPayload {
  backendStatus?: BackendSkeletonStatus;
  running: boolean;
  port: number;
  baseUrl: string;
  codexBaseUrl: string;
  lastError: string | null;
}

export type RelayActiveByIdePayload = Record<string, string[]>;

export interface RelayActivePayload {
  backendStatus?: BackendSkeletonStatus;
  enabled: boolean;
  activeProvider: string | null;
  activeProviderId: string | null;
  ide: string;
}

export interface RelayStatePayload {
  backendStatus?: BackendSkeletonStatus;
  schemaVersion: number;
  providers: RelayProviderPayload[];
  activeByIde: RelayActiveByIdePayload;
  proxy: RelayProxyPayload;
  codexRouterEnabled: boolean;
  blockOfficialPassthrough: boolean;
  lastCodexRoute: string | null;
  enabled?: boolean;
  activeProviderId?: string | null;
  proxyStatus?: RelayProxyPayload;
  sourcePath?: string;
}

export interface RelayRouterMigrationPayload {
  action: string;
  migratedCount: number;
  rolledBackCount: number;
  skippedCount: number;
  targetProvider: string | null;
  targetModel: string | null;
  manifestPath: string | null;
}

export interface RelayRouterTogglePayload {
  backendStatus?: BackendSkeletonStatus;
  state: RelayStatePayload;
  migration: RelayRouterMigrationPayload;
  codexLaunchError: string | null;
}

export interface RelayTestPayload {
  backendStatus?: BackendSkeletonStatus;
  ok: boolean;
  health?: number;
  latencyMs: number;
  statusCode?: number | null;
  message?: string | null;
  errorMessage: string | null;
  models: string[];
}

export interface RelayExportPayload {
  backendStatus?: BackendSkeletonStatus;
  schemaVersion?: number;
  exportedBy?: string;
  exportedAt?: string | null;
  filePath: string;
  includeApiKeys: boolean;
  providerCount: number;
  providers?: RelayProviderPayload[];
}

export interface RelayImportSkipPayload {
  id: string | null;
  reason: string;
  message: string | null;
}

export interface RelayImportPayload {
  backendStatus?: BackendSkeletonStatus;
  filePath: string;
  importedCount: number;
  skippedCount: number;
  total: number;
  skipped: RelayImportSkipPayload[];
}

export interface RelayPassthroughAuditEntry {
  timestamp: string;
  event: string;
  direction: string;
  providerId: string | null;
  model: string | null;
  blocked: boolean;
  message: string | null;
}

export interface RelayDiagnosticIssuePayload {
  id: string;
  title?: string;
  label?: string;
  message: string;
  detail?: string | null;
  severity: string;
  status?: string;
  fixable: boolean;
}

export interface RelayDiagnosticPayload {
  backendStatus?: BackendSkeletonStatus;
  ok: boolean;
  codexProviderCount: number;
  catalogPath: string | null;
  catalogExists: boolean;
  configTomlHasRouter: boolean;
  configTomlHasCatalog: boolean;
  config_toml_has_router?: boolean;
  config_toml_has_catalog?: boolean;
  userTopLevelProfile: string | null;
  configStaleReason: string | null;
  threadMigrationExists: boolean;
  routerEnabled: boolean;
  hasIssues: boolean;
  issues: RelayDiagnosticIssuePayload[];
  items: RelayDiagnosticIssuePayload[];
  summary: string;
}

export interface RelayRouterIssueFixPayload {
  backendStatus?: BackendSkeletonStatus;
  itemId: string;
  issueId: string;
  fixed: boolean;
  requiresRestart: boolean;
  message: string;
  details: string | null;
  diagnostics: RelayDiagnosticPayload;
}

// ---------------------------------------------------------------------------
// 分析数据
// ---------------------------------------------------------------------------

export interface DailyActivity {
  date: string;
  sessionCount: number;
  totalFileSize: number;
  activityLevel: number;
  activeMinutes?: number;
  tokens?: number;
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
  backendStatus?: BackendSkeletonStatus;
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
  backendStatus?: BackendSkeletonStatus;
  accountKey?: string | null;
  points: QuotaHistoryPoint[];
}

// ---------------------------------------------------------------------------
// 会话分析（新增 4 个端点）
// ---------------------------------------------------------------------------

export type AnalyticsRange = "today" | "week" | "month";

export interface SessionAnalyticsSeriesPoint {
  date: string;
  count: number;
}

export interface SessionAnalyticsPayload {
  backendStatus: BackendSkeletonStatus;
  range: AnalyticsRange;
  totalSessions: number;
  avgTurns: number;
  activeDays: number;
  series: SessionAnalyticsSeriesPoint[];
}

export interface TokenDaySeries {
  date: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  cumulative: number;
}

export interface TokenAnalyticsPayload {
  backendStatus?: BackendSkeletonStatus;
  range: AnalyticsRange;
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
  backendStatus?: BackendSkeletonStatus;
  range: AnalyticsRange;
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
  backendStatus?: BackendSkeletonStatus;
  range: AnalyticsRange;
  totalCommands: number;
  writeCommands: number;
  readCommands: number;
  otherCommands: number;
  series: ChangeDaySeries[];
}
