import type { E2eScenario } from "./types";

export const delayedScenario: E2eScenario = {
  kind: "delayed",
  commands: ["all"],
  steps: [
    { name: "slow-full-refresh", delayMs: 900, outcome: "resolve", sequence: 3 },
    { name: "active-refresh", delayMs: 80, outcome: "resolve", sequence: 4 },
  ],
};
