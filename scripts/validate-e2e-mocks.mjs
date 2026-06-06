import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// 中文职责说明：验证 E2E mock 已覆盖状态竞争场景，并且 IPC fixture 会保留场景步骤。
const repoRoot = process.cwd();
const scenariosRoot = path.join(repoRoot, "src", "mocks", "e2e", "scenarios");
const requiredScenarios = [
  {
    kind: "normal",
    file: "normal.ts",
    exportName: "normalScenario",
    outcomes: ["resolve"],
  },
  {
    kind: "empty",
    file: "empty.ts",
    exportName: "emptyScenario",
    outcomes: ["resolve-empty"],
  },
  {
    kind: "failure",
    file: "failure.ts",
    exportName: "failureScenario",
    outcomes: ["resolve", "reject"],
  },
  {
    kind: "delayed",
    file: "delayed.ts",
    exportName: "delayedScenario",
    outcomes: ["resolve"],
    minMaxDelayMs: 500,
  },
  {
    kind: "stale",
    file: "stale.ts",
    exportName: "staleScenario",
    outcomes: ["resolve"],
    requiresOutOfOrderSequence: true,
  },
  {
    kind: "concurrency",
    file: "concurrency.ts",
    exportName: "concurrencyScenario",
    outcomes: ["resolve"],
    requiresOutOfOrderSequence: true,
  },
  {
    kind: "cancel",
    file: "cancel.ts",
    exportName: "cancelScenario",
    outcomes: ["cancel", "resolve"],
  },
  {
    kind: "abort",
    file: "abort.ts",
    exportName: "abortScenario",
    outcomes: ["abort", "resolve"],
  },
  {
    kind: "event-replay",
    file: "event-replay.ts",
    exportName: "eventReplayScenario",
    outcomes: ["resolve", "replay"],
    requiresReplayOlderThanMutation: true,
  },
];

const failures = [];

function repoPath(file) {
  return path.relative(repoRoot, file).replaceAll(path.sep, "/");
}

function readRequired(file) {
  if (!fs.existsSync(file)) {
    failures.push(`缺少文件：${repoPath(file)}`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function assertIncludes(label, text, snippets) {
  for (const snippet of snippets) {
    if (!text.includes(snippet)) {
      failures.push(`${label} 缺少结构片段：${snippet}`);
    }
  }
}

function parseScenarioSteps(file, text) {
  const stepMatches = [
    ...text.matchAll(
      /\{\s*name:\s*"([^"]+)"\s*,\s*delayMs:\s*(\d+)\s*,\s*outcome:\s*"([^"]+)"\s*,\s*sequence:\s*(\d+)\s*,?\s*\}/g,
    ),
  ];

  if (stepMatches.length === 0) {
    failures.push(`${repoPath(file)} 没有可验证的 steps`);
  }

  return stepMatches.map((match) => ({
    name: match[1],
    delayMs: Number(match[2]),
    outcome: match[3],
    sequence: Number(match[4]),
  }));
}

function validateScenarioRegistry() {
  const indexPath = path.join(scenariosRoot, "index.ts");
  const typesPath = path.join(scenariosRoot, "types.ts");
  const indexText = readRequired(indexPath);
  const typesText = readRequired(typesPath);
  const kinds = requiredScenarios.map((scenario) => scenario.kind);

  for (const kind of kinds) {
    const presetKey = kind.includes("-") ? `"${kind}":` : `${kind}:`;
    assertIncludes("src/mocks/e2e/scenarios/index.ts", indexText, [
      `"${kind}"`,
      presetKey,
    ]);
    assertIncludes("src/mocks/e2e/scenarios/types.ts", typesText, [`| "${kind}"`]);
  }

  assertIncludes("src/mocks/e2e/scenarios/index.ts", indexText, [
    "E2E_SCENARIO_KINDS",
    "e2eScenarioPresets",
    "getE2eScenario",
    "createE2eScenarioConfig",
  ]);
}

function validateScenarioFiles() {
  for (const scenario of requiredScenarios) {
    const file = path.join(scenariosRoot, scenario.file);
    const text = readRequired(file);
    const label = repoPath(file);
    assertIncludes(label, text, [
      `export const ${scenario.exportName}`,
      `kind: "${scenario.kind}"`,
      'commands: ["all"]',
    ]);

    const steps = parseScenarioSteps(file, text);
    for (const outcome of scenario.outcomes) {
      if (!steps.some((step) => step.outcome === outcome)) {
        failures.push(`${label} 缺少 outcome：${outcome}`);
      }
    }

    if (scenario.minMaxDelayMs) {
      const maxDelay = Math.max(...steps.map((step) => step.delayMs));
      if (maxDelay < scenario.minMaxDelayMs) {
        failures.push(`${label} delayed 场景最大 delayMs 小于 ${scenario.minMaxDelayMs}`);
      }
    }

    if (scenario.requiresOutOfOrderSequence) {
      const hasLateOlderStep = steps.some((candidate, candidateIndex) =>
        steps.some(
          (other, otherIndex) =>
            otherIndex > candidateIndex &&
            candidate.delayMs > other.delayMs &&
            candidate.sequence < other.sequence,
        ),
      );
      if (!hasLateOlderStep) {
        failures.push(`${label} 缺少晚返回旧序列覆盖风险`);
      }
    }

    if (scenario.requiresReplayOlderThanMutation) {
      const mutation = steps.find((step) => step.name.includes("mutation"));
      const replay = steps.find((step) => step.outcome === "replay");
      if (!mutation || !replay || replay.sequence >= mutation.sequence) {
        failures.push(`${label} replay sequence 必须小于 mutation sequence`);
      }
    }
  }
}

function validateIpcMockBridge() {
  const ipcMockPath = path.join(repoRoot, "src", "mocks", "ipc", "index.ts");
  const fixturePath = path.join(repoRoot, "src", "mocks", "fixtures", "index.ts");
  const commandFixturePath = path.join(
    repoRoot,
    "src",
    "mocks",
    "fixtures",
    "ipc-command-fixtures.ts",
  );
  const ipcMockText = readRequired(ipcMockPath);
  const fixtureText = readRequired(fixturePath);
  const commandFixtureText = readRequired(commandFixturePath);

  assertIncludes("src/mocks/ipc/index.ts", ipcMockText, [
    "createE2eScenarioConfig",
    "getE2eScenario",
    "resolveIpcMockSteps",
    "createIpcMockResponse",
    "const steps = resolveIpcMockSteps",
    "fixture.handler({ args, command, steps })",
  ]);
  assertIncludes("src/mocks/fixtures/index.ts", fixtureText, [
    "scenario:",
    "outcome: step.outcome",
    "sequence: step.sequence",
    "stepName: step.stepName",
    "resolveEnvelopeStatus",
  ]);
  assertIncludes("src/mocks/fixtures/ipc-command-fixtures.ts", commandFixtureText, [
    "assertIpcFixtureCoverage",
    "IPC_COMMAND_DEFINITIONS.reduce",
    "createEvidenceBackedIpcFixture",
  ]);
}

validateScenarioRegistry();
validateScenarioFiles();
validateIpcMockBridge();

if (failures.length > 0) {
  console.error("E2E mock 场景验证失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`E2E mock 场景验证通过：${requiredScenarios.length}/${requiredScenarios.length}`);
