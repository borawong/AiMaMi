export type LocaleNode =
  | string
  | number
  | boolean
  | null
  | readonly LocaleNode[]
  | LocaleBranch;

export type LocaleBranch = {
  readonly [key: string]: LocaleNode;
};

export type LocaleBundle = {
  readonly zh: LocaleBranch;
  readonly en: LocaleBranch;
};

export type LocaleModule = LocaleBundle & {
  readonly name: string;
};

// 新模块先在这里登记，保持聚合入口稳定，避免一次性拆散集中 JSON。
const localeModules: readonly LocaleModule[] = [];

export function mergeLocaleModules(
  base: LocaleBundle,
  modules: readonly LocaleModule[] = localeModules,
): LocaleBundle {
  if (modules.length === 0) {
    return base;
  }

  return modules.reduce<LocaleBundle>(
    (merged, module) => {
      assertLocaleParity(module);
      return {
        zh: mergeBranch(merged.zh, module.zh),
        en: mergeBranch(merged.en, module.en),
      };
    },
    { zh: base.zh, en: base.en },
  );
}

export const registeredLocaleModules = localeModules;

function mergeBranch(base: LocaleBranch, patch: LocaleBranch): LocaleBranch {
  const merged: Record<string, LocaleNode> = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    const current = merged[key];
    merged[key] =
      isLocaleBranch(current) && isLocaleBranch(value)
        ? mergeBranch(current, value)
        : value;
  }

  return merged;
}

function assertLocaleParity(module: LocaleModule): void {
  const zhPaths = collectLeafPaths(module.zh);
  const enPaths = collectLeafPaths(module.en);
  const zhSet = new Set(zhPaths);
  const enSet = new Set(enPaths);
  const missingInEn = zhPaths.filter((path) => !enSet.has(path));
  const missingInZh = enPaths.filter((path) => !zhSet.has(path));

  if (missingInEn.length > 0 || missingInZh.length > 0) {
    throw new Error(
      [
        `Locale module ${module.name} zh/en keys mismatch.`,
        missingInEn.length > 0
          ? `Missing in en: ${missingInEn.join(", ")}.`
          : "",
        missingInZh.length > 0
          ? `Missing in zh: ${missingInZh.join(", ")}.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
}

function collectLeafPaths(branch: LocaleBranch, prefix = ""): string[] {
  const paths: string[] = [];

  for (const [key, value] of Object.entries(branch)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isLocaleBranch(value)) {
      paths.push(...collectLeafPaths(value, path));
      continue;
    }
    paths.push(path);
  }

  return paths.sort();
}

function isLocaleBranch(value: LocaleNode | undefined): value is LocaleBranch {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
