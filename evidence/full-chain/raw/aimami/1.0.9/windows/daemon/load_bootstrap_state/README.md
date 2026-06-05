# AiMaMi 1.0.9 Windows — load_bootstrap_state

同步时间: 2026-06-02T10:59:43+08:00
最终结论: strictImplementationUse — read-only, full DTO recovered from JSON builder string refs, dim6 empty

## BootstrapState DTO (完整)
argKeys: []
response: {
  schemaVersion: string,
  success: bool,
  code: string,
  message: string,
  data: {
    executedAt: ISO8601 string,
    runOnce: bool,
    autoSwitchEnabled: bool,
    activeAccountKey: string,
    switchedAccountKey: string,
    pendingSwitchAccountKey: string | null
  }
}

## Gate Leaf: strictImplementationUse
