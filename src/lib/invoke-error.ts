/**
 * 统一格式化 Tauri `invoke` / 其他异步调用抛出的错误。
 *
 * Tauri 命令声明为 `Result<_, String>` 时，JS 侧 `invoke` 会以 **字符串** reject，
 * 不是 `Error` 实例。若直接用 `error instanceof Error ? error.message : fallback`
 * 判断，真实错误信息会被 fallback 吞掉。该函数做宽松兼容，保证任何常见形态
 * 的错误都能被转成可读文案显示给用户。
 */
export function formatInvokeError(error: unknown, fallback = "请稍后重试。"): string {
  if (error == null) return fallback;

  if (typeof error === "string") {
    return error.trim() || fallback;
  }

  if (error instanceof Error) {
    return error.message.trim() || fallback;
  }

  if (typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage.trim();
    }
    try {
      const text = String(error);
      if (text && text !== "[object Object]") return text;
    } catch {
      // ignore
    }
  }

  return fallback;
}
