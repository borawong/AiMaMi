use reqwest::blocking::Client;
use std::fs;
use std::process::Command;
use std::time::Duration;

pub fn detect_system_proxy_candidates() -> Vec<String> {
    #[cfg(target_os = "macos")]
    {
        return detect_macos_system_proxy_candidates();
    }

    #[cfg(target_os = "windows")]
    {
        return detect_windows_system_proxy_candidates();
    }

    #[allow(unreachable_code)]
    Vec::new()
}

#[cfg(target_os = "macos")]
fn detect_macos_system_proxy_candidates() -> Vec<String> {
    let output = Command::new("scutil").arg("--proxy").output();
    let Ok(output) = output else {
        return Vec::new();
    };
    if !output.status.success() {
        return Vec::new();
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let pairs = parse_scutil_proxy_pairs(&stdout);
    let mut candidates = Vec::new();

    if is_enabled(&pairs, "HTTPEnable") {
        push_url(
            &mut candidates,
            "http",
            pairs.get("HTTPProxy").map(String::as_str),
            pairs.get("HTTPPort").map(String::as_str),
        );
    }

    if is_enabled(&pairs, "HTTPSEnable") {
        push_url(
            &mut candidates,
            "http",
            pairs.get("HTTPSProxy").map(String::as_str),
            pairs.get("HTTPSPort").map(String::as_str),
        );
    }

    if is_enabled(&pairs, "SOCKSEnable") {
        push_url(
            &mut candidates,
            "socks5",
            pairs.get("SOCKSProxy").map(String::as_str),
            pairs.get("SOCKSPort").map(String::as_str),
        );
    }

    if is_enabled(&pairs, "ProxyAutoConfigEnable") {
        if let Some(url) = pairs.get("ProxyAutoConfigURLString") {
            candidates.extend(parse_pac_candidates(url));
        }
    }

    dedupe(candidates)
}

#[cfg(target_os = "macos")]
fn parse_scutil_proxy_pairs(stdout: &str) -> std::collections::HashMap<String, String> {
    let mut pairs = std::collections::HashMap::new();
    for line in stdout.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with('<') || trimmed == "{" || trimmed == "}" || trimmed.is_empty() {
            continue;
        }
        let Some((key, value)) = trimmed.split_once(':') else {
            continue;
        };
        pairs.insert(key.trim().to_string(), value.trim().to_string());
    }
    pairs
}

#[cfg(target_os = "macos")]
fn is_enabled(pairs: &std::collections::HashMap<String, String>, key: &str) -> bool {
    matches!(pairs.get(key).map(String::as_str), Some("1"))
}

#[cfg(target_os = "windows")]
fn detect_windows_system_proxy_candidates() -> Vec<String> {
    let mut candidates = Vec::new();

    if let Some(proxy_server) = read_windows_registry_proxy_server() {
        candidates.extend(parse_windows_proxy_server(&proxy_server));
    }

    if let Some(auto_config_url) = read_windows_registry_auto_config_url() {
        candidates.extend(parse_pac_candidates(&auto_config_url));
    }

    if let Some(winhttp_proxy) = read_windows_winhttp_proxy_server() {
        candidates.extend(parse_windows_proxy_server(&winhttp_proxy));
    }

    dedupe(candidates)
}

#[cfg(target_os = "windows")]
fn read_windows_registry_auto_config_url() -> Option<String> {
    let output = crate::platform::windows::background_command("reg")
        .args([
            "query",
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
            "/v",
            "AutoConfigURL",
        ])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout
        .lines()
        .find(|line| line.contains("AutoConfigURL"))
        .and_then(|line| line.split("REG_SZ").nth(1))
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|value| value.to_string())
}

#[cfg(target_os = "windows")]
fn read_windows_registry_proxy_server() -> Option<String> {
    let enabled_output = crate::platform::windows::background_command("reg")
        .args([
            "query",
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
            "/v",
            "ProxyEnable",
        ])
        .output()
        .ok()?;
    if !enabled_output.status.success() {
        return None;
    }
    let enabled_stdout = String::from_utf8_lossy(&enabled_output.stdout);
    if !(enabled_stdout.contains("0x1") || enabled_stdout.contains("0x00000001")) {
        return None;
    }

    let server_output = crate::platform::windows::background_command("reg")
        .args([
            "query",
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
            "/v",
            "ProxyServer",
        ])
        .output()
        .ok()?;
    if !server_output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&server_output.stdout);
    stdout
        .lines()
        .find(|line| line.contains("ProxyServer"))
        .and_then(|line| line.split("REG_SZ").nth(1))
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|value| value.to_string())
}

#[cfg(target_os = "windows")]
fn read_windows_winhttp_proxy_server() -> Option<String> {
    let output = crate::platform::windows::background_command("netsh")
        .args(["winhttp", "show", "proxy"])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout.lines().find_map(|line| {
        let trimmed = line.trim();
        if !trimmed.starts_with("Proxy Server") {
            return None;
        }
        trimmed
            .split_once(':')
            .map(|(_, value)| value.trim())
            .filter(|value| !value.is_empty() && *value != "(none)")
            .map(|value| value.to_string())
    })
}

#[cfg(target_os = "windows")]
fn parse_windows_proxy_server(value: &str) -> Vec<String> {
    let mut candidates = Vec::new();
    let trimmed = value.trim();

    if !trimmed.contains('=') {
        push_url(&mut candidates, "http", Some(trimmed), None);
        return dedupe(candidates);
    }

    for part in trimmed
        .split(';')
        .map(str::trim)
        .filter(|part| !part.is_empty())
    {
        let Some((scheme, address)) = part.split_once('=') else {
            continue;
        };
        match scheme.trim().to_ascii_lowercase().as_str() {
            "http" | "https" => push_url(&mut candidates, "http", Some(address.trim()), None),
            "socks" | "socks5" => push_url(&mut candidates, "socks5", Some(address.trim()), None),
            _ => {}
        }
    }

    dedupe(candidates)
}

fn push_url(candidates: &mut Vec<String>, scheme: &str, host: Option<&str>, port: Option<&str>) {
    let Some(host) = host.map(str::trim).filter(|host| !host.is_empty()) else {
        return;
    };

    let url = if host.contains("://") {
        host.to_string()
    } else if let Some(port) = port.map(str::trim).filter(|port| !port.is_empty()) {
        format!("{scheme}://{host}:{port}")
    } else {
        format!("{scheme}://{host}")
    };

    candidates.push(url);
}

fn parse_pac_candidates(pac_url: &str) -> Vec<String> {
    let Some(contents) = load_pac_contents(pac_url) else {
        return Vec::new();
    };

    let uppercase = contents.to_ascii_uppercase();
    let mut candidates = Vec::new();
    for (token, scheme) in [
        ("SOCKS5 ", "socks5"),
        ("SOCKS ", "socks5"),
        ("HTTPS ", "http"),
        ("PROXY ", "http"),
    ] {
        let mut search_from = 0;
        while let Some(relative_index) = uppercase[search_from..].find(token) {
            let start = search_from + relative_index + token.len();
            let rest_original = &contents[start..];
            let mut end = 0;
            for ch in rest_original.chars() {
                if ch == ';' || ch == '"' || ch == '\'' || ch.is_whitespace() {
                    break;
                }
                end += ch.len_utf8();
            }
            let address = rest_original[..end].trim();
            if !address.is_empty() {
                push_url(&mut candidates, scheme, Some(address), None);
            }
            search_from = start;
        }
    }

    dedupe(candidates)
}

fn load_pac_contents(pac_url: &str) -> Option<String> {
    let trimmed = pac_url.trim();
    if trimmed.is_empty() {
        return None;
    }

    if let Some(path) = trimmed.strip_prefix("file://") {
        let decoded = percent_decode_path(path);
        return fs::read_to_string(decoded).ok();
    }

    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        let client = Client::builder()
            .timeout(Duration::from_secs(2))
            .build()
            .ok()?;
        return client.get(trimmed).send().ok()?.text().ok();
    }

    None
}

fn percent_decode_path(path: &str) -> String {
    let bytes = path.as_bytes();
    let mut decoded = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'%' && index + 2 < bytes.len() {
            let hex = &path[index + 1..index + 3];
            if let Ok(value) = u8::from_str_radix(hex, 16) {
                decoded.push(value);
                index += 3;
                continue;
            }
        }
        decoded.push(bytes[index]);
        index += 1;
    }
    String::from_utf8_lossy(&decoded).into_owned()
}

fn dedupe(values: Vec<String>) -> Vec<String> {
    let mut seen = std::collections::HashSet::new();
    let mut deduped = Vec::new();

    for value in values {
        if seen.insert(value.clone()) {
            deduped.push(value);
        }
    }

    deduped
}
