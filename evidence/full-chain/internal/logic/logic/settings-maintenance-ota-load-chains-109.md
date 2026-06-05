# DISTILLED: Settings / Maintenance / OTA Page Load Chains — AiMaMi 1.0.9

**session:** <audit-session>  
**machine:** <workstation>  
**produced:** 2026-06-03  
**angle:** 2+4 frontend — no IDA; pure JS bundle read  
**source archives:**
- `raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/settings-page-CHeElwco.js` (9 784 B)
- `raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/maintenance-page-j6kXR210.js` (15 367 B)
- `raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/index-CL22l5v8.js` (656 775 B, main bundle — invoke wrappers + update hook + router)
- `raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/app-C4jGp0lC.js` (1 225 B, tauri-plugin-app wrappers)

**authoritative_producer:** <workstation>  
**gate:** consumerStartReady (frontend-only, no IDA backend confirmation)

---

## Router / Nav Layout

```
Ww nav array (in index-CL22l5v8.js):
  overview | accounts | sessions | relayModel | mcp | skills | plugins | maintenance | settings
  
Route → page component (lazy import):
  "maintenance" → lazy(import("maintenance-page-j6kXR210.js")) → MaintenancePage
  "settings"    → lazy(import("settings-page-CHeElwco.js"))    → SettingsPage
  [no dedicated OTA route] — OTA/update state lives in the root dD() layout component
```

The root `dD()` component holds global state including `z = NP()` (the update hook). OTA is **not a separate page/route** — it surfaces as:
1. A "Check for Update" button on the Settings page (passed as `onCheckUpdate: z.checkForUpdate` prop)
2. An update banner/dialog driven by `z.status` in the root layout (status: idle/checking/available/downloading/installing/error)

---

## Global Invoke API

All Tauri invocations go through the central async function `G(commandName, args?)` in `index-CL22l5v8.js`. `G` is the bridge:

```js
async function G(t, e) {
  if (Di() /* isTauri */) {
    const { invoke } = await import("@tauri-apps/api").then(…);
    return invoke(t, e);
  }
  return pf(t, e);   // dev/mock fallback
}
```

The `We` object exposes all IPC wrappers used by pages:

```js
const We = {
  loadSnapshot:               (localOnly=false) => G("load_snapshot",     { localOnly }),
  refreshUsageSnapshot:       ()                => G("refresh_usage_snapshot"),
  clean:                      ()                => G("clean"),
  forceKillCodex:             ()                => G("force_kill_codex"),
  resetCodexConfig:           ()                => G("reset_codex_config"),
  restartCodex:               ()                => G("restart_codex"),
  getImageCompat:             ()                => G("get_image_compat"),
  setImageCompat:             (enabled)         => G("set_image_compat",  { enabled }),
  hasNotch:                   ()                => G("has_notch"),
  getHotspotEnabled:          ()                => G("get_hotspot_enabled"),
  setHotspotEnabled:          (enabled)         => G("set_hotspot_enabled",   { enabled }),
  setAutoSwitch:              (enabled)         => G("set_auto_switch",    { enabled }),
  configureAutoSwitch:        (t5h, tWeekly)    => G("configure_auto_switch", { threshold5hPercent: t5h, thresholdWeeklyPercent: tWeekly }),
  getUsageRefreshInterval:    ()                => G("get_usage_refresh_interval"),
  setUsageRefreshInterval:    (interval)        => G("set_usage_refresh_interval", { interval }),
  setApiProxyConfig:          (mode, url)       => G("set_api_proxy_config",  { mode, url }),
  testApiProxyConfig:         (mode, url)       => G("test_api_proxy_config", { mode, url }),
  detectApiProxyConfig:       ()                => G("detect_api_proxy_config"),
  checkUpdateInstallability:  ()                => G("check_update_installability"),
  getMysteryUnlockGrants:     ()                => G("get_mystery_unlock_grants"),
  mergeMysteryUnlockGrants:   (grants)          => G("merge_mystery_unlock_grants", { grants }),
  // diagnostic commands invoked directly in maintenance page:
  // run_codex_router_diagnostics — no-args
  // fix_codex_router_issue       — { itemId: string | "all" }
  // graceful_restart_for_update  — no-args (post-install restart)
}
```

---

## Page 1: Settings Page

**Route:** `"settings"`  
**Component:** `SettingsPage` in `settings-page-CHeElwco.js`  
**Props from root:** `{ theme, onThemeChange, accent, setAccent, heatmap, setHeatmap, language, setLanguage, refreshInterval, setRefreshInterval, onCheckUpdate: z.checkForUpdate, onRefreshUsageStatus }`

### Default Load Chain (mount order)

1. **`useQuery(["snapshot", …], () => We.loadSnapshot(false))`**
   - Command: `load_snapshot` · args: `{ localOnly: false }`
   - Response path consumed: `data.data.status` (autoSwitch, api.proxy fields)
   - staleTime: Infinity, refetchOnMount: false → **one-time load, cached**

2. **`useQuery(["has-notch"], () => We.hasNotch(), { enabled: isTauri })`**
   - Command: `has_notch` · no args
   - Response: boolean — controls hotspot row visibility

3. **`useQuery(["hotspot-enabled"], () => We.getHotspotEnabled(), { enabled: isTauri && hasNotch })`**
   - Command: `get_hotspot_enabled` · no args
   - Response: boolean — hotspot toggle current state
   - **Only fires if `has_notch` returned true**

4. **`useEffect → dynamic import → app.getVersion()`**
   - Lazy import of `app-C4jGp0lC.js`, calls `getVersion()`
   - Underlying command: `plugin:app|version` (Tauri plugin-app channel, not a custom invoke)
   - Sets version string displayed in "About" section

5. **Refresh interval init (useEffect, `_P()` hook):**
   - `We.getUsageRefreshInterval()` → command: `get_usage_refresh_interval`
   - Loads saved interval on mount; used to populate the refresh interval picker

### User-Triggered Chains

| User action | invoke sequence | args |
|---|---|---|
| Toggle autoSwitch OFF | `We.setAutoSwitch(false)` | `{ enabled: false }` → `set_auto_switch` |
| Save autoSwitch thresholds (enable=true) | `We.setAutoSwitch(true)` then `We.configureAutoSwitch(t5h, tWeekly)` | 1. `{ enabled: true }` · 2. `{ threshold5hPercent, thresholdWeeklyPercent }` |
| Save thresholds only (already enabled) | `We.configureAutoSwitch(t5h, tWeekly)` | `{ threshold5hPercent, thresholdWeeklyPercent }` |
| Toggle hotspot | `We.setHotspotEnabled(bool)` | `{ enabled: bool }` → `set_hotspot_enabled` |
| Change refresh interval | `We.setUsageRefreshInterval(interval)` | `{ interval: string }` → `set_usage_refresh_interval` |
| Click "Edit" proxy button | opens `ProxyConfigDialog` → on save: `We.setApiProxyConfig(mode, url)` | `{ mode, url }` → `set_api_proxy_config` |
| Click "Check for Update" | calls `onCheckUpdate` prop = `z.checkForUpdate` (see OTA section) | — |

### DTO Shapes

**`load_snapshot` response** (path `data.data.status`):
```ts
{
  autoSwitch: {
    enabled: boolean,
    threshold5hPercent: number,       // default 15
    thresholdWeeklyPercent: number,   // default 10
  },
  api: {
    proxy: {
      mode: "direct" | "manual" | "system",
      url: string | null,
    }
  }
}
```

**`set_api_proxy_config` args:**
```ts
{ mode: "direct" | "manual" | "system", url: string | null }
```

**Error branches:**
- `set_auto_switch` failure → `onError` rolls back optimistic update via `setQueryData`
- `get_hotspot_enabled` / `has_notch` failures → silently ignored (optional feature)
- `get_usage_refresh_interval` failure → silently ignored (interval stays at UI default)

---

## Page 2: Maintenance Page

**Route:** `"maintenance"`  
**Component:** `MaintenancePage` in `maintenance-page-j6kXR210.js`  
**Props from root:** none (standalone)

### Default Load Chain (mount order)

1. **`useQuery(["imageCompat"], () => We.getImageCompat().then(r => r.data.enabled))`**
   - Command: `get_image_compat` · no args
   - Response consumed: `data.enabled` (boolean) — current state of image-compat toggle

2. **`useRelayProviders()` hook (from `use-relay-providers-BNphfsn5.js`)**
   - Reads `codexRouterEnabled` from relay provider state
   - Used to disable the "Reset Config" button when codex router is active
   - Underlying query: not directly an invoke — reads shared relay provider state

No polling on mount. No auto-refresh. Page is purely on-demand action triggers.

### User-Triggered Chains

| User action | invoke sequence | args | notes |
|---|---|---|---|
| Click "Diagnose" | `invoke("run_codex_router_diagnostics")` | none | opens DiagnosticDialog; fires immediately on dialog open too |
| Click "Fix" on item | `invoke("fix_codex_router_issue", { itemId: r.id })` then `invoke("run_codex_router_diagnostics")` | `{ itemId: string }` | two-step: fix then re-diagnose |
| Click "Fix All" | `invoke("fix_codex_router_issue", { itemId: "all" })` then `invoke("run_codex_router_diagnostics")` | `{ itemId: "all" }` | two-step: fix-all then re-diagnose |
| Click "Clean" | `We.clean()` → `clean` | none | removes authBackups + registryBackups + stale entries |
| Click "Force Kill Codex" | `We.forceKillCodex()` → `force_kill_codex` | none | kills running Codex processes |
| Click "Reset Config" | confirmation dialog → `We.resetCodexConfig()` → `reset_codex_config` | none | **disabled if codexRouterEnabled** |
| Toggle "Image Compat" | `We.setImageCompat(!currentState)` → `set_image_compat` | `{ enabled: bool }` | toggle |
| Click "Restart Codex" | confirmation dialog → `We.restartCodex()` → `restart_codex` | none | destructive, confirm required |

### DTO Shapes

**`run_codex_router_diagnostics` response:**
```ts
{
  data: {
    hasIssues: boolean,
    items: Array<{
      id: string,
      label: string,
      status: "ok" | "warning" | "error",
      fixable: boolean,
      detail?: string,
    }>
  }
}
```

**`fix_codex_router_issue` response:**
```ts
{
  data: {
    details: string[]   // log lines shown in fix-log area
  }
}
```

**`clean` response:**
```ts
{
  data: {
    authBackupsRemoved: number,
    registryBackupsRemoved: number,
    staleEntriesRemoved: number,
  }
}
```

**`force_kill_codex` response:**
```ts
{
  data: {
    killedCount: number,
    processes: string[],   // process names/ids
  }
}
```

**`reset_codex_config` response:**
```ts
{
  data: {
    configCleared: boolean,
  }
}
```

**Error branches:**
- All mutations: `onError` → displays error toast with string message in result panel (auto-dismisses after 5 s)
- DiagnosticDialog: `catch` → sets error string; displayed in red panel

---

## Page 3: OTA / Update (embedded in root layout, no dedicated route)

**Component:** update hook `NP()` in `index-CL22l5v8.js`, status wired into root `dD()` layout  
**Route:** N/A — surfaces via Settings page "Check for Update" button + root banner when `status === "available" | "downloading" | "installing" | "error"`

### Default Load Chain (mount order — root layout)

1. **`useEffect` auto-check on mount (1500 ms delay):**
   - Checks `Di()` (isTauri guard)
   - After 1.5 s: calls `checkForUpdate()` which uses `plugin:updater|check` (Tauri updater plugin, not a custom `invoke`)
   - Underlying: lazy import of `index-CJQqyjVG.js` (updater module) → calls `check()`
   - If update available: sets `updateInfo: { version, currentVersion, body }`, `status: "available"`
   - If no update: `status: "idle"`
   - On error: `status: "error"`, sets error message

### User-Triggered Chains

| User action | invoke sequence | args | notes |
|---|---|---|---|
| Click "Check for Update" in Settings | `checkForUpdate()` → `plugin:updater\|check` (Tauri updater plugin) | none | manual trigger; same as auto-check |
| Click "Install Update" | 1. `G("check_update_installability")` 2. `update.downloadAndInstall(progressCb)` 3. `G("graceful_restart_for_update")` | none | three-step: gate check → download+install → restart |

### DTO Shapes

**`check_update_installability` response:**
```ts
{
  canInstall: boolean,
  code?: "app_translocation" | "read_only_location" | string,
}
```

**`downloadAndInstall` progress events:**
```ts
// event types from Tauri updater plugin:
{ event: "Started",  data: { contentLength: number } }
{ event: "Progress", data: { chunkLength: number } }
{ event: "Finished" }
```

**`update.check()` return (Tauri updater):**
```ts
{
  version: string,
  currentVersion: string,
  body: string | null,
} | null  // null = no update available
```

**Error branches:**
- `check_update_installability` returns `canInstall=false` → shows blocked error (translocation / read-only / generic)
- `downloadAndInstall` throws → `DP()` error classifier: translocation/read-only → specific msg; network → `update.otaNetworkFailed`; else raw string
- Network errors detected by: "error sending request" / "connection" / "timeout" / "timed out" / "dns" / "network" / "certificate" / "tls"

---

## Summary Table: Page → Default Load → Command → DTO

| page | default load invokes (mount order) | user-triggered invokes |
|---|---|---|
| Settings | `load_snapshot(localOnly=false)` → `has_notch` → `get_hotspot_enabled`* → `plugin:app\|version` → `get_usage_refresh_interval` | `set_auto_switch` · `configure_auto_switch` · `set_hotspot_enabled` · `set_usage_refresh_interval` · `set_api_proxy_config` · `checkForUpdate` |
| Maintenance | `get_image_compat` | `run_codex_router_diagnostics` · `fix_codex_router_issue` · `clean` · `force_kill_codex` · `reset_codex_config` · `set_image_compat` · `restart_codex` |
| OTA (root) | `plugin:updater\|check` (1500 ms delay, auto) | manual `check` · `check_update_installability` + `downloadAndInstall` + `graceful_restart_for_update` |

*`get_hotspot_enabled` only fires when `has_notch = true`

---

## Confidence & Gaps

- **Confidence:** HIGH for command names and arg shapes (direct JS bundle read, no source maps needed)
- **load_snapshot DTO:** CONFIRMED from mock handler in index bundle (`pf` function handles `"load_snapshot"` case)
- **OTA plugin:** uses Tauri built-in `plugin:updater` — not a custom Rust command; `check_update_installability` and `graceful_restart_for_update` ARE custom commands
- **`use-relay-providers-BNphfsn5.js` query:** not fully traced (separate bundle); provides `codexRouterEnabled` to maintenance page
- **Backend Rust owners:** not traced in this angle-2 pass; `run_codex_router_diagnostics`, `fix_codex_router_issue`, `clean`, `force_kill_codex`, `reset_codex_config`, `restart_codex`, `graceful_restart_for_update` are all unconfirmed on backend side
