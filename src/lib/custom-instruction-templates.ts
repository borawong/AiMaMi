export interface CustomInstructionTemplate {
  code: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  applyCount?: number;
  source: "builtin" | "remote";
}

export const builtinCustomInstructionTemplates: CustomInstructionTemplate[] = [
  {
    code: "zh-structured",
    title: "高密度中文工程助手",
    summary: "默认中文、先结论后分析，适合高频开发协作。",
    tags: ["通用", "中文", "高密度"],
    source: "builtin",
    body: `默认使用简体中文。\n先给结论，再讲原因，再给下一步。\n回答保持结构化、高信息密度、少废话。\n修复问题前先核查主链与副作用，优先最小必要改动。`,
  },
  {
    code: "review-first",
    title: "严格代码审查",
    summary: "优先输出问题、风险和测试缺口，适合审查与复盘。",
    tags: ["审查", "严格模式", "风险"],
    source: "builtin",
    body: `当任务是代码审查时，先列出问题，再讲风险，再给结论。\n按严重性排序，优先指出行为回归、边界条件、缺少校验和测试缺口。\n没有问题时，明确说明“未发现明确缺陷”，并补充残留风险。`,
  },
  {
    code: "safe-fix",
    title: "安全修复优先",
    summary: "修 bug 前先核查副作用，适合稳定链路和线上功能。",
    tags: ["修复", "稳定性", "副作用"],
    source: "builtin",
    body: `修复前先说明当前流程、根因判断、影响范围和可能副作用。\n默认只改最小必要层，不顺手重构稳定链。\n完成后说明验证路径、受影响模块和是否存在残留边界。`,
  },
  {
    code: "frontend-polish",
    title: "前端体验优化",
    summary: "关注 UI 语义、交互清晰度和设计一致性。",
    tags: ["前端", "体验", "设计"],
    source: "builtin",
    body: `当前端任务涉及设计和交互时，优先收口信息层级、控件语义和状态反馈。\n保留现有设计系统，不随意引入新的视觉语言。\n默认说明“当前流程 → 问题 → 优化后流程 → 用户体感变化”。`,
  },
];

export function mergeCustomInstructionTemplates(
  remoteTemplates: Array<Partial<CustomInstructionTemplate> & { code: string }> = [],
): CustomInstructionTemplate[] {
  const merged = new Map<string, CustomInstructionTemplate>();

  for (const template of builtinCustomInstructionTemplates) {
    merged.set(template.code, template);
  }

  for (const remoteTemplate of remoteTemplates) {
    const current = merged.get(remoteTemplate.code);
    merged.set(remoteTemplate.code, {
      code: remoteTemplate.code,
      title: remoteTemplate.title ?? current?.title ?? remoteTemplate.code,
      summary: remoteTemplate.summary ?? current?.summary ?? "",
      body: remoteTemplate.body ?? current?.body ?? "",
      tags: remoteTemplate.tags ?? current?.tags ?? [],
      applyCount: remoteTemplate.applyCount ?? current?.applyCount,
      source: "remote",
    });
  }

  return Array.from(merged.values());
}
