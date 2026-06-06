import type { E2eScenario } from "./types";

export const emptyScenario: E2eScenario = {
  kind: "empty",
  commands: ["all"],
  steps: [
    { name: "empty-response", delayMs: 0, outcome: "resolve-empty", sequence: 1 },
  ],
};
