import i18n from "@/lib/i18n";

function lang(): string {
  return i18n.language ?? "zh";
}

function locale(): string {
  return lang() === "zh" ? "zh-CN" : "en-US";
}

/**
 * 完整日期时间
 * 中文环境示例 → 2026/03/03 14:41
 * 英文环境示例 → Mar 3, 2026 14:41
 */
export function formatDateTime(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  if (lang() === "zh") {
    const date = d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const time = d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${date} ${time}`;
  }
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} ${time}`;
}

/**
 * 仅日期
 * 中文环境示例 → 2026/04/01
 * 英文环境示例 → Apr 1, 2026
 */
export function formatDate(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  if (lang() === "zh") {
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * 短日期 M/D
 * → 4/5
 */
export function formatDateShort(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 相对时间
 * 中文环境示例 → 刚刚 / 5 分钟前 / 3 小时前 / 2 天前 / 回退到 formatDate
 * 英文环境示例 → just now / 5m ago / 3h ago / 2d ago / 回退到 formatDate
 */
export function formatRelative(epochSec: number): string {
  const diff = Math.floor(Date.now() / 1000 - epochSec);
  const isZh = lang() === "zh";

  if (diff < 60) return isZh ? "刚刚" : "just now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return isZh ? `${m} 分钟前` : `${m}m ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return isZh ? `${h} 小时前` : `${h}h ago`;
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400);
    return isZh ? `${d} 天前` : `${d}d ago`;
  }
  return formatDate(epochSec);
}

/**
 * 剩余倒计时
 * 中文环境示例 → 剩余 2 小时 5 分 / 剩余 45 分
 * 英文环境示例 → 2h 5m remaining / 45m remaining
 */
export function formatRemaining(diffSec: number): string {
  const isZh = lang() === "zh";
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);

  if (isZh) {
    if (h > 0) return `剩余 ${h} 小时 ${m} 分`;
    return `剩余 ${m} 分`;
  }
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

/**
 * 时长
 * 中文环境示例 → 45 分钟 / 2 小时 30 分
 * 英文环境示例 → 45m / 2h 30m
 */
export function formatDuration(minutes: number): string {
  const isZh = lang() === "zh";
  if (minutes < 60) return isZh ? `${minutes} 分钟` : `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (isZh) {
    return rest > 0 ? `${h} 小时 ${rest} 分` : `${h} 小时`;
  }
  return rest > 0 ? `${h}h ${rest}m` : `${h}h`;
}

/**
 * 重置标签 (带倒计时)
 * 中文环境示例 → 4/5 14:41 重置 | 剩余 2 小时 5 分
 * 英文环境示例 → 4/5 14:41 reset | 2h 5m remaining
 */
export function formatResetLabel(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  const isZh = lang() === "zh";
  const now = Date.now() / 1000;
  const diff = epochSec - now;

  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
  const timeStr = d.toLocaleTimeString(locale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const resetWord = isZh ? "重置" : "reset";

  if (diff <= 0) return `${dateStr} ${timeStr} ${resetWord}`;

  return `${dateStr} ${timeStr} ${resetWord} | ${formatRemaining(diff)}`;
}

/**
 * 热力图月份缩写
 * 中文环境示例 → 1月 / 2月
 * 英文环境示例 → Jan / Feb
 */
export function formatMonthShort(date: Date): string {
  return date.toLocaleString(locale(), { month: "short" });
}

/**
 * 热力图 tooltip 日期
 * 中文环境示例 → 2026/04/01
 * 英文环境示例 → Apr 1, 2026
 */
export function formatHeatmapDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const epochSec = Math.floor(d.getTime() / 1000);
  return formatDate(epochSec);
}

/**
 * 完整日期时间用于 title 悬停提示
 * 中文环境示例 → 2026/04/02 14:30
 * 英文环境示例 → Apr 2, 2026 14:30
 */
export function formatDateTimeFull(epochSec: number): string {
  return formatDateTime(epochSec);
}
