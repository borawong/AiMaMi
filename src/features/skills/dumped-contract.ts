/**
 * 中文职责说明：记录 skills 模块由 dumped 证据确认的命令、来源文件和包装调用链。
 */

export const DUMPED_SKILLS_COMMANDS = [
  {
    "command": "delete_skill_backup",
    "domain": "skills",
    "wrappers": [
      "deleteSkillBackup"
    ],
    "argKeys": [
      "id"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/skills-page-R7hR7Rs1.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "import_skill",
    "domain": "skills",
    "wrappers": [
      "importSkill"
    ],
    "argKeys": [
      "path"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/skills-page-R7hR7Rs1.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "load_installed_skills",
    "domain": "skills",
    "wrappers": [
      "loadInstalledSkills"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/skills-page-R7hR7Rs1.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 2
  },
  {
    "command": "load_skill_backups",
    "domain": "skills",
    "wrappers": [
      "loadSkillBackups"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/skills-page-R7hR7Rs1.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "remove_skill",
    "domain": "skills",
    "wrappers": [
      "removeSkill"
    ],
    "argKeys": [
      "id"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/skills-page-R7hR7Rs1.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "restore_skill_backup",
    "domain": "skills",
    "wrappers": [
      "restoreSkillBackup"
    ],
    "argKeys": [
      "id"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/skills-page-R7hR7Rs1.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  }
] as const;

export type DumpedSkillsCommand = (typeof DUMPED_SKILLS_COMMANDS)[number];
