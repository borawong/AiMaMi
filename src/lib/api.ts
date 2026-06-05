import {
  accountsService,
  analyticsService,
  customInstructionsService,
  daemonAutoswitchService,
  maintenanceService,
  mcpService,
  relayService,
  runtimeExtensionsService,
  sessionsService,
  settingsService,
  skillsService,
  systemService,
  voiceService,
  type ApplyCustomInstructionParams,
  type UpsertMcpServerInput,
} from "@/services";

function normalizeCustomInstructionApply(
  input: ApplyCustomInstructionParams | string,
  content?: string,
): ApplyCustomInstructionParams {
  if (typeof input !== "string") return input;
  return {
    content: content ?? "",
    templateCode: input,
    source: "legacy-adapter",
  };
}

function asStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeMcpServerInput(
  input: UpsertMcpServerInput | string,
  config?: Record<string, unknown>,
): UpsertMcpServerInput {
  if (typeof input !== "string") return input;

  const legacyConfig =
    config?.config && typeof config.config === "object" && !Array.isArray(config.config)
      ? (config.config as Record<string, unknown>)
      : config ?? {};

  return {
    name: input,
    transport:
      (legacyConfig.transport as UpsertMcpServerInput["transport"] | undefined) ??
      "stdio",
    enabled:
      typeof legacyConfig.enabled === "boolean" ? legacyConfig.enabled : undefined,
    command: asOptionalString(legacyConfig.command),
    args: asStringArray(legacyConfig.args),
    url: asOptionalString(legacyConfig.url),
    headers: asStringRecord(legacyConfig.headers),
    environment: asStringRecord(legacyConfig.environment),
  };
}

export const api = {
  loadSnapshot: systemService.loadSnapshot,
  refreshUsageSnapshot: systemService.refreshUsageSnapshot,
  focusMainWindow: systemService.focusMainWindow,
  getDeviceId: systemService.getDeviceId,
  getNotificationClientState: systemService.getNotificationClientState,
  getMysteryUnlockGrants: systemService.getMysteryUnlockGrants,
  mergeMysteryUnlockGrants: systemService.mergeMysteryUnlockGrants,

  beginAddAccountAttachMonitor: accountsService.beginAddAccountAttachMonitor,
  switchAccount: accountsService.switchAccount,
  switchAccountAndRestartCodex: accountsService.switchAccountAndRestartCodex,
  removeAccounts: accountsService.removeAccounts,
  logout: accountsService.logout,
  importChatGptSessionAccount: accountsService.importChatGptSessionAccount,
  exportAccountsToFile: accountsService.exportAccountsToFile,
  previewAccountImport: accountsService.previewAccountImport,
  importAccountsFromFile: accountsService.importAccountsFromFile,

  loadSessions: sessionsService.loadSessions,
  deleteSessions: sessionsService.deleteSessions,

  loadUsageAnalytics: analyticsService.loadUsageAnalytics,
  loadQuotaHistory: analyticsService.loadQuotaHistory,
  loadSessionAnalytics: analyticsService.loadSessionAnalytics,
  loadTokenAnalytics: analyticsService.loadTokenAnalytics,
  loadToolAnalytics: analyticsService.loadToolAnalytics,
  loadChangeAnalytics: analyticsService.loadChangeAnalytics,

  setAutoSwitch: daemonAutoswitchService.setAutoSwitch,
  configureAutoSwitch: daemonAutoswitchService.configureAutoSwitch,
  loadBootstrapState: daemonAutoswitchService.loadBootstrapState,
  loadPendingAutoSwitch: daemonAutoswitchService.loadPendingAutoSwitch,
  dismissPendingAutoSwitch: daemonAutoswitchService.dismissPendingAutoSwitch,
  confirmPendingAutoSwitch: daemonAutoswitchService.confirmPendingAutoSwitch,
  confirmPendingAutoSwitchAndRestartCodex:
    daemonAutoswitchService.confirmPendingAutoSwitchAndRestartCodex,
  runDaemonOnce: daemonAutoswitchService.runDaemonOnce,

  setApiProxyConfig: settingsService.setApiProxyConfig,
  getUsageRefreshInterval: settingsService.getUsageRefreshInterval,
  setUsageRefreshInterval: settingsService.setUsageRefreshInterval,
  testApiProxyConfig: settingsService.testApiProxyConfig,
  detectApiProxyConfig: settingsService.detectApiProxyConfig,
  checkUpdateInstallability: settingsService.checkUpdateInstallability,
  gracefulRestartForUpdate: settingsService.gracefulRestartForUpdate,
  checkRuntimeUpdate: settingsService.checkRuntimeUpdate,
  installRuntimeUpdate: settingsService.installRuntimeUpdate,
  dismissRuntimeUpdate: settingsService.dismissRuntimeUpdate,
  getAppVersion: settingsService.getAppVersion,
  hasNotch: settingsService.hasNotch,
  getHotspotEnabled: settingsService.getHotspotEnabled,
  setHotspotEnabled: settingsService.setHotspotEnabled,
  hotspotReady: settingsService.hotspotReady,
  getImageCompat: settingsService.getImageCompat,
  setImageCompat: settingsService.setImageCompat,

  clean: maintenanceService.clean,
  rebuildRegistry: maintenanceService.rebuildRegistry,
  diagnose: maintenanceService.diagnose,
  restartCodex: maintenanceService.restartCodex,
  forceKillCodex: maintenanceService.forceKillCodex,
  resetCodexConfig: maintenanceService.resetCodexConfig,
  openPath: maintenanceService.openPath,
  getSystemInfo: maintenanceService.getSystemInfo,

  loadMcpServers: mcpService.loadServers,
  upsertMcpServer: (
    input: UpsertMcpServerInput | string,
    config?: Record<string, unknown>,
  ) => mcpService.upsertServer(normalizeMcpServerInput(input, config)),
  setMcpServerEnabled: mcpService.setServerEnabled,
  removeMcpServer: mcpService.removeServer,

  loadInstalledSkills: skillsService.loadInstalled,
  loadSkillBackups: skillsService.loadBackups,
  importSkill: skillsService.importSkill,
  pickSkillDirectory: skillsService.pickSkillDirectory,
  removeSkill: skillsService.removeSkill,
  restoreSkillBackup: skillsService.restoreBackup,
  deleteSkillBackup: skillsService.deleteBackup,

  loadCustomInstructionState: customInstructionsService.loadState,
  previewCustomInstructionApply: (input: string, content?: string) =>
    customInstructionsService.previewApply(content ?? input),
  applyCustomInstruction: (
    input: ApplyCustomInstructionParams | string,
    content?: string,
  ) =>
    customInstructionsService.apply(
      normalizeCustomInstructionApply(input, content),
    ),
  clearCustomInstructionBlock: customInstructionsService.clearBlock,
  rollbackCustomInstruction: customInstructionsService.rollback,

  loadRelayState: relayService.loadState,
  upsertRelayProvider: relayService.upsert,
  deleteRelayProvider: relayService.delete,
  activateRelayProvider: relayService.activate,
  deactivateRelayProvider: relayService.deactivate,
  setRelayProviderNetwork: relayService.setNetwork,
  testRelayProvider: relayService.test,
  testRelayDraft: relayService.testDraft,
  fetchRelayModelsDraft: relayService.fetchModelsDraft,
  getRelayActive: relayService.getActive,
  getRelayProxyStatus: relayService.getProxyStatus,
  setCodexRouterEnabled: relayService.setCodexRouterEnabled,
  setBlockOfficialPassthrough: relayService.setBlockOfficialPassthrough,
  getPassthroughAuditLog: relayService.getPassthroughAuditLog,
  exportRelayConfig: relayService.exportConfig,
  importRelayConfig: relayService.importConfig,
  runCodexRouterDiagnostics: relayService.runCodexRouterDiagnostics,
  diagnoseCodexRouter: relayService.diagnoseCodexRouter,
  fixCodexRouterIssue: relayService.fixCodexRouterIssue,

  listPlugins: runtimeExtensionsService.listPlugins,
  togglePlugin: runtimeExtensionsService.togglePlugin,
  getPluginConfig: runtimeExtensionsService.getPluginConfig,
  updatePluginConfig: runtimeExtensionsService.updatePluginConfig,

  loadVoiceWorkspace: voiceService.loadWorkspace,
  upsertVoiceTemplate: voiceService.upsertTemplate,
  removeVoiceTemplate: voiceService.removeTemplate,
  upsertVoiceVocabulary: voiceService.upsertVocabulary,
  removeVoiceVocabulary: voiceService.removeVocabulary,
  replaceVoiceVocabularyKind: voiceService.replaceVocabularyKind,
  removeVoiceVocabularyAppScope: voiceService.removeVocabularyAppScope,
  upsertVoiceVocabularyAppScope: voiceService.upsertVocabularyAppScope,
  resolveVoiceVocabularyAppInfo: voiceService.resolveVocabularyAppInfo,
  generateVoicePrompt: voiceService.generatePrompt,
  loadVoiceLlmConfig: voiceService.loadLlmConfig,
  saveVoiceLlmConfig: voiceService.saveLlmConfig,
  testVoiceLlmConfig: voiceService.testLlmConfig,
  loadVoiceAsrConfig: voiceService.loadAsrConfig,
  saveVoiceAsrConfig: voiceService.saveAsrConfig,
  testVoiceAsrConfig: voiceService.testAsrConfig,
  removeVoiceHistoryEntry: voiceService.removeHistoryEntry,
  loadVoiceRuntimeStatus: voiceService.loadRuntimeStatus,
  requestVoicePermissions: voiceService.requestPermissions,
  requestAccessibilityPermission: voiceService.requestAccessibilityPermission,
  setVoiceGlobalShortcut: voiceService.setGlobalShortcut,
  captureVoiceTriggerKey: voiceService.captureTriggerKey,
  cancelVoiceTriggerCapture: voiceService.cancelTriggerCapture,
  setVoiceTriggerListenerSuppressed:
    voiceService.setTriggerListenerSuppressed,
  setVoiceTriggerKey: voiceService.setTriggerKey,
  setVoiceTriggerBindings: voiceService.setTriggerBindings,
  updateVoiceRuntimeSettings: voiceService.updateRuntimeSettings,
  setVoiceProcessingModeId: voiceService.setProcessingModeId,
  startVoiceCapture: voiceService.startCapture,
  stopVoiceCapture: voiceService.stopCapture,
  injectVoiceText: voiceService.injectText,
  showVoiceSearchOverlay: voiceService.showSearchOverlay,
  setVoiceModeShortcut: voiceService.setModeShortcut,
  removeVoiceModeShortcut: voiceService.removeModeShortcut,
};
