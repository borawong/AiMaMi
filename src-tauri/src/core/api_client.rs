use crate::core::auth::ApiRequestContext;
use crate::core::models::{
    ApiProxyConfigPayload, ApiProxyDetectPayload, ApiProxyMode, ApiProxyTestPayload, CoreError,
};
use reqwest::blocking::Client;
use std::time::Duration;

pub fn sanitize_proxy_config(
    config: &ApiProxyConfigPayload,
) -> Result<ApiProxyConfigPayload, CoreError> {
    match config.mode {
        ApiProxyMode::Direct => Ok(ApiProxyConfigPayload {
            mode: ApiProxyMode::Direct,
            url: None,
        }),
        ApiProxyMode::Manual => {
            let url = config
                .url
                .as_deref()
                .map(str::trim)
                .filter(|v| !v.is_empty())
                .ok_or_else(|| {
                    CoreError::InvalidData("Manual proxy mode requires a proxy URL".into())
                })?;
            validate_proxy_url(url)?;
            Ok(ApiProxyConfigPayload {
                mode: ApiProxyMode::Manual,
                url: Some(url.to_string()),
            })
        }
    }
}

pub fn test_api_connectivity(
    config: &ApiProxyConfigPayload,
    _context: Option<&ApiRequestContext>,
) -> ApiProxyTestPayload {
    let normalized = match sanitize_proxy_config(config) {
        Ok(normalized) => normalized,
        Err(error) => {
            return ApiProxyTestPayload {
                code: "invalid_config".into(),
                reachable: false,
                status_code: None,
                message: error.to_string(),
            }
        }
    };

    let mut builder = Client::builder().timeout(Duration::from_secs(8));
    if let Some(url) = normalized.url.as_deref() {
        match reqwest::Proxy::all(url) {
            Ok(proxy) => builder = builder.proxy(proxy),
            Err(error) => {
                return ApiProxyTestPayload {
                    code: "client_build_failed".into(),
                    reachable: false,
                    status_code: None,
                    message: error.to_string(),
                }
            }
        }
    }

    let client = match builder.build() {
        Ok(client) => client,
        Err(error) => {
            return ApiProxyTestPayload {
                code: "client_build_failed".into(),
                reachable: false,
                status_code: None,
                message: error.to_string(),
            }
        }
    };

    match client.get("https://chatgpt.com/").send() {
        Ok(response) => ApiProxyTestPayload {
            code: "ok".into(),
            reachable: true,
            status_code: Some(response.status().as_u16() as i32),
            message: "Reachable".into(),
        },
        Err(error) => ApiProxyTestPayload {
            code: "network_error".into(),
            reachable: false,
            status_code: None,
            message: error.to_string(),
        },
    }
}

pub fn detect_api_proxy_config(context: Option<&ApiRequestContext>) -> ApiProxyDetectPayload {
    let direct = test_api_connectivity(
        &ApiProxyConfigPayload {
            mode: ApiProxyMode::Direct,
            url: None,
        },
        context,
    );
    if direct.reachable {
        return ApiProxyDetectPayload {
            found: true,
            mode: Some(ApiProxyMode::Direct),
            url: None,
            probe: direct,
        };
    }

    let candidates = [
        "http://127.0.0.1:7890",
        "http://127.0.0.1:7897",
        "socks5://127.0.0.1:7890",
        "http://127.0.0.1:1087",
        "socks5://127.0.0.1:1080",
    ];

    for candidate in candidates {
        let probe = test_api_connectivity(
            &ApiProxyConfigPayload {
                mode: ApiProxyMode::Manual,
                url: Some(candidate.into()),
            },
            context,
        );
        if probe.reachable {
            return ApiProxyDetectPayload {
                found: true,
                mode: Some(ApiProxyMode::Manual),
                url: Some(candidate.into()),
                probe,
            };
        }
    }

    ApiProxyDetectPayload {
        found: false,
        mode: None,
        url: None,
        probe: ApiProxyTestPayload {
            code: "not_found".into(),
            reachable: false,
            status_code: None,
            message: direct.message,
        },
    }
}

fn validate_proxy_url(url: &str) -> Result<(), CoreError> {
    let parsed = reqwest::Url::parse(url)
        .map_err(|error| CoreError::InvalidData(format!("Invalid proxy URL: {error}")))?;
    match parsed.scheme() {
        "http" | "https" | "socks5" | "socks5h" => Ok(()),
        scheme => Err(CoreError::InvalidData(format!(
            "Unsupported proxy scheme: {scheme}"
        ))),
    }
}
