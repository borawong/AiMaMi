import type { E2eScenario } from "./types";

export const normalScenario: E2eScenario = {
  kind: "normal",
  commands: ["all"],
  steps: [{ name: "normal-response", delayMs: 0, outcome: "resolve", sequence: 1 }],
};
