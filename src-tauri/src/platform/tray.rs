/// 中文职责说明：托盘平台安装入口，真实托盘重建只能保留在 platform 层。
pub(crate) fn install(_app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    Ok(())
}
