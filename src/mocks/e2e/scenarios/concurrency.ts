import type { E2eScenario } from "./types";

export const concurrencyScenario: E2eScenario = {
  kind: "concurrency",
  commands: ["all"],
  steps: [
    { name: "first-flight", delayMs: 500, outcome: "resolve", sequence: 7 },
    { name: "second-flight", delayMs: 100, outcome: "resolve", sequence: 8 },
  ],
};
