export const DUMPED_CUSTOM_INSTRUCTIONS_COMMANDS = [
  {
    "command": "apply_custom_instruction",
    "domain": "custom-instructions",
    "wrappers": [
      "applyCustomInstruction"
    ],
    "argKeys": [
      "content",
      "source",
      "templateCode",
      "templateTitle"
    ],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  },
  {
    "command": "clear_custom_instruction_block",
    "domain": "custom-instructions",
    "wrappers": [
      "clearCustomInstructionBlock"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  },
  {
    "command": "load_custom_instruction_state",
    "domain": "custom-instructions",
    "wrappers": [
      "loadCustomInstructionState"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  },
  {
    "command": "preview_custom_instruction_apply",
    "domain": "custom-instructions",
    "wrappers": [
      "previewCustomInstructionApply"
    ],
    "argKeys": [
      "content"
    ],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  },
  {
    "command": "rollback_custom_instruction",
    "domain": "custom-instructions",
    "wrappers": [
      "rollbackCustomInstruction"
    ],
    "argKeys": [
      "historyId"
    ],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  }
] as const;

export type DumpedCustomInstructionsCommand = (typeof DUMPED_CUSTOM_INSTRUCTIONS_COMMANDS)[number];
