use std::path::PathBuf;

#[derive(Clone)]
pub struct CodexPaths {
    pub codex_home: PathBuf,
    pub auth_path: PathBuf,
    pub config_path: PathBuf,
    pub session_index_path: PathBuf,
    /// Codex 客户端真正的 session 索引数据库（SQLite）。
    ///
    /// 历史上我们以为 `session_index.jsonl` 是 codex 列表来源，但实测
    /// codex 启动后会**反向覆盖**这个 jsonl 文件，且其线程列表来自
    /// `state_5.sqlite` 的 `threads` 表 —— 我们之前往 jsonl 写恢复记录
    /// 完全无效。所有"恢复 / 是否被 codex 看到" 的判定都必须以这个文件为准。
    pub codex_state_db_path: PathBuf,
    pub sessions_dir: PathBuf,
    pub archived_sessions_dir: PathBuf,
    pub skills_dir: PathBuf,
    pub accounts_dir: PathBuf,
    pub registry_path: PathBuf,
    pub snapshots_dir: PathBuf,
    pub auth_backups_dir: PathBuf,
    pub registry_backups_dir: PathBuf,
    pub auto_switch_log_path: PathBuf,
    pub codexmate_dir: PathBuf,
    pub skill_backups_dir: PathBuf,
    pub quota_history_path: PathBuf,
    pub quota_store_path: PathBuf,
    pub settings_path: PathBuf,
    pub bootstrap_cache_path: PathBuf,
    pub auto_switch_pending_path: PathBuf,
    pub auto_switch_snooze_path: PathBuf,
    pub voice_workspace_path: PathBuf,
    pub voice_runtime_path: PathBuf,
    pub launch_agent_path: PathBuf,
    pub global_agents_path: PathBuf,
    pub custom_instructions_dir: PathBuf,
    pub custom_instruction_history_dir: PathBuf,
}

impl CodexPaths {
    pub fn new() -> Self {
        let codex_home = Self::resolve_codex_home();
        Self::from_home(codex_home)
    }

    pub fn from_home(codex_home: PathBuf) -> Self {
        let accounts_dir = codex_home.join("accounts");
        let codexmate_dir = codex_home.join("codexmate");
        let custom_instructions_dir = codexmate_dir.join("custom-instructions");
        let launch_agent_path = Self::resolve_launch_agent_path();

        // Keep this migration so older installs do not lose local app data.
        let legacy_dir = codex_home.join("legacy-app-data");
        if legacy_dir.exists() && !codexmate_dir.exists() {
            let _ = std::fs::rename(&legacy_dir, &codexmate_dir);
        }

        Self {
            auth_path: codex_home.join("auth.json"),
            config_path: codex_home.join("config.toml"),
            session_index_path: codex_home.join("session_index.jsonl"),
            codex_state_db_path: codex_home.join("state_5.sqlite"),
            sessions_dir: codex_home.join("sessions"),
            archived_sessions_dir: codex_home.join("archived_sessions"),
            skills_dir: codex_home.join("skills"),
            registry_path: accounts_dir.join("registry.json"),
            snapshots_dir: accounts_dir.join("snapshots"),
            auth_backups_dir: accounts_dir.join("backups"),
            registry_backups_dir: accounts_dir.join("registry-backups"),
            auto_switch_log_path: accounts_dir.join("auto-switch.log"),
            skill_backups_dir: codexmate_dir.join("skill-backups"),
            quota_history_path: codexmate_dir.join("quota-history.jsonl"),
            quota_store_path: codexmate_dir.join("quota-store.json"),
            settings_path: codexmate_dir.join("settings.json"),
            bootstrap_cache_path: codexmate_dir.join("bootstrap-cache.json"),
            auto_switch_pending_path: codexmate_dir.join("auto-switch-pending.json"),
            auto_switch_snooze_path: codexmate_dir.join("auto-switch-snooze.json"),
            voice_workspace_path: codexmate_dir.join("voice-workspace.json"),
            voice_runtime_path: codexmate_dir.join("voice-runtime.json"),
            global_agents_path: codex_home.join("AGENTS.md"),
            custom_instruction_history_dir: custom_instructions_dir.join("history"),
            accounts_dir,
            codexmate_dir,
            custom_instructions_dir,
            launch_agent_path,
            codex_home,
        }
    }

    fn resolve_codex_home() -> PathBuf {
        if let Ok(val) = std::env::var("CODEX_HOME") {
            return PathBuf::from(val);
        }
        dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(".codex")
    }

    #[cfg(target_os = "macos")]
    fn resolve_launch_agent_path() -> PathBuf {
        dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("Library/LaunchAgents/dev.aimami.auto-switch.plist")
    }

    #[cfg(not(target_os = "macos"))]
    fn resolve_launch_agent_path() -> PathBuf {
        PathBuf::new()
    }

    pub fn ensure_directories(&self) -> std::io::Result<()> {
        std::fs::create_dir_all(&self.accounts_dir)?;
        std::fs::create_dir_all(&self.snapshots_dir)?;
        std::fs::create_dir_all(&self.auth_backups_dir)?;
        std::fs::create_dir_all(&self.registry_backups_dir)?;
        std::fs::create_dir_all(&self.codexmate_dir)?;
        std::fs::create_dir_all(&self.skill_backups_dir)?;
        std::fs::create_dir_all(&self.custom_instructions_dir)?;
        std::fs::create_dir_all(&self.custom_instruction_history_dir)?;
        Ok(())
    }
}
