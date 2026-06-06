/**
 * 中文职责说明：tray-shell 模块本地读取器只解析通知客户端 envelope，不外借共享证据面板。
 */
export function envelopeData(value: unknown): unknown {
  if (isRecord(value) && "data" in value) {
    return value.data;
  }

  return value;
}

export function readString(
  value: unknown,
  paths: string[],
  fallback = "",
): string {
  for (const path of paths) {
    const candidate = readPath(value, path);
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
    if (typeof candidate === "number" || typeof candidate === "boolean") {
      return String(candidate);
    }
  }

  return fallback;
}

export function readBoolean(
  value: unknown,
  paths: string[],
  fallback = false,
): boolean {
  for (const path of paths) {
    const candidate = readPath(value, path);
    if (typeof candidate === "boolean") {
      return candidate;
    }
  }

  return fallback;
}

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[key];
  }, value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
