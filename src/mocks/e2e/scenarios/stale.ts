import type { E2eScenario } from "./types";

export const staleScenario: E2eScenario = {
  kind: "stale",
  commands: ["all"],
  steps: [
    { name: "old-refresh", delayMs: 400, outcome: "resolve", sequence: 1 },
    {
      name: "authoritative-mutation",
      delayMs: 50,
      outcome: "resolve",
      sequence: 2,
    },
  ],
};
