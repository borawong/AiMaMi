use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct RepositoryPaths {
    pub codex_home: PathBuf,
    pub accounts_dir: PathBuf,
    pub auth_path: PathBuf,
    pub config_path: PathBuf,
    pub sessions_dir: PathBuf,
    pub registry_path: PathBuf,
    pub snapshots_dir: PathBuf,
    pub auth_backups_dir: PathBuf,
    pub registry_backups_dir: PathBuf,
    pub auto_switch_log_path: PathBuf,
    pub app_data_dir: PathBuf,
    pub skill_backups_dir: PathBuf,
    pub settings_path: PathBuf,
    pub bootstrap_cache_path: PathBuf,
    pub global_agents_path: PathBuf,
    pub custom_instructions_dir: PathBuf,
    pub custom_instruction_history_dir: PathBuf,
    pub skills_dir: PathBuf,
    pub launch_agent_path: PathBuf,
}

impl RepositoryPaths {
    pub fn new() -> Self {
        let codex_home = std::env::var("CODEX_HOME")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                dirs::home_dir()
                    .unwrap_or_else(|| PathBuf::from("."))
                    .join(".codex")
            });
        Self::from_codex_home(codex_home)
    }

    pub fn from_codex_home(codex_home: PathBuf) -> Self {
        let accounts_dir = codex_home.join("accounts");
        let app_data_dir = codex_home.join("open-aimami");
        let custom_instructions_dir = app_data_dir.join("custom-instructions");

        Self {
            auth_path: codex_home.join("auth.json"),
            config_path: codex_home.join("config.toml"),
            sessions_dir: codex_home.join("sessions"),
            registry_path: accounts_dir.join("registry.json"),
            snapshots_dir: accounts_dir.join("snapshots"),
            auth_backups_dir: accounts_dir.join("backups"),
            registry_backups_dir: accounts_dir.join("registry-backups"),
            auto_switch_log_path: accounts_dir.join("auto-switch.log"),
            skill_backups_dir: app_data_dir.join("skill-backups"),
            settings_path: app_data_dir.join("settings.json"),
            bootstrap_cache_path: app_data_dir.join("bootstrap-cache.json"),
            global_agents_path: codex_home.join("AGENTS.md"),
            custom_instruction_history_dir: custom_instructions_dir.join("history"),
            custom_instructions_dir,
            skills_dir: codex_home.join("skills"),
            launch_agent_path: resolve_launch_agent_path(),
            accounts_dir,
            app_data_dir,
            codex_home,
        }
    }

    pub fn ensure_app_directories(&self) -> std::io::Result<()> {
        std::fs::create_dir_all(&self.accounts_dir)?;
        std::fs::create_dir_all(&self.snapshots_dir)?;
        std::fs::create_dir_all(&self.auth_backups_dir)?;
        std::fs::create_dir_all(&self.registry_backups_dir)?;
        std::fs::create_dir_all(&self.app_data_dir)?;
        std::fs::create_dir_all(&self.skill_backups_dir)?;
        std::fs::create_dir_all(&self.custom_instructions_dir)?;
        std::fs::create_dir_all(&self.custom_instruction_history_dir)?;
        Ok(())
    }
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
